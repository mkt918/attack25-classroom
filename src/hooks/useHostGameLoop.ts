import { useCallback, useRef, useState } from "react";
import { ref } from "firebase/database";
import { getDb } from "../firebase/config";
import { roomAnswerPath, roomBuzzFirstPath, roomPanelPickPath } from "../firebase/paths";
import { waitForValue, withTimeout, sleep } from "../firebase/listen";
import * as actions from "../firebase/roomActions";
import { resolveFlip, applyCorrectAnswer, canClaimPanel, checkImmediateVictory } from "../engine";
import {
  createEmptyBoard,
  toPublicQuestion,
  type AnswerState,
  type Board,
  type PanelPick,
  type Player,
  type QuestionSet,
  type RuleConfig,
} from "../types/game";

const Q_READING_MS = 1500;

/**
 * ホストのブラウザだけが実行する審判ロジック。
 * 生徒クライアントは入力(早押し・解答・パネル選択)を書き込むだけで、
 * このフックが RTDB を purely-functional なルールエンジンで裁いて状態を書き戻す。
 */
export function useHostGameLoop(
  sessionId: string,
  roomId: string,
  questionSet: QuestionSet,
  config: RuleConfig
) {
  const runningRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-30), line]);
  }, []);

  const startGame = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    appendLog("ゲーム開始");

    const db = getDb();
    let board: Board = createEmptyBoard();
    const players: Record<string, Player> = await actions.getPlayers(sessionId, roomId);
    const allUids = Object.keys(players);

    try {
      for (let qIndex = 0; qIndex < questionSet.questions.length; qIndex++) {
        const question = questionSet.questions[qIndex];
        await actions.setQuestionIndex(sessionId, roomId, qIndex);
        await actions.publishQuestion(sessionId, roomId, toPublicQuestion(question));
        await actions.setPhase(sessionId, roomId, "q_reading");
        appendLog(`第${qIndex + 1}問: ${question.text}`);
        await sleep(Q_READING_MS);

        const remainingUids = new Set(allUids);
        let solved = false;

        while (remainingUids.size > 0 && !solved) {
          await actions.clearAnswer(sessionId, roomId);
          await actions.clearPanelPick(sessionId, roomId);
          await actions.openBuzz(sessionId, roomId);
          await actions.setPhase(sessionId, roomId, "buzz_open");

          const firstRef = ref(db, roomBuzzFirstPath(sessionId, roomId));
          const buzzWaiter = waitForValue<{ uid: string; at: number }>(
            firstRef,
            (v) => v !== null && remainingUids.has(v.uid)
          );
          const buzz = await buzzWaiter.promise;
          const buzzUid = buzz.uid;
          appendLog(`${players[buzzUid]?.name ?? buzzUid} が解答権獲得`);

          await actions.closeBuzz(sessionId, roomId);
          const deadline = Date.now() + config.answerTimeoutSec * 1000;
          await actions.setPhase(sessionId, roomId, "answering", deadline);

          const answerRef = ref(db, roomAnswerPath(sessionId, roomId));
          const waiter = waitForValue<AnswerState>(
            answerRef,
            (v) => v !== null && v.uid === buzzUid
          );
          const answer = await withTimeout(waiter, deadline - Date.now());

          const isCorrect = answer !== null && answer.choiceIndex === question.answerIndex;

          if (!isCorrect) {
            remainingUids.delete(buzzUid);
            appendLog(`${players[buzzUid]?.name ?? buzzUid} 不正解/時間切れ`);
            await actions.appendJudgeLog(sessionId, roomId, "wrong_or_timeout", {
              uid: buzzUid,
              qIndex,
            });
            continue;
          }

          solved = true;
          players[buzzUid] = applyCorrectAnswer(players[buzzUid], config);
          await actions.updatePlayer(sessionId, roomId, buzzUid, players[buzzUid]);
          await actions.appendJudgeLog(sessionId, roomId, "correct", { uid: buzzUid, qIndex });
          appendLog(`${players[buzzUid]?.name ?? buzzUid} 正解!パネルを選択中...`);

          await actions.setPhase(sessionId, roomId, "panel_select");
          const panelRef = ref(db, roomPanelPickPath(sessionId, roomId));
          const currentBoard = board;
          const pickWaiter = waitForValue<PanelPick>(
            panelRef,
            (v) => v !== null && v.uid === buzzUid && canClaimPanel(currentBoard, v.panelIndex)
          );
          const pick = await pickWaiter.promise;

          board = resolveFlip(board, pick.panelIndex, buzzUid, config);
          await actions.setBoard(sessionId, roomId, board);
          await actions.appendJudgeLog(sessionId, roomId, "panel_flip", {
            uid: buzzUid,
            index: pick.panelIndex,
          });
          await actions.clearPanelPick(sessionId, roomId);
          appendLog(`パネル${pick.panelIndex + 1}を確保`);

          const winners = checkImmediateVictory(board, allUids, config);
          if (winners) {
            appendLog(`勝者確定: ${winners.map((u) => players[u]?.name ?? u).join(", ")}`);
            await actions.setPhase(sessionId, roomId, "result");
            return;
          }
        }
      }

      appendLog("出題終了");
      await actions.setPhase(sessionId, roomId, "result");
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }, [sessionId, roomId, questionSet, config, appendLog]);

  return { startGame, isRunning, log };
}
