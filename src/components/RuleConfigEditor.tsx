import { RULE_CONFIG_FIELDS } from "../config/ruleConfigMeta";
import { DEFAULT_RULE_CONFIG, type RuleConfig } from "../types/game";

interface RuleConfigEditorProps {
  value: RuleConfig;
  onChange: (config: RuleConfig) => void;
  disabled?: boolean;
}

/** ラベルは短く保つ。狭い画面で2行に折り返るボタンは押せる対象に見えなくなる */
const PRESETS: { label: string; note: string; config: RuleConfig }[] = [
  { label: "本家風", note: "オセロ反転＋アタック権", config: DEFAULT_RULE_CONFIG },
  {
    label: "短時間決戦",
    note: "反転なし・先取制",
    config: {
      ...DEFAULT_RULE_CONFIG,
      flipMode: "none",
      victory: "firstToN",
      firstToNPanels: 8,
      answerTimeoutSec: 8,
    },
  },
];

export function RuleConfigEditor({ value, onChange, disabled }: RuleConfigEditorProps) {
  return (
    <div>
      <div className="btn-row" style={{ marginBottom: "var(--space-md)" }}>
        {PRESETS.map((preset) => (
          <button key={preset.label} disabled={disabled} onClick={() => onChange(preset.config)}>
            {preset.label}
            <span className="muted" style={{ fontWeight: 400, marginLeft: "var(--space-2xs)" }}>
              {preset.note}
            </span>
          </button>
        ))}
      </div>

      {RULE_CONFIG_FIELDS.filter((f) => f.visible?.(value) ?? true).map((field) => (
        <div key={field.key} style={{ marginBottom: "var(--space-md)" }}>
          <label className="field-label" style={{ marginBottom: 0 }}>
            {field.kind === "toggle" && (
              <>
                <input
                  type="checkbox"
                  checked={field.get(value)}
                  disabled={disabled}
                  onChange={(e) => onChange(field.set(value, e.target.checked))}
                />{" "}
                {field.label}
              </>
            )}
            {field.kind === "slider" && (
              <>
                {field.label}:{" "}
                <span className="nums">
                  {field.get(value)}
                  {field.unit}
                </span>
              </>
            )}
            {field.kind === "segmented" && <>{field.label}</>}
          </label>

          {field.kind === "slider" && (
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              value={field.get(value)}
              disabled={disabled}
              onChange={(e) => onChange(field.set(value, Number(e.target.value)))}
              style={{ width: "100%" }}
            />
          )}

          {field.kind === "segmented" && (
            <div className="btn-row" style={{ marginTop: "var(--space-2xs)" }}>
              {field.options.map((opt) => {
                const active = field.get(value) === opt.value;
                return (
                  <button
                    key={opt.value}
                    disabled={disabled}
                    aria-pressed={active}
                    className={active ? "btn-primary" : undefined}
                    onClick={() => onChange(field.set(value, opt.value))}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          <p className="field-note">{field.description}</p>
        </div>
      ))}
    </div>
  );
}
