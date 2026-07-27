import type { QuestionSet } from "../types/game";

/** M2 動作確認用の固定サンプル問題集。教室運用時は先生が入力したものに差し替える。 */
export const sampleQuestionSet: QuestionSet = {
  id: "sample-1",
  title: "サンプル問題(一般常識)",
  questions: [
    {
      id: "q1",
      text: "日本で一番高い山は?",
      choices: ["富士山", "北岳", "穂高岳", "槍ヶ岳"],
      answerIndex: 0,
    },
    {
      id: "q2",
      text: "1週間は何日?",
      choices: ["5日", "6日", "7日", "8日"],
      answerIndex: 2,
    },
    {
      id: "q3",
      text: "水の化学式は?",
      choices: ["CO2", "H2O", "O2", "NaCl"],
      answerIndex: 1,
    },
    {
      id: "q4",
      text: "日本の首都は?",
      choices: ["大阪", "京都", "東京", "名古屋"],
      answerIndex: 2,
    },
    {
      id: "q5",
      text: "三角形の内角の和は?",
      choices: ["90度", "180度", "270度", "360度"],
      answerIndex: 1,
    },
    {
      id: "q6",
      text: "光の三原色に含まれないのは?",
      choices: ["赤", "緑", "青", "黄"],
      answerIndex: 3,
    },
    {
      id: "q7",
      text: "日本国憲法が施行されたのは何年?",
      choices: ["1945年", "1946年", "1947年", "1950年"],
      answerIndex: 2,
    },
    {
      id: "q8",
      text: "人体で一番大きい臓器は?",
      choices: ["肝臓", "肺", "皮膚", "脳"],
      answerIndex: 2,
    },
  ],
};
