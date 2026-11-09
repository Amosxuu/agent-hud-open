// "Let agents message each other" in Agent tools: agents message, start and
// read other Claude Code, Codex, Antigravity and DeepSeek Harness sessions on
// this computer through Agent HUD's MCP server. Off unless turned on. While
// on: "Send as me", and how many passes in a row before the user takes a
// look. A message waits until its session is idle; it never interrupts a turn.
import { useState } from "react";
import { toast } from "sonner";
import type { Snapshot } from "@agent-hud/protocol";
import { Switch } from "@agent-hud/ui/components/switch";
import { Menu } from "../SettingsControls";
import {
  Pill,
  Row,
  type SettingsPaneProps,
  type Text,
} from "../SettingsPrimitives";
import { ToolSwitchRow } from "./rows";

const LIMITS = [3, 5, 10, 20, 50];

export function AgentMessagesRow({
  snapshot,
  action,
  t,
}: {
  snapshot: Snapshot;
  action: SettingsPaneProps["action"];
  t: Text;
}) {
  const [pending, setPending] = useState(false);
  const settings = snapshot.settings;
  const enabled = settings.agentMessages === true;
  const asUser = settings.agentMessagesAsUser === true;
  const limit =
    settings.agentMessagesLimit === undefined
      ? 10
      : settings.agentMessagesLimit;
  const set = (key: string, value: unknown) => {
    setPending(true);
    // The rows have no place for a failure, so it shows as a toast.
    void action("set_setting", { key, value })
      .catch((failure) => toast.error(String(failure)))
      .finally(() => setPending(false));
  };
  const limits =
    limit !== null && !LIMITS.includes(limit) ? [...LIMITS, limit] : LIMITS;
  const asMe = t("Send as me", "以我的身份發送");
  return (
    <ToolSwitchRow
      title={t("Let agents message each other", "允許Agent互發訊息")}
      description={t(
        "Agents message, start and read other sessions here.",
        "Agent可給本機其他工作階段發訊息、開新工作階段、取回回答。",
      )}
      checked={enabled}
      pending={pending}
      onChange={(value) => set("agentMessages", value)}
    >
      {/* "Send as me" carries a caution tag, which PluginControl has no
       * place for, so it is a Settings row of its own. */}
      <Row
        title={
          <>
            {asMe} <Pill tone="orange">{t("Caution", "注意")}</Pill>
          </>
        }
        subtitle={t(
          "No agent label: others act on it as yours.",
          "不標明來自Agent，對方會當成你的話照做。",
        )}
      >
        <Switch
          aria-label={asMe}
          checked={asUser}
          disabled={pending}
          onCheckedChange={(value) => set("agentMessagesAsUser", value)}
        />
      </Row>
      <Row
        title={t("Passes in a row", "連續來回上限")}
        subtitle={t(
          "Then they wait for you. Your next message resets it.",
          "到了就停下等你；你說一句就重新計數。",
        )}
      >
        <Menu
          label={t("Passes in a row", "連續來回上限")}
          value={limit === null ? "none" : String(limit)}
          disabled={pending}
          width={88}
          change={(value) =>
            set("agentMessagesLimit", value === "none" ? null : Number(value))
          }
          options={[
            ...[...limits]
              .sort((a, b) => a - b)
              .map((each): [string, string] => [String(each), String(each)]),
            ["none", t("No limit", "不限")],
          ]}
        />
      </Row>
    </ToolSwitchRow>
  );
}
