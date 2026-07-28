import { RULE_CONFIG_FIELDS } from "../config/ruleConfigMeta";
import { DEFAULT_RULE_CONFIG, type RuleConfig } from "../types/game";

interface RuleConfigEditorProps {
  value: RuleConfig;
  onChange: (config: RuleConfig) => void;
  disabled?: boolean;
}

const PRESETS: { label: string; config: RuleConfig }[] = [
  { label: "本家風(オセロ反転+アタック権)", config: DEFAULT_RULE_CONFIG },
  {
    label: "短時間決戦(反転なし・先取制)",
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
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            disabled={disabled}
            onClick={() => onChange(preset.config)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {RULE_CONFIG_FIELDS.filter((f) => f.visible?.(value) ?? true).map((field) => (
        <div key={field.key} style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: "bold" }}>
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
                {field.label}: {field.get(value)}
                {field.unit}
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
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {field.options.map((opt) => (
                <button
                  key={opt.value}
                  disabled={disabled}
                  onClick={() => onChange(field.set(value, opt.value))}
                  style={{
                    fontWeight: field.get(value) === opt.value ? "bold" : "normal",
                    background: field.get(value) === opt.value ? "var(--accent, #d9291c)" : undefined,
                    color: field.get(value) === opt.value ? "#fff" : undefined,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <p style={{ fontSize: 13, opacity: 0.75, margin: "4px 0 0" }}>{field.description}</p>
        </div>
      ))}
    </div>
  );
}
