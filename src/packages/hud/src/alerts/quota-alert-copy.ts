// What a quota or reset-credit reminder says (Open's QuotaAlertCopy and
// ResetCreditAlertCopy), kept apart from the cards so the tests can run it.
import type { IslandEvent } from "@agent-hud/protocol";
import {
  countdownCompact,
  dateFormat,
  percent,
  quotaPercent,
  quotaDisplayLabel,
  resetLabelCompact,
  type FormatSettings,
  type Language,
} from "@agent-hud/ui/format";

const say = (language: Language, zh: string, en: string) =>
  language.startsWith("zh") ? zh : en;

/** The window's share left, from the share used the event carries; none without a reading. */
function remainingOf(event: IslandEvent) {
  return event.usedPercent == null || !Number.isFinite(event.usedPercent)
    ? null
    : Math.max(0, Math.min(100, 100 - event.usedPercent));
}

export function quotaAlertCopy(event: IslandEvent, settings: FormatSettings) {
  const { language } = settings;
  const remaining = remainingOf(event);
  const usedPct = remaining == null ? null : Math.max(0, 100 - remaining);
  const displayPct = quotaPercent(event.usedPercent, settings.quotaDisplay);
  const isReset = event.kind === "quota-reset";
  // Core marks the reading that empties the window (Open's AlertPolicy.exhaustedRemaining).
  const empty = event.crossing === "exhausted";
  const forecast = event.timeToExhaustSeconds;
  const exhaustion =
    remaining != null && forecast != null && Number.isFinite(forecast)
      ? countdownCompact(Math.max(60, Math.ceil(forecast / 60) * 60))
      : null;
  // The reset is measured from when the window was read, as Open measures it.
  const resetAt = event.resetAt ? Date.parse(event.resetAt) : NaN;
  const readAt = Date.parse(event.at);
  const others = (event.otherExhaustedWindows ?? [])
    .map((window) => window?.name)
    .filter((name): name is string => Boolean(name));
  const names = others.join("、");
  return {
    displayPct,
    display: displayPct == null ? "N/A" : percent(displayPct),
    displayLabel: quotaDisplayLabel(settings.quotaDisplay, language),
    usedPct,
    used: usedPct == null ? "N/A" : percent(usedPct),
    remaining: remaining == null ? "N/A" : percent(remaining),
    exhaustion: exhaustion ?? "—",
    reset: resetLabelCompact(
      Number.isFinite(resetAt) ? resetAt : null,
      Number.isFinite(readAt) ? readAt : Date.now(),
      settings.calendar,
      language,
    ),
    /** Beside the agent in the small reminder. */
    compactTitle:
      remaining == null
        ? say(language, "額度不可用", "Quota unavailable")
        : isReset
          ? say(language, "已重置", "Reset")
          : empty
            ? say(language, "已耗盡", "Empty")
            : exhaustion
              ? say(language, `${exhaustion} 後耗盡`, `${exhaustion} left`)
              : say(language, "即將耗盡", "Running low"),
    /** The card's sentence. */
    title:
      remaining == null
        ? say(language, "額度暫不可用。", "Quota is unavailable.")
        : isReset
          ? others.length
            ? say(
                language,
                "此視窗已重置，其他視窗仍有限制。",
                "This window has reset; other limits still apply.",
              )
            : say(
                language,
                "此視窗額度已重置。",
                "This quota window has reset.",
              )
          : empty
            ? say(
                language,
                "目前視窗額度已耗盡，等待重置。",
                "This window is empty. Waiting for reset.",
              )
            : exhaustion
              ? say(
                  language,
                  "按最近的消耗速率，預計將在重置前耗盡。",
                  "At the recent burn rate, this window may run out before it resets.",
                )
              : say(
                  language,
                  "已用額度達到危險閾值，請留意後續任務。",
                  "Usage has reached the critical threshold.",
                ),
    otherLimits: others.length
      ? say(language, `${names}額度仍已耗盡`, `Still exhausted: ${names}`)
      : null,
  };
}

/** The reset-credit card's words. `expiresAt` are the expiries of every reset
 * the account holds, as the usage panel lists them. */
export function resetCreditCopy(
  added: number,
  expiresAt: (string | null | undefined)[],
  language: Language,
) {
  const first = expiresAt
    .map((at) => (at ? Date.parse(at) : NaN))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)[0];
  return {
    compactTitle: say(
      language,
      `+${added} 次重置`,
      added === 1 ? "+1 reset" : `+${added} resets`,
    ),
    title: say(
      language,
      `此帳戶新增了 ${added} 次額度重置。`,
      added === 1
        ? "A usage reset was added to this account."
        : `${added} usage resets were added to this account.`,
    ),
    /** The account's earliest deadline as a date. */
    expiry:
      first === undefined
        ? "—"
        : dateFormat(language.startsWith("zh") ? "zh-TW" : "en-US", {
            month: "short",
            day: "numeric",
          }).format(first),
  };
}
