import type { RuleConfig } from "../types/game";

/**
 * ルール設定UIをここのメタ定義から自動生成する。
 * 設定項目を増やすたびにUIを手書きしなくて済むようにするための一覧。
 * ここに載っているのは実際に useHostGameLoop / engine が参照するフィールドのみ
 * (UIで動かせるのに挙動に反映されない項目を作らないため)。
 */
export type RuleFieldMeta =
  | {
      key: string;
      kind: "toggle";
      label: string;
      description: string;
      get: (c: RuleConfig) => boolean;
      set: (c: RuleConfig, v: boolean) => RuleConfig;
      visible?: (c: RuleConfig) => boolean;
    }
  | {
      key: string;
      kind: "slider";
      label: string;
      description: string;
      min: number;
      max: number;
      step?: number;
      unit?: string;
      get: (c: RuleConfig) => number;
      set: (c: RuleConfig, v: number) => RuleConfig;
      visible?: (c: RuleConfig) => boolean;
    }
  | {
      key: string;
      kind: "segmented";
      label: string;
      description: string;
      options: { value: string; label: string }[];
      get: (c: RuleConfig) => string;
      set: (c: RuleConfig, v: string) => RuleConfig;
      visible?: (c: RuleConfig) => boolean;
    };

export const RULE_CONFIG_FIELDS: RuleFieldMeta[] = [
  {
    key: "flipMode",
    kind: "toggle",
    label: "オセロ式反転",
    description: "正解して確保したパネルで相手パネルを挟むと、挟んだ区間ごと自分の色に反転する(本家アタック25のオセロ的な奪い合い)。オフなら空きマスを1枚ずつ取り合うだけになる。",
    get: (c) => c.flipMode === "othello",
    set: (c, v) => ({ ...c, flipMode: v ? "othello" : "none" }),
  },
  {
    key: "attackChance.enabled",
    kind: "toggle",
    label: "アタック権(累計正解ボーナス)",
    description: "一定回数連続で正解するとアタック権が貯まる、ルール.md準拠のボーナスルール。",
    get: (c) => c.attackChance.enabled,
    set: (c, v) => ({ ...c, attackChance: { ...c.attackChance, enabled: v } }),
  },
  {
    key: "attackChance.requiredCorrect",
    kind: "slider",
    label: "アタック権が貯まる正解数",
    description: "この回数正解するたびにアタック権が1つ増える。",
    min: 3,
    max: 10,
    step: 1,
    unit: "問",
    get: (c) => c.attackChance.requiredCorrect,
    set: (c, v) => ({ ...c, attackChance: { ...c.attackChance, requiredCorrect: v } }),
    visible: (c) => c.attackChance.enabled,
  },
  {
    key: "answerTimeoutSec",
    kind: "slider",
    label: "解答制限時間",
    description: "早押しに成功してから解答するまでの制限時間。",
    min: 3,
    max: 30,
    step: 1,
    unit: "秒",
    get: (c) => c.answerTimeoutSec,
    set: (c, v) => ({ ...c, answerTimeoutSec: v }),
  },
  {
    key: "victory",
    kind: "segmented",
    label: "勝敗判定",
    description: "出題が尽きた/盤面が埋まった時点でのパネル最多所有者を勝者にするか、規定数のパネルに最初に到達した人を勝者にするか。",
    options: [
      { value: "mostPanels", label: "パネル最多" },
      { value: "firstToN", label: "規定数到達" },
    ],
    get: (c) => c.victory,
    set: (c, v) => ({ ...c, victory: v as RuleConfig["victory"] }),
  },
  {
    key: "firstToNPanels",
    kind: "slider",
    label: "勝利に必要なパネル数",
    description: "このパネル数に最初に到達したプレイヤーが即座に勝者になる。",
    min: 3,
    max: 20,
    step: 1,
    unit: "枚",
    get: (c) => c.firstToNPanels ?? 10,
    set: (c, v) => ({ ...c, firstToNPanels: v }),
    visible: (c) => c.victory === "firstToN",
  },
];
