import {
  Page,
  Row,
  Section,
  useText,
  type SettingsPaneProps,
} from "./SettingsPrimitives";
import { SmallButton } from "./SettingsControls";

/** Open builds have no update feed; a product build replaces this page. */
export function UpdatesPane({ snapshot }: SettingsPaneProps) {
  const t = useText(snapshot);
  return (
    <Page>
      <Section>
        <Row
          title={t("Automatic updates", "自動更新")}
          subtitle={t(
            "This build does not update itself.",
            "這個版本不會自動更新。",
          )}
        >
          <SmallButton disabled>{t("Unavailable", "不可用")}</SmallButton>
        </Row>
      </Section>
    </Page>
  );
}
