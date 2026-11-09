// Client hooks: Agent HUD's hooks in each client's settings, which let the HUD
// answer permission requests and show finished turns, and how long the HUD
// holds a request before the client asks by itself.
import type { Snapshot } from "@agent-hud/protocol";
import { Switch } from "@agent-hud/ui/components/switch";
import { Menu, Unavailable } from "../SettingsControls";
import {
  Notice,
  Pill,
  Row,
  Section,
  type SettingsPaneProps,
  type Text,
} from "../SettingsPrimitives";
import { usePending } from "../use-pending";

export function HooksSection({
  snapshot,
  action,
  t,
}: {
  snapshot: Snapshot;
  action: SettingsPaneProps["action"];
  t: Text;
}) {
  const { pending, error, run } = usePending();
  const status = snapshot.connection.clientHooks;
  const on = snapshot.settings.clientHooks;
  const configure = async (
    key: "clientHooks" | "approvalWaitMinutes",
    value: unknown,
  ) => {
    if (pending) return;
    await run(() => action("set_setting", { key, value }));
  };
  const reason =
    status?.supported !== true
      ? t(
          "This system doesn't support client hooks.",
          "這個系統不支援用戶端回呼。",
        )
      : status.installable !== true
        ? t(
            "Needs Agent HUD at its approved installation location.",
            "需要從指定安裝位置運行 Agent HUD。",
          )
        : null;
  const toggle = (
    <Switch
      aria-label={t("Client hooks", "用戶端回呼")}
      checked={on}
      disabled={pending || reason !== null}
      onCheckedChange={(value) => void configure("clientHooks", value)}
    />
  );
  return (
    <Section
      title={t("Hooks", "回呼")}
      // A failed switch already says why in the notice below; the status
      // carries the same words, so it is not repeated as the footer.
      footer={error ? undefined : (status?.notice ?? undefined)}
    >
      <Row
        title={t("Client hooks", "用戶端回呼")}
        subtitle={t(
          "For permission requests and finished turns in the HUD.",
          "在 HUD 上回答權限請求、提示完成。",
        )}
      >
        {status?.supported &&
          (status.installed ? (
            <Pill tone="green" dot>
              {t("Installed", "已安裝")}
            </Pill>
          ) : (
            <Pill tone={on ? "orange" : "gray"} dot>
              {t("Not installed", "未安裝")}
            </Pill>
          ))}
        {reason && !pending ? (
          <Unavailable reason={reason}>{toggle}</Unavailable>
        ) : (
          toggle
        )}
      </Row>
      <Row
        title={t("Wait for an answer", "等待回答")}
        subtitle={t(
          "Then the request goes back to the client.",
          "到時未回答，交還用戶端自己詢問。",
        )}
      >
        <Menu
          label={t("Wait for an answer", "等待回答")}
          value={String(snapshot.settings.approvalWaitMinutes ?? 10)}
          options={[1, 3, 5, 10, 30, 60].map((minutes) => [
            String(minutes),
            t(
              minutes === 1 ? "1 minute" : `${minutes} minutes`,
              `${minutes} 分鐘`,
            ),
          ])}
          disabled={pending || !on}
          reason={
            on
              ? undefined
              : t("Turn on client hooks first.", "請先打開用戶端回呼。")
          }
          change={(value) =>
            void configure("approvalWaitMinutes", Number(value))
          }
        />
      </Row>
      {error && <Notice tone="error">{error}</Notice>}
    </Section>
  );
}
