/* The glow round the notch: a style and an effect up front, every slider
 * behind Fine-tune. Simple mode has no glow. */
import type { HUDConfig } from "@agent-hud/hud/model";
import { Menu } from "../SettingsControls";
import { MoreRows, Row, Section } from "../SettingsPrimitives";
import { displayControls, type DisplayProps } from "./controls";

export function GlowSection({ config, update, t }: DisplayProps) {
  if (config.mode === "simple") return null;
  const { slider, toggle, pt, px, percent, seconds, rows } = displayControls({
    config,
    update,
    t,
  });
  // Every style but Soft draws a grid of marks, with its own sliders.
  const grid = config.glowStyle !== "blur";
  return (
    <Section title={t("Notch glow", "劉海光暈")}>
      <Row title={t("Style", "樣式")}>
        <Menu
          label={t("Glow style", "光暈樣式")}
          value={config.glowStyle}
          options={[
            ["blur", t("Soft", "柔光")],
            ["dots", t("Dots", "點陣")],
            ["ascii", t("ASCII  .:-=+*#%@", "字符  .:-=+*#%@")],
            ["blocks", t("Blocks  ░▒▓█", "色塊  ░▒▓█")],
            ["braille", t("Braille  ⠁⠃⠇⡇⣿", "盲文  ⠁⠃⠇⡇⣿")],
            ["binary", t("Binary  0 1", "二進制  0 1")],
          ]}
          change={(value) =>
            update({ glowStyle: value as HUDConfig["glowStyle"] })
          }
          width={160}
        />
      </Row>
      <Row title={t("Effect", "動效")}>
        <Menu
          label={t("Glow effect", "光暈動效")}
          value={config.glowEffect}
          options={[
            ["breathe", t("Breathe", "呼吸")],
            ["flow", t("Flow", "流光")],
            ["scan", t("Scan", "掃描")],
            ["ripple", t("Ripple", "漣漪")],
            ["shimmer", t("Shimmer", "閃爍")],
            ["boot", t("Boot", "啓動")],
          ]}
          change={(value) =>
            update({ glowEffect: value as HUDConfig["glowEffect"] })
          }
          width={160}
        />
      </Row>
      <MoreRows label={t("Fine-tune", "微調")}>
        {grid && (
          <>
            {slider("glowGridPitch", t("Grid pitch", "點距"), 4, 12, 1, pt)}
            {slider(
              "glowGridDensity",
              t("Density", "密度"),
              0.5,
              1.5,
              0.05,
              percent,
            )}
            {slider("glowGridCore", t("Solid", "實心"), 0, 8, 1, rows)}
            {slider("glowGridFade", t("Fade", "漸隱"), 0, 8, 1, rows)}
          </>
        )}
        {slider(
          "glowBrightness",
          t("Brightness", "亮度"),
          0.2,
          1,
          0.05,
          percent,
        )}
        {!grid && (
          <>
            {slider("glowRange", t("Range", "範圍"), 0, 36, 1, px)}
            {slider("glowBlur", t("Feather", "羽化"), 0, 36, 1, px)}
            {toggle("glowOutwardOnly", t("Outward only", "僅向外擴散"))}
          </>
        )}
        {slider(
          "breathSeconds",
          t("Working period", "工作時週期"),
          1,
          12,
          0.5,
          seconds,
        )}
        {slider(
          "idleBreathSeconds",
          t("Idle period", "空閒時週期"),
          1,
          24,
          0.5,
          seconds,
        )}
        {config.glowEffect === "breathe" &&
          slider(
            "breathAmplitude",
            t("Breath depth", "呼吸幅度"),
            0,
            1,
            0.05,
            percent,
          )}
      </MoreRows>
    </Section>
  );
}
