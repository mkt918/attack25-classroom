import type { Question, QuestionSet } from "../types/game";

const STORAGE_KEY = "at25.questionSets.v1";

/**
 * TSV(タブ区切り)から問題集を読み込む。
 * 列: 問題文 \t 選択肢1 \t 選択肢2 \t 選択肢3 \t 選択肢4 \t 正解番号(1-4)
 * スプレッドシートからのコピペをそのまま貼れる形式。
 */
export function parseTsv(tsv: string): { questions: Question[]; errors: string[] } {
  const lines = tsv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions: Question[] = [];
  const errors: string[] = [];

  lines.forEach((line, i) => {
    const cols = line.split("\t").map((c) => c.trim());
    if (cols.length < 6) {
      errors.push(`${i + 1}行目: 列が足りません(問題文/選択肢1-4/正解番号の6列が必要)`);
      return;
    }
    const [text, c1, c2, c3, c4, answerRaw] = cols;
    const answerNum = Number(answerRaw);
    if (!Number.isInteger(answerNum) || answerNum < 1 || answerNum > 4) {
      errors.push(`${i + 1}行目: 正解番号は1-4で指定してください(入力値: "${answerRaw}")`);
      return;
    }
    if (!text || !c1 || !c2 || !c3 || !c4) {
      errors.push(`${i + 1}行目: 空欄の列があります`);
      return;
    }
    questions.push({
      id: `q${i + 1}-${Date.now()}`,
      text,
      choices: [c1, c2, c3, c4],
      answerIndex: (answerNum - 1) as 0 | 1 | 2 | 3,
    });
  });

  return { questions, errors };
}

export function questionsToTsv(questions: Question[]): string {
  return questions
    .map((q) => [q.text, ...q.choices, String(q.answerIndex + 1)].join("\t"))
    .join("\n");
}

interface StoredData {
  sets: QuestionSet[];
}

function loadAll(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sets: [] };
    return JSON.parse(raw) as StoredData;
  } catch {
    return { sets: [] };
  }
}

function saveAll(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function listQuestionSets(): QuestionSet[] {
  return loadAll().sets;
}

export function saveQuestionSet(set: QuestionSet): void {
  const data = loadAll();
  const idx = data.sets.findIndex((s) => s.id === set.id);
  if (idx >= 0) {
    data.sets[idx] = set;
  } else {
    data.sets.push(set);
  }
  saveAll(data);
}

export function deleteQuestionSet(id: string): void {
  const data = loadAll();
  data.sets = data.sets.filter((s) => s.id !== id);
  saveAll(data);
}

export function createQuestionSetId(): string {
  return `set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyQuestionSet(): QuestionSet {
  return { id: createQuestionSetId(), title: "新しい問題集", questions: [] };
}
