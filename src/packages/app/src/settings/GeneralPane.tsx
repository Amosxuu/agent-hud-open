import { invoke, isTauri } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Menu, Segments, ToggleRow, Unavailable } from "./SettingsControls";
import {
  Notice,
  Page,
  Row,
  Section,
  useText,
  type SettingsPaneProps,
} from "./SettingsPrimitives";
import { usePending } from "./use-pending";

const appearanceKeys = ["appearance", "appearanceFollowsScreen", "language"];
const usageKeys = ["quotaDisplay"];
const startupKeys = ["launchAtLogin", "showMenuBarIcon"];

export function GeneralPane({ snapshot, action }: SettingsPaneProps) {
  useEffect(() => {
    if (isTauri())
      void invoke("native_system_status").catch((error) =>
        console.warn("System preferences could not be refreshed", error),
      );
  }, []);
  const t = useText(snapshot);
  const { pending, error, run } = usePending();
  const [savedKey, setSavedKey] = useState("");

  /** One save at a time; a failure shows in the card of the setting that
   * failed. */
  const save = (key: string, value: unknown) => {
    if (pending) return;
    setSavedKey(key);
    void run(() => action("set_setting", { key, value }));
  };
  const setting = (key: string) => (value: unknown) => save(key, value);
  const problem = (keys: string[]) =>
    error && keys.includes(savedKey) ? (
      <Notice tone="error">{error}</Notice>
    ) : null;

  const settings = snapshot.settings;
  const followsScreen = Boolean(settings.appearanceFollowsScreen);
  const login = snapshot.connection.system?.launchAtLogin;
  const loginReason = login?.supported
    ? undefined
    : t(
        login?.notice ?? "Not available in this build.",
        "此版本不支援登入時啓動。",
      );
  // Only states the person can act on; other notices are platform plumbing.
  const loginNote = !login?.supported
    ? null
    : login.status === "requires-approval"
      ? t(
          login.notice ??
            "Allow it in System Settings → General → Login Items.",
          "需在「系統設定 → 通用 → 登入項」中允許。",
        )
      : login.status === "unavailable" && login.notice
        ? t(login.notice, "此版本找不到登入服務。")
        : null;

  const appearance = (
    <Segments
      label={t("Appearance", "外觀")}
      value={settings.appearance}
      disabled={followsScreen}
      options={[
        ["system", t("System", "跟隨系統")],
        ["light", t("Light", "淺色")],
        ["dark", t("Dark", "深色")],
      ]}
      change={setting("appearance")}
    />
  );

  return (
    <Page>
      <Section title={t("Appearance & language", "外觀與語言")}>
        <Row title={t("Appearance", "外觀")}>
          {followsScreen ? (
            <Unavailable
              reason={t(
                "Turn off Match screen to choose.",
                "關閉「跟隨所在螢幕」後可選。",
              )}
            >
              {appearance}
            </Unavailable>
          ) : (
            appearance
          )}
        </Row>
        <ToggleRow
          title={t("Match screen", "跟隨所在螢幕")}
          tag={t("Experimental", "實驗")}
          subtitle={t(
            "Windows take the HUD look of their screen.",
            "視窗外觀跟隨所在螢幕的 HUD。",
          )}
          checked={settings.appearanceFollowsScreen ?? false}
          change={setting("appearanceFollowsScreen")}
        />
        <Row title={t("Language", "語言")}>
          <Menu
            label={t("Language", "語言")}
            value={
              ["zh-Hans", "zh-CN"].includes(settings.language)
                ? "zh-TW"
                : settings.language
            }
            options={[
              ["system", t("System", "跟隨系統")],
              ["zh-TW", "繁體中文"],
              ["en", "English"],
            ]}
            change={setting("language")}
          />
        </Row>
        {problem(appearanceKeys)}
      </Section>
      <Section title={t("Usage display", "用量顯示")}>
        <Row title={t("Quota percentage", "額度百分比")}>
          <Menu
            label={t("Quota percentage", "額度百分比")}
            value={settings.quotaDisplay ?? "consumed"}
            options={[
              ["consumed", t("Used", "已用")],
              ["remaining", t("Remaining", "剩餘")],
            ]}
            change={setting("quotaDisplay")}
          />
        </Row>
        {problem(usageKeys)}
      </Section>
      <Section title={t("Startup & menu bar", "啓動與菜單欄")}>
        <ToggleRow
          title={t("Launch at login", "登入時啓動")}
          checked={login?.enabled ?? settings.launchAtLogin}
          disabled={pending || !login?.supported}
          reason={loginReason}
          change={setting("launchAtLogin")}
        />
        {loginNote && <Notice tone="warning">{loginNote}</Notice>}
        <ToggleRow
          title={t("Show menu bar icon", "顯示菜單欄圖標")}
          checked={settings.showMenuBarIcon !== false}
          change={setting("showMenuBarIcon")}
        />
        {problem(startupKeys)}
      </Section>
    </Page>
  );
}
