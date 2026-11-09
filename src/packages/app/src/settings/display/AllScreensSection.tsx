/* Settings the HUD shares on every screen: bot logos, when the panel
 * opens and closes, and how long a message waits in the dock's tail. */
import { Slide } from "../SettingsControls";
import { Section } from "../SettingsPrimitives";
import { displayControls, type DisplayProps } from "./controls";

/** The fade slider's last stop, past 12 seconds: messages never go by
 * themselves (saved as 0). */
const NEVER = 13;

export function AllScreensSection({ config, update, t }: DisplayProps) {
  const { slider, toggle, ms } = displayControls({ config, update, t });
  const fade = config.messageFadeSeconds;
  return (
    <Section title={t("All screens", "所有螢幕")}>
      {toggle(
        "botLogos",
        t("Bot logos", "Bot 形象"),
        t("Agents show as bots while they work.", "Agent工作時顯示為 Bot。"),
      )}
      {toggle(
        "requiresOptionToOpen",
        t("Press Option to open", "按 Option 才展開"),
        t("Hovering alone leaves the panel closed.", "僅懸停不會展開面板。"),
      )}
      {toggle(
        "openImmediatelyAtTop",
        t("Open immediately at the top edge", "滑鼠觸頂立即展開"),
        t("Skips the hover delay.", "跳過展開延遲。"),
      )}
      {slider("hoverDelayMs", t("Hover delay", "展開延遲"), 0, 1500, 50, ms)}
      {slider(
        "collapseDelayMs",
        t("Collapse delay", "收起延遲"),
        0,
        1500,
        50,
        ms,
      )}
      <Slide
        title={t("Messages fade every", "訊息消失間隔")}
        value={fade > 0 ? Math.min(fade, NEVER - 1) : NEVER}
        min={3}
        max={NEVER}
        step={1}
        format={(value) =>
          value >= NEVER
            ? t("Never", "不消失")
            : t(`${Math.round(value)} s`, `${Math.round(value)} 秒`)
        }
        change={(value) =>
          update({ messageFadeSeconds: value >= NEVER ? 0 : value })
        }
      />
    </Section>
  );
}
