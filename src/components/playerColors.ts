/**
 * プレイヤー識別色の参照表。
 * 実値は tokens.css 側にあり、ここは var() 名だけを持つ
 * (コンポーネントに生の hex / oklch を書かないため)。
 */

/** パネルに敷く色 */
export const COLOR_MAP: Record<string, string> = {
  red: "var(--color-player-red)",
  blue: "var(--color-player-blue)",
  green: "var(--color-player-green)",
  yellow: "var(--color-player-yellow)",
  purple: "var(--color-player-purple)",
  orange: "var(--color-player-orange)",
};

/**
 * 敷色の上に載せる文字色。
 * 黄とオレンジは明度が高く白文字では 3:1 を割るため、墨を載せる。
 */
export const COLOR_INK_MAP: Record<string, string> = {
  red: "var(--color-player-red-ink)",
  blue: "var(--color-player-blue-ink)",
  green: "var(--color-player-green-ink)",
  yellow: "var(--color-player-yellow-ink)",
  purple: "var(--color-player-purple-ink)",
  orange: "var(--color-player-orange-ink)",
};

export const COLOR_LABEL_JA: Record<string, string> = {
  red: "赤",
  blue: "青",
  green: "緑",
  yellow: "黄",
  purple: "紫",
  orange: "オレンジ",
};
