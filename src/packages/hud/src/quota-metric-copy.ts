// What a quota row's measure says when it has no value, where Core gave no
// reason of its own; kept apart from the readings, as quota-alert-copy is.
import type { QuotaMeasure } from "@agent-hud/protocol";
import type { Language } from "@agent-hud/ui/format";

export const say = (language: Language, zh: string, en: string) =>
  language.startsWith("zh") ? zh : en;

/** Why a measure has no value, where Core gave no reason of its own. */
export function missing(measure: QuotaMeasure, language: Language) {
  switch (measure) {
    case "quota":
      return say(
        language,
        "這個視窗暫無目前額度讀數。",
        "No current quota reading is available for this window.",
      );
    case "burn":
      return say(
        language,
        "消耗速度需要本週期內跨越最短採樣時長的讀數。",
        "Burn rate needs readings spanning the minimum sampling interval in this quota cycle.",
      );
    case "tokens":
      return say(
        language,
        "輸出速度需要這個視窗模型至少 3 次可計時的回覆，合計至少 5 秒：按紀錄記下的用時，或同一紀錄中相隔不超過 120 秒的上一次呼叫算起。",
        "Reply rate needs at least 3 timed replies from this window's models, 5 seconds in all: each timed by its log, or from the same log's call before it within 120 seconds.",
      );
    case "consumed":
      return say(
        language,
        "已消耗需要來源自己的計數，或已知週期內對應模型的用量。",
        "Consumed needs the source's tally, or a known quota cycle with matching model usage.",
      );
    case "cost":
      return say(
        language,
        "這項估算需要已知的額度週期、對應模型的用量和這些模型的標價。",
        "This estimate needs a known quota cycle, matching model usage and list prices for its models.",
      );
  }
}
