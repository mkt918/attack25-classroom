import { useState } from "react";
import { parseTsv, questionsToTsv } from "../data/questionStore";
import type { QuestionSet } from "../types/game";

interface QuestionSetEditorProps {
  value: QuestionSet;
  onChange: (set: QuestionSet) => void;
}

/**
 * スプレッドシートからのTSVコピペで問題を投入するエディタ。
 * 列: 問題文 / 選択肢1-4 / 正解番号(1-4)
 */
export function QuestionSetEditor({ value, onChange }: QuestionSetEditorProps) {
  const [tsvDraft, setTsvDraft] = useState(() => questionsToTsv(value.questions));
  const [errors, setErrors] = useState<string[]>([]);

  function applyTsv() {
    const { questions, errors: parseErrors } = parseTsv(tsvDraft);
    setErrors(parseErrors);
    if (questions.length > 0) {
      onChange({ ...value, questions });
    }
  }

  return (
    <div>
      <label className="field-label" style={{ marginBottom: 0 }}>
        問題集タイトル
        <input
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </label>

      <p className="field-note" style={{ marginTop: "var(--space-xs)" }}>
        列: 問題文 / 選択肢1 / 選択肢2 / 選択肢3 / 選択肢4 / 正解番号(1-4)。
        タブ区切り(スプレッドシートからそのままコピペ可)。
      </p>
      <textarea
        value={tsvDraft}
        onChange={(e) => setTsvDraft(e.target.value)}
        rows={10}
        style={{
          width: "100%",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
        }}
        placeholder={"日本で一番高い山は?\t富士山\t北岳\t穂高岳\t槍ヶ岳\t1"}
      />
      <button onClick={applyTsv} style={{ marginTop: "var(--space-xs)" }}>
        反映する
      </button>

      {errors.length > 0 && (
        <ul className="error-text">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}

      <p className="nums">現在の問題数: {value.questions.length}問</p>
    </div>
  );
}
