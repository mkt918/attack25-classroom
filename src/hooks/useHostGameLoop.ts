import { useCallback, useMemo, useRef, useState } from "react";
import { ref } from "firebase/database";
import { getDb } from "../firebase/config";
import { roomAnswerPath, roomBuzzFirstPath, roomPanelPickPath } from "../firebase/paths";
import { waitForValue, sleep } from "../firebase/listen";
import { RoomController } from "../firebase/gameController";
import * as actions from "../firebase/roomActions";
import {
  resolveFlip,
  applyCorrectAnswer,
  canClaimPanel,
  checkImmediateVictory,
  getSelectablePanelIndices,
  getErasablePanelIndices,
  isAttackChanceQuestion,
  shuffle,
} from "../engine";
import {
  createEmptyBoard,
  toPublicQuestion,
  type AnswerState,
  type Board,
  type PanelPick,
  type Player,
  type Question,
  type QuestionSet,
  type RuleConfig,
} from "../types/game";

const Q_READING_MS = 1500;

type QuestionOutcome = "solved" | "skipped" | "exhausted" | "stopped";

/**
 * ホストのブラウザだけが実行する審判ロジック。
 * 生徒クライアントは入力(早押し・解答・パネル選択)を書き込むだけで、
 * このフックが RTDB を purely-functional なルールエンジンで裁いて状態を書き戻す。
 * RoomController 経由で「一時停止」「スキップ」「強制終了」の介入を受け付ける。
 */
export function useHostGameLoop(
  sessionId: string,
  roomId: string,
  questionSet: QuestionSet,
  config: RuleConfig
) {
  const runningRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const controller = useMemo(() => new RoomController(), []);

  const appendLog = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-40), line]);
  }, []);

  const runOneQuestion = useCallback(
    async (
      question: Question,
      qIndex: number,
      totalQuestionCount: number,
      board: Board,
      players: Record<string, Player>,
      eligibleUids: string[]
    ): Promise<{ outcome: QuestionOutcome; board: Board }> => {
      const db = getDb();
      const remainingUids = new Set(
        eligibleUids.filter((uid) => players[uid]?.connected !== false)
      );
      const attackChance = isAttackChanceQuestion(
        qIndex,
        totalQuestionCount,
        config.finalAttackQuestions
      );

      while (remainingUids.size > 0) {
        await controller.waitIfPaused();
        if (controller.isStopped) return { outcome: "stopped", board };

        await actions.clearAnswer(sessionId, roomId);
        await actions.clearPanelPick(sessionId, roomId);
        await actions.openBuzz(sessionId, roomId);
        await actions.setPhase(sessionId, roomId, "buzz_open");

        const firstRef = ref(db, roomBuzzFirstPath(sessionId, roomId));
        const buzzWaiter = waitForValue<{ uid: string; at: number }>(
          firstRef,
          (v) => v !== null && remainingUids.has(v.uid)
        );
        const buzzRaced = await controller.race(buzzWaiter.promise);
        if (buzzRaced.skipped) {
          buzzWaiter.cancel();
          return { outcome: controller.isStopped ? "stopped" : "skipped", board };
        }
        const buzzUid = buzzRaced.value.uid;
        appendLog(`${players[buzzUid]?.name ?? buzzUid} が解答権獲得`);

        await actions.closeBuzz(sessionId, roomId);
        const deadline = Date.now() + config.answerTimeoutSec * 1000;
        await actions.setPhase(sessionId, roomId, "answering", deadline);

        const answerRef = ref(db, roomAnswerPath(sessionId, roomId));
        const answerWaiter = waitForValue<AnswerState>(
          answerRef,
          (v) => v !== null && v.uid === buzzUid
        );
        const timeoutPromise: Promise<AnswerState | null> = sleep(
          Math.max(0, deadline - Date.now())
        ).then(() => null);
        const answerRaced = await controller.race(
          Promise.race([answerWaiter.promise, timeoutPromise])
        );
        if (answerRaced.skipped) {
          answerWaiter.cancel();
          return { outcome: controller.isStopped ? "stopped" : "skipped", board };
        }
        const answer = answerRaced.value;
        const isCorrect = answer !== null && answer.choiceIndex === question.answerIndex;

        if (!isCorrect) {
          answerWaiter.cancel();
          remainingUids.delete(buzzUid);
          if (config.wrongRestQuestions > 0) {
            players[buzzUid] = {
              ...players[buzzUid],
              restQuestionsLeft: config.wrongRestQuestions,
            };
            await actions.updatePlayer(sessionId, roomId, buzzUid, {
              restQuestionsLeft: players[buzzUid].restQuestionsLeft,
            });
          }
          appendLog(
            `${players[buzzUid]?.name ?? buzzUid} 不正解/時間切れ(${config.wrongRestQuestions}問休み)`
          );
          await actions.appendJudgeLog(sessionId, roomId, "wrong_or_timeout", {
            uid: buzzUid,
            qIndex,
          });
          continue;
        }

        players[buzzUid] = applyCorrectAnswer(players[buzzUid], config);
        await actions.updatePlayer(sessionId, roomId, buzzUid, players[buzzUid]);
        await actions.appendJudgeLog(sessionId, roomId, "correct", { uid: buzzUid, qIndex });
        appendLog(
          attackChance
            ? `${players[buzzUid]?.name ?? buzzUid} 正解!アタックチャンス、消すパネルを選択中...`
            : `${players[buzzUid]?.name ?? buzzUid} 正解!パネルを選択中...`
        );

        await actions.setPhase(sessionId, roomId, "panel_select");
        const panelRef = ref(db, roomPanelPickPath(sessionId, roomId));
        const currentBoard = board;
        const validIndices = new Set(
          attackChance
            ? getErasablePanelIndices(currentBoard)
            : config.flipMode === "othello"
              ? getSelectablePanelIndices(currentBoard, buzzUid)
              : currentBoard.map((_, i) => i).filter((i) => canClaimPanel(currentBoard, i))
        );
        const pickWaiter = waitForValue<PanelPick>(
          panelRef,
          (v) => v !== null && v.uid === buzzUid && validIndices.has(v.panelIndex)
        );
        const pickRaced = await controller.race(pickWaiter.promise);
        if (pickRaced.skipped) {
          pickWaiter.cancel();
          return { outcome: controller.isStopped ? "stopped" : "skipped", board };
        }
        const pick = pickRaced.value;

        let newBoard: Board;
        if (attackChance) {
          newBoard = [...board];
          newBoard[pick.panelIndex] = null;
          await actions.setBoard(sessionId, roomId, newBoard);
          await actions.appendJudgeLog(sessionId, roomId, "attack_chance_erase", {
            uid: buzzUid,
            index: pick.panelIndex,
          });
          appendLog(`パネル${pick.panelIndex + 1}を消去`);
        } else {
          newBoard = resolveFlip(board, pick.panelIndex, buzzUid, config);
          await actions.setBoard(sessionId, roomId, newBoard);
          await actions.appendJudgeLog(sessionId, roomId, "panel_flip", {
            uid: buzzUid,
            index: pick.panelIndex,
          });
          appendLog(`パネル${pick.panelIndex + 1}を確保`);
        }
        await actions.clearPanelPick(sessionId, roomId);

        return { outcome: "solved", board: newBoard };
      }

      return { outcome: "exhausted", board };
    },
    [sessionId, roomId, config, controller, appendLog]
  );

  const startGame = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    appendLog("ゲーム開始");

    let board: Board = createEmptyBoard();
    const players: Record<string, Player> = await actions.getPlayers(sessionId, roomId);
    let allUids = Object.keys(players);
    const orderedQuestions = config.randomizeQuestions
      ? shuffle(questionSet.questions)
      : questionSet.questions;
    const questionCount =
      typeof config.totalCount === "number"
        ? Math.min(config.totalCount, orderedQuestions.length)
        : orderedQuestions.length;
    await actions.setTotalQuestionCount(sessionId, roomId, questionCount);

    try {
      for (let qIndex = 0; qIndex < questionCount; qIndex++) {
        await controller.waitIfPaused();
        if (controller.isStopped) break;

        // 進行中に新しく参加した生徒も、以後の問題から早押しに加われるようにする
        const currentPlayers = await actions.getPlayers(sessionId, roomId);
        for (const uid of Object.keys(currentPlayers)) {
          if (!players[uid]) {
            players[uid] = currentPlayers[uid];
            allUids.push(uid);
          }
        }

        const eligibleUids: string[] = [];
        for (const uid of allUids) {
          const player = players[uid];
          if (player.restQuestionsLeft > 0) {
            players[uid] = { ...player, restQuestionsLeft: player.restQuestionsLeft - 1 };
            await actions.updatePlayer(sessionId, roomId, uid, {
              restQuestionsLeft: players[uid].restQuestionsLeft,
            });
          } else {
            eligibleUids.push(uid);
          }
        }

        const question = orderedQuestions[qIndex];
        await actions.setQuestionIndex(sessionId, roomId, qIndex);
        await actions.publishQuestion(sessionId, roomId, toPublicQuestion(question));
        await actions.setPhase(sessionId, roomId, "q_reading");
        appendLog(`第${qIndex + 1}問: ${question.text}`);
        await sleep(Q_READING_MS);

        const result = await runOneQuestion(
          question,
          qIndex,
          questionCount,
          board,
          players,
          eligibleUids
        );
        board = result.board;

        if (result.outcome === "stopped") break;
        if (result.outcome === "skipped") {
          appendLog("この問題をスキップしました");
          continue;
        }

        if (question.explanation) {
          await actions.publishExplanation(sessionId, roomId, question.explanation);
          await actions.setPhase(sessionId, roomId, "explanation");
          appendLog(`解説を表示: ${question.explanation}`);
          await sleep(config.explanationDisplaySec * 1000);
          await actions.publishExplanation(sessionId, roomId, null);
        }

        if (result.outcome === "exhausted") {
          appendLog("誰も正解できませんでした");
          continue;
        }

        const winners = checkImmediateVictory(board, allUids, config);
        if (winners) {
          appendLog(`勝者確定: ${winners.map((u) => players[u]?.name ?? u).join(", ")}`);
          await actions.setPhase(sessionId, roomId, "result");
          return;
        }
      }

      if (!controller.isStopped) {
        appendLog("出題終了");
      } else {
        appendLog("進行を終了しました");
      }
      await actions.setPhase(sessionId, roomId, "result");
    } finally {
      runningRef.current = false;
      setIsRunning(false);
    }
  }, [sessionId, roomId, questionSet, config, controller, appendLog, runOneQuestion]);

  const pause = useCallback(() => {
    controller.pause();
    setIsPaused(true);
    appendLog("一時停止しました");
  }, [controller, appendLog]);

  const resume = useCallback(() => {
    controller.resume();
    setIsPaused(false);
    appendLog("再開しました");
  }, [controller, appendLog]);

  const skipQuestion = useCallback(() => {
    controller.skip();
    appendLog("スキップを要求しました");
  }, [controller, appendLog]);

  const stopGame = useCallback(() => {
    controller.stop();
    appendLog("終了を要求しました");
  }, [controller, appendLog]);

  return { startGame, pause, resume, skipQuestion, stopGame, isRunning, isPaused, log };
}
