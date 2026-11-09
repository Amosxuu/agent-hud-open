import type { Quota, QuotaMeasure } from "@agent-hud/protocol";
import {
  budgetText,
  moneyShort,
  quotaPercentLabel,
  quotaDisplayLabel,
  monthDayTime,
  numberFormat,
  outlookBasisText,
  outlookText,
  relativeWeekdayTime,
  resetLabel,
  samplingHint,
  samplingLabel,
  tokensShort,
  type FormatSettings,
} from "@agent-hud/ui/format";
import { missing, say } from "./quota-metric-copy.ts";

export interface QuotaMetricReading {
  value: string;
  detail: string;
  hint: string;
  available: boolean;
  selectable: boolean;
  runsOut: boolean;
  projectedPercent: number | null;
  /** Where Core's budget, a steady pace through the cycle, has the used
   * share now, for a mark on the bar; null without one. */
  budgetPercent: number | null;
}

/** Open's AgentRow.resetLabel: "—" without a reset, "Pending update" once
 * it has passed with no reading to confirm it, "<1m" inside a minute. */
function rowResetLabel(row: Quota, now: number, settings: FormatSettings) {
  const resetAt = row.resetAt ? Date.parse(row.resetAt) : NaN;
  if (Number.isFinite(resetAt)) {
    if (resetAt <= now)
      return say(settings.language, "等待更新", "Pending update");
    if (resetAt - now < 60_000) return "<1m";
  }
  return resetLabel(
    Number.isFinite(resetAt) ? resetAt : null,
    now,
    settings.calendar,
    settings.language,
  );
}

/** What a quota row's measure reads: missing quota is "--", other missing
 * measures and details are "—". A reading that shows no level, stale here,
 * has no burn rate, outlook, reply rate, consumption or cost. Formatting only: the UI never
 * assigns session totals or rates to a quota window. */
export function quotaMetric(
  row: Quota,
  measure: QuotaMeasure,
  now: number,
  settings: FormatSettings,
): QuotaMetricReading {
  const { language, calendar } = settings;
  const metrics = row.metrics;
  const result: QuotaMetricReading = {
    value: "—",
    detail: "—",
    available: false,
    selectable: measure === "quota",
    runsOut: false,
    projectedPercent: null,
    budgetPercent: null,
    hint: metrics?.unavailable?.[measure] ?? missing(measure, language),
  };
  const stale = say(
    language,
    "額度讀數已過期，請更新這個帳戶。",
    "Last quota reading is stale; refresh this account.",
  );
  const budget = metrics?.budget ?? null;
  const budgetLine = budget ? budgetText(budget, language) : null;
  if (measure === "quota") {
    result.value = "--";
    result.detail = rowResetLabel(row, now, settings);
    if (row.usedPercent != null) {
      result.value = quotaPercentLabel(row.usedPercent, settings.quotaDisplay);
      result.available = true;
      result.hint =
        row.status === "stale"
          ? stale
          : `${row.name}: ${result.value} · ${quotaDisplayLabel(settings.quotaDisplay, language)} · ${result.detail}${budgetLine ? ` · ${budgetLine}` : ""}`;
    }
    return result;
  }
  if (row.status === "stale" || row.usedPercent == null) {
    result.hint = row.status === "stale" ? stale : missing("quota", language);
    return result;
  }
  const outlook = metrics?.outlook;
  result.runsOut =
    outlook?.kind === "exhausted" ||
    (outlook?.kind === "exhausts" && outlook.beforeReset === true);
  if (measure === "burn") {
    const exhaustsAt = outlook?.exhaustsAt
      ? Date.parse(outlook.exhaustsAt)
      : NaN;
    const projected = outlook?.projectedUsedPercent ?? null;
    if (metrics?.burnRatePctPerHour != null) {
      result.value = `${metrics.burnRatePctPerHour.toFixed(1)}%/h`;
      result.available = result.selectable = true;
    } else if (outlook?.basis === "window" && outlook.ratePctPerHour != null) {
      // The cycle's average pace so far, until recent readings give one.
      result.value = `~${outlook.ratePctPerHour.toFixed(1)}%/h`;
      result.available = result.selectable = true;
    }
    result.budgetPercent = budget ? budget.expectedUsedPercent : null;
    const sampling =
      outlook?.kind === "insufficient-data" ? metrics?.sampling : null;
    if (sampling) result.selectable = true;
    const words = outlook
      ? outlookText(
          {
            kind: outlook.kind,
            seconds: Number.isFinite(exhaustsAt)
              ? Math.max(0, (exhaustsAt - now) / 1000)
              : undefined,
            beforeReset: outlook.beforeReset,
          },
          projected,
          language,
        )
      : null;
    // The row gives the time the rest runs out at; the hint, how long it lasts.
    result.detail =
      outlook?.kind === "exhausts" &&
      outlook.beforeReset === true &&
      Number.isFinite(exhaustsAt)
        ? exhaustsAt - now < 7 * 86_400_000
          ? relativeWeekdayTime(exhaustsAt, now, calendar, language)
          : monthDayTime(exhaustsAt, calendar, language)
        : sampling
          ? samplingLabel(sampling.afterReset, language)
          : (words ?? "—");
    result.projectedPercent = result.runsOut ? 100 : projected;
    const basis =
      outlook?.basis === "window"
        ? say(
            language,
            `${outlookBasisText("window", language)}，讀數夠了改按目前節奏`,
            `${outlookBasisText("window", language)} until readings give the recent pace`,
          )
        : outlook?.basis === "recent"
          ? outlookBasisText("recent", language)
          : null;
    const lines = sampling
      ? [
          samplingHint(
            sampling.elapsed,
            sampling.required,
            sampling.afterReset,
            language,
          ),
        ]
      : result.available
        ? [
            `${result.value} · ${words ?? say(language, "這個週期的讀數", "from this quota cycle's readings")}`,
            basis,
          ]
        : [];
    if (lines.length) {
      if (budgetLine) lines.push(budgetLine);
      result.hint = lines.filter(Boolean).join("\n");
    }
  } else if (measure === "tokens" && metrics?.replyRate) {
    const rate = metrics.replyRate;
    // A rate timed by the gaps between calls holds tool runs and the
    // person's time, so it is a floor.
    result.value = `${rate.lowerBound ? "≥" : ""}${rate.tokensPerSecond < 10 ? rate.tokensPerSecond.toFixed(1) : Math.trunc(rate.tokensPerSecond)}/s`;
    result.detail = say(
      language,
      `${rate.calls} 次回覆`,
      `${rate.calls} replies`,
    );
    result.available = result.selectable = true;
    const zhTokens = numberFormat("zh-TW").format(rate.tokensOut);
    const enTokens = numberFormat("en-US").format(rate.tokensOut);
    result.hint = rate.lowerBound
      ? say(
          language,
          `這個視窗的模型在 ${rate.calls} 次回覆中輸出 ${zhTokens} 個 token。用戶端紀錄沒有記下每次呼叫的用時，只能從上一次呼叫算起（120 秒以內），其中含工具運行和你的時間，實際速度不低於這個數。有最近一小時的記錄時取最近一小時，否則取最近七天。`,
          `${enTokens} output tokens over ${rate.calls} replies from this window's models. The client's log does not time its calls, so each is timed from the call before it (within 120 seconds), tool runs and your time included; the real rate is at least this. Latest hour when available, otherwise the last seven days.`,
        )
      : say(
          language,
          `這個視窗的模型在 ${rate.calls} 次回覆中輸出 ${zhTokens} 個 token，每次按用戶端紀錄記下的呼叫用時計算，不含工具運行和你的時間。有最近一小時的記錄時取最近一小時，否則取最近七天。`,
          `${enTokens} output tokens over ${rate.calls} replies from this window's models, each timed by its own call as the client's log records it, without tool runs or your time. Latest hour when available, otherwise the last seven days.`,
        );
  } else if (
    measure === "consumed" &&
    metrics?.consumed &&
    metrics.consumed.used >= 0
  ) {
    const used = metrics.consumed;
    result.value = tokensShort(used.used);
    // With a capacity the line reads "used / cap"; without one, the pace.
    result.detail =
      used.capacity != null && used.capacity >= 0
        ? `/ ${tokensShort(used.capacity)}`
        : metrics.tokensPerHour != null
          ? `${tokensShort(Math.round(metrics.tokensPerHour))}/h`
          : "—";
    result.available = result.selectable = true;
    const since = metrics.observedFrom ? Date.parse(metrics.observedFrom) : NaN;
    result.hint = Number.isFinite(since)
      ? say(
          language,
          `這個額度視窗已消耗${used.unit ? `（${used.unit}）` : ""}，自 ${monthDayTime(since, calendar, language)} 起記錄。`,
          `Consumed in this quota window${used.unit ? ` (${used.unit})` : ""}, observed since ${monthDayTime(since, calendar, language)}.`,
        )
      : say(
          language,
          "只計入已知週期內觀察到的用量。",
          "Only observed usage in its known cycle is counted.",
        );
  } else if (measure === "cost" && metrics?.cost) {
    const cost = metrics.cost;
    const currencies = Object.keys(cost.amounts).sort();
    if (currencies.length) {
      const first = currencies[0];
      result.value = moneyShort(cost.amounts[first], first, language);
      // A second currency, which is rare, is the detail; else the pace.
      result.detail =
        currencies.length > 1
          ? `+ ${currencies
              .slice(1)
              .map((currency) =>
                moneyShort(cost.amounts[currency], currency, language),
              )
              .join(" + ")}`
          : `${moneyShort(cost.amounts[first] / cost.hours, first, language)}/h`;
      result.available = result.selectable = true;
      result.hint = say(
        language,
        "按標價估算這個視窗本週期已觀察到的模型用量。訂閱費不按 token 計費；不同幣種分開計算。",
        "List-price estimate for this window's observed current-cycle model usage. Subscription fees are not billed by token. Currencies remain separate.",
      );
    }
  }
  return result;
}

export function quotaMetricAvailability(
  rows: readonly Quota[],
  measure: QuotaMeasure,
  now: number,
  settings: FormatSettings,
) {
  const readings = rows.map((row) => quotaMetric(row, measure, now, settings));
  const selectable = readings.some((reading) => reading.selectable);
  return {
    selectable,
    hint: selectable
      ? readings.find((reading) => reading.selectable)!.hint
      : [...new Set(readings.map((reading) => reading.hint))].join("\n") ||
        missing(measure, settings.language),
  };
}
