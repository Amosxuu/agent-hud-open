import { text as localizedText } from "@agent-hud/ui/format";
import { useState } from "react";
import { Button } from "@agent-hud/ui/components/button";
import type { Language } from "@agent-hud/ui/format";
import type { usePanelServices } from "../PanelContext";
import { FittingName } from "./FittingName";
import type { palette } from "./theme";

type DraftState = NonNullable<
  NonNullable<ReturnType<typeof usePanelServices>>["draft"]
>;

/** Open's PanelDraftBar: a layout or style an agent changed and the person
 * has not saved yet, with Discard and Save. */
export function PanelDraftBar({
  draft,
  language,
  colors,
}: {
  draft?: DraftState;
  language: Language;
  colors: ReturnType<typeof palette>;
}) {
  const [draftError, setDraftError] = useState<string | null>(null);
  if (!draft?.unsaved) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        fontSize: 11,
        color: colors.secondary,
      }}
    >
      <div style={{ flex: 1, display: "grid", gap: 1, minWidth: 0 }}>
        <strong style={{ fontWeight: 600, color: colors.text }}>
          {draftTitle(draft, language)}
        </strong>
        <FittingName
          {...draftNote(draft, language)}
          style={{ fontSize: 10, color: colors.secondary }}
        />
      </div>
      {draftError && <span role="alert">{draftError}</span>}
      <Button
        size="xs"
        variant="ghost"
        onClick={() =>
          void draft.discard().catch((error) => setDraftError(String(error)))
        }
      >
        {localizedText(language, "丟棄", "Discard")}
      </Button>
      <Button
        size="xs"
        onClick={() =>
          void draft.save().catch((error) => setDraftError(String(error)))
        }
      >
        {localizedText(language, "儲存", "Save")}
      </Button>
    </div>
  );
}

/** What waits (Open's PanelDraftBar.title): a layout, with or without a
 * style, a style alone, or the app's settings alone. */
function draftTitle(draft: DraftState, language: "en" | "zh" | "zh-TW") {
  if (draft.layout)
    return localizedText(language, "佈局未儲存", "Unsaved layout");
  if (draft.style)
    return localizedText(language, "HUD 樣式未儲存", "Unsaved HUD style");
  return localizedText(language, "應用設定未儲存", "Unsaved app settings");
}

/** When the draft goes, and whose it is (Open's PanelDraftBar.note): this
 * display's alone, or with the app's settings, which are every display's;
 * `short` where `name` does not fit. */
function draftNote(draft: DraftState, language: "en" | "zh" | "zh-TW") {
  const zh = language.startsWith("zh");
  const restart = localizedText(language, "重新啟動後丟棄", "Dropped on restart");
  if (draft.app) {
    if (!draft.layout && !draft.style) return { name: restart, short: restart };
    return zh
      ? { name: "含應用設定，重新啟動後丟棄", short: "含應用設定" }
      : {
          name: "With app settings, dropped on restart",
          short: "With app settings",
        };
  }
  if (draft.layout === "shared") return { name: restart, short: restart };
  return zh
    ? { name: "僅此顯示器，重新啟動後丟棄", short: "僅此顯示器" }
    : {
        name: "This display only, dropped on restart",
        short: "This display only",
      };
}
