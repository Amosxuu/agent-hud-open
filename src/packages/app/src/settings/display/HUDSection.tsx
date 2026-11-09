/* The resting HUD on the selected screen: a preview, its mode and that mode's
 * own rows, then its look. */
import type { Snapshot } from "@agent-hud/protocol";
import type { HUDConfig } from "@agent-hud/hud/model";
import { Row, Section } from "../SettingsPrimitives";
import { Segments } from "../SettingsControls";
import { SmallHUDPreview } from "../SmallHUDPreview";
import { displayControls, type DisplayProps } from "./controls";

/** What a Simple mark draws, in a sentence. */
function usageSubtitle(
  style: HUDConfig["simpleStyle"],
  t: DisplayProps["t"],
): string {
  switch (style) {
    case "rings":
      return t(
        "One ring per window round the logo, the first outermost.",
        "每項一圈，套在標誌外，第一項在最外圈。",
      );
    case "segments":
      return t(
        "One ring round the logo, split into a segment per window.",
        "標誌外一圈，按項分段，第一段在最上面。",
      );
    case "bars":
      return t(
        "One bar per window beside the logo, the first on top.",
        "標誌旁每項一條，第一項在最上面。",
      );
    case "numbers":
      return t(
        "The most used window's percentage beside the logo.",
        "標誌旁只寫用得最多那項的百分比。",
      );
  }
}

export function HUDSection({
  snapshot,
  active,
  config,
  update,
  t,
}: DisplayProps & { snapshot: Snapshot; active: boolean }) {
  const { slider, toggle, pt, percent } = displayControls({
    config,
    update,
    t,
  });

  const modeSubtitle =
    config.mode === "simple"
      ? t("A small floating panel, with no glow.", "懸浮的小面板，沒有光暈。")
      : config.hasNotch
        ? t("Uses this screen's notch.", "使用這塊螢幕的劉海。")
        : t(
            "No notch here, so it draws a stand-in bar.",
            "這塊螢幕沒有劉海，畫一條替代條。",
          );

  const dragHint =
    config.mode === "notch"
      ? t(
          "Drag the HUD on screen to move it. Dragging the notch switches to Simple.",
          "直接拖動螢幕上的 HUD 來移動它；拖動劉海會切換為「簡約」。",
        )
      : t(
          "Drag the HUD on screen to move it.",
          "直接拖動螢幕上的 HUD 來移動它。",
        );

  return (
    <Section title="HUD" footer={dragHint}>
      <SmallHUDPreview snapshot={snapshot} config={config} active={active} />
      <Row title={t("Mode", "形態")} subtitle={modeSubtitle}>
        <Segments
          label={t("Mode", "形態")}
          value={config.mode}
          options={[
            ["notch", t("Notch", "劉海")],
            ["simple", t("Simple", "簡約")],
          ]}
          change={(value) =>
            update({
              mode: value as HUDConfig["mode"],
              ...(config.mode === "notch" &&
              value !== "notch" &&
              config.hasNotch &&
              config.edge === "top" &&
              config.offset === 0.5
                ? { offset: 0 }
                : {}),
            })
          }
        />
      </Row>
      {config.mode === "simple" && (
        <>
          {slider("simpleSize", t("Size", "大小"), 20, 60, 1, pt)}
          {slider(
            "simpleGapScale",
            t("Logo spacing", "Logo 間距"),
            0.1,
            0.6,
            0.05,
            (value) => pt(value * config.simpleSize),
          )}
          <Row
            title={t("Usage", "用量畫法")}
            subtitle={usageSubtitle(config.simpleStyle, t)}
          >
            <Segments
              label={t("Usage", "用量畫法")}
              value={config.simpleStyle}
              options={[
                ["rings", t("Rings", "年輪")],
                ["segments", t("Segments", "分段環")],
                ["bars", t("Bars", "進度條")],
                ["numbers", t("Numbers", "數字")],
              ]}
              change={(value) =>
                update({ simpleStyle: value as HUDConfig["simpleStyle"] })
              }
            />
          </Row>
          {config.simpleStyle !== "numbers" &&
            slider(
              "ringWidth",
              config.simpleStyle === "bars"
                ? t("Bar thickness", "進度條粗細")
                : t("Ring thickness", "圓環粗細"),
              1,
              4,
              0.5,
              (value) =>
                `${(config.simpleStyle === "bars" ? value + 0.5 : value).toFixed(1)} pt`,
            )}
          {config.simpleStyle !== "numbers" &&
            toggle(
              "showsNumbers",
              t("Show numbers", "顯示數字"),
              t(
                "The most used window's percentage beside each logo.",
                "標誌旁寫出用得最多那項的百分比。",
              ),
            )}
          {toggle(
            "separatesAgents",
            t("Separate agents", "按Agent分開"),
            t(
              "Hovering a logo opens only its agent.",
              "懸停標誌只展開該Agent。",
            ),
          )}
        </>
      )}
      <Row
        title={t("Appearance", "外觀")}
        subtitle={
          config.hasNotch && config.mode === "notch"
            ? t(
                "The notch stays black; its panel uses this.",
                "劉海保持純黑，展開的面板用這個外觀。",
              )
            : undefined
        }
      >
        <Segments
          label={t("HUD appearance", "HUD 外觀")}
          value={config.appearance}
          options={[
            ["system", t("System", "跟隨系統")],
            ["light", t("Light", "淺色")],
            ["dark", t("Dark", "深色")],
          ]}
          change={(value) =>
            update({ appearance: value as HUDConfig["appearance"] })
          }
        />
      </Row>
      {slider(
        "solidTransparency",
        t("Transparency", "透明度"),
        0,
        1,
        0.05,
        percent,
      )}
    </Section>
  );
}
