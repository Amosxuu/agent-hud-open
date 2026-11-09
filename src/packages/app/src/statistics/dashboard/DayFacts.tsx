import type { ReactNode } from "react";
import { compact, number, type StatsTheme } from "../StatsTheme";
import { Tween } from "../motion";

const whole = (value: number) => String(Math.round(value));
import type { DayFacts } from "./days";

/** The heatmap's five steps, none to most, GitHub's greens: darker for
 * more on a light ground, brighter for more on a dark one. */
const GREENS = {
  light: ["rgba(0,0,0,.06)", "#c2e7cb", "#7ccb92", "#3a9d57", "#1d6b35"],
  dark: ["rgba(255,255,255,.06)", "#0e4429", "#006d32", "#26a641", "#39d353"],
};

/** A heatmap level's colour, 0 for none to 4 for most. */
export function heatColor(level: number, theme: StatsTheme) {
  return GREENS[theme.light ? "light" : "dark"][level] ?? GREENS.dark[0];
}

function Fact({
  label,
  value,
  caption,
  theme,
}: {
  label: string;
  value: ReactNode;
  caption?: string;
  theme: StatsTheme;
}) {
  return (
    <div style={{ display: "grid", gap: 1, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: theme.secondary }}>{label}</span>
      <span style={{ ...number, fontSize: 15, fontWeight: 600 }}>{value}</span>
      {caption && (
        <span
          style={{
            fontSize: 11,
            color: theme.secondary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {caption}
        </span>
      )}
    </div>
  );
}

/** What the heatmap says in words, in a row under it. */
export function DayFactList({
  facts,
  dateText,
  theme,
}: {
  facts: DayFacts;
  dateText: (start: number) => string;
  theme: StatsTheme;
}) {
  const zh = Boolean(theme.zh);
  const t = (en: string, cn: string) => (zh ? cn : en);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,minmax(0,1fr))",
        gap: 12,
        paddingTop: 12,
        borderTop: `1px solid ${theme.divider}`,
      }}
    >
      <Fact
        label={t("Active days", "活躍天數")}
        value={
          <>
            <Tween value={facts.activeDays} format={whole} /> /{" "}
            <Tween value={facts.recordedDays} format={whole} />
          </>
        }
        caption={t("Days with any tokens", "有用量的天數")}
        theme={theme}
      />
      <Fact
        label={t("An active day", "活躍日平均")}
        value={
          facts.average === null ? (
            "—"
          ) : (
            <Tween value={facts.average} format={compact} />
          )
        }
        caption={t("Tokens on average", "平均 Token")}
        theme={theme}
      />
      <Fact
        label={t("Busiest day", "用得最多的一天")}
        value={
          facts.busiest ? (
            <Tween value={facts.busiest.value} format={compact} />
          ) : (
            "—"
          )
        }
        caption={facts.busiest ? dateText(facts.busiest.start) : undefined}
        theme={theme}
      />
      <Fact
        label={t("Streak", "連續使用")}
        value={
          <Tween
            value={facts.streak}
            format={(value) => t(`${whole(value)} days`, `${whole(value)} 天`)}
          />
        }
        caption={t(`Longest ${facts.longest} days`, `最長 ${facts.longest} 天`)}
        theme={theme}
      />
    </div>
  );
}

/** What the week's hours say in words: the busiest hour and weekday, and the
 * shares in working hours (weekdays 9–18) and late at night (0–6). */
export function HourFactList({
  tokens,
  theme,
}: {
  /** Monday-first 7 × 24 counted tokens. */
  tokens: number[][];
  theme: StatsTheme;
}) {
  const zh = Boolean(theme.zh);
  const t = (en: string, cn: string) => (zh ? cn : en);
  const days = zh
    ? ["週一", "週二", "週三", "週四", "週五", "週六", "周日"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let total = 0;
  let work = 0;
  let night = 0;
  let peak = { day: -1, hour: -1, value: 0 };
  const byDay = days.map((_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const value = tokens[day]?.[hour] ?? 0;
      total += value;
      if (day < 5 && hour >= 9 && hour < 18) work += value;
      if (hour < 6) night += value;
      if (value > peak.value) peak = { day, hour, value };
      return value;
    }).reduce((sum, value) => sum + value, 0),
  );
  const busiestDay = byDay.indexOf(Math.max(...byDay));
  const share = (part: number) =>
    total > 0 ? `${Math.round((part / total) * 100)}%` : "—";
  const hour = (value: number) => `${String(value).padStart(2, "0")}:00`;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,minmax(0,1fr))",
        gap: 12,
        paddingTop: 12,
        marginTop: 8,
        borderTop: `1px solid ${theme.divider}`,
      }}
    >
      <Fact
        label={t("Busiest hour", "最忙的時段")}
        value={peak.day < 0 ? "—" : `${days[peak.day]} ${hour(peak.hour)}`}
        caption={peak.day < 0 ? undefined : `${compact(peak.value)} Token`}
        theme={theme}
      />
      <Fact
        label={t("Busiest weekday", "最忙的一天")}
        value={total > 0 ? days[busiestDay] : "—"}
        caption={total > 0 ? share(byDay[busiestDay]) : undefined}
        theme={theme}
      />
      <Fact
        label={t("Working hours", "工作時間")}
        value={share(work)}
        caption={t("Weekdays 9:00–18:00", "工作日 9:00–18:00")}
        theme={theme}
      />
      <Fact
        label={t("Late at night", "深夜")}
        value={share(night)}
        caption={t("0:00–6:00", "0:00–6:00")}
        theme={theme}
      />
    </div>
  );
}
