// The Settings window's pages: the built-in ones and their sidebar groups,
// and where a product's own pages go among them.
import type { ReactNode } from "react";
import {
  Coins,
  Download,
  Monitor,
  Network,
  Plug,
  Puzzle,
  Settings2,
  Waypoints,
} from "lucide-react";
import type { Snapshot } from "@agent-hud/protocol";

/** Sidebar groups, top to bottom; a gap separates them. */
export const pageGroups = ["app", "agents", "devices", "about"] as const;
export type PageGroup = (typeof pageGroups)[number];
const pages: {
  id: string;
  label: string;
  icon: typeof Settings2;
  color: string;
  description: string;
  group: PageGroup;
}[] = [
  {
    id: "general",
    label: "General",
    icon: Settings2,
    color: "#8e8e93",
    description: "Appearance, language and startup.",
    group: "app",
  },
  {
    id: "display",
    label: "Display",
    icon: Monitor,
    color: "#7c65e8",
    description: "The HUD and its panel on each screen.",
    group: "app",
  },
  {
    id: "agents",
    label: "Agents",
    icon: Puzzle,
    color: "#30b0c7",
    description: "Which agents Agent HUD follows, and their accounts.",
    group: "agents",
  },
  {
    // What Agent HUD installs into each client.
    id: "agent-plugins",
    label: "Agent plugins",
    icon: Plug,
    color: "#30b0c7",
    description: "What Agent HUD adds to the agents on this computer.",
    group: "agents",
  },
  {
    // Relays, one per address, whichever agents use them.
    id: "relays",
    label: "Relays",
    icon: Waypoints,
    color: "#ff9500",
    description: "The relays your agents go through.",
    group: "agents",
  },
  {
    id: "prices",
    label: "Prices",
    icon: Coins,
    color: "#34c759",
    description: "What each model costs. Set your own when it is wrong.",
    group: "agents",
  },
  {
    // What paired phones read: quota and token usage, never sessions.
    id: "local-network",
    label: "Local Network",
    icon: Network,
    color: "#5e5ce6",
    description: "Share quota and token usage with paired phones.",
    group: "devices",
  },
  {
    id: "updates",
    label: "Updates",
    icon: Download,
    color: "#007aff",
    description: "Agent HUD updates and beta releases.",
    group: "about",
  },
];
export const chinesePages: Record<string, [string, string]> = {
  general: ["通用", "外觀、語言與啓動。"],
  display: ["顯示", "每塊螢幕上的 HUD 和它的面板。"],
  agents: ["Agent", "Agent HUD 關注哪些Agent，以及它們的帳戶。"],
  "agent-plugins": ["Agent插件", "Agent HUD 為這台電腦上的Agent添加的功能。"],
  relays: ["中轉站", "Agent經過的中轉站。"],
  prices: ["價格", "每個模型的價格，不對時可以自己改。"],
  "local-network": ["局域網", "與已配對的手機共享額度和 token 用量。"],
  updates: ["更新", "Agent HUD 的更新與 Beta 版本。"],
};

export interface AppExtensionPage {
  id: string;
  title: string;
  icon?: ReactNode;
  color?: string;
  description?: string;
  zh?: [string, string];
  /** Built-in page id this page takes the place of, in its slot. */
  replaces?: string;
  /** Sidebar group of a page that replaces none; the last group if unset. */
  group?: PageGroup;
  /** Page id this page goes right before, within its group. */
  before?: string;
  render(context: {
    snapshot: Snapshot | null;
    request: (method: string, params?: unknown) => Promise<unknown>;
  }): ReactNode;
}
type SidebarPage = {
  id: string;
  label: string;
  icon: typeof Settings2;
  color: string;
  description: string;
  group: PageGroup;
  customIcon?: ReactNode;
};
/** The sidebar's pages in order: a product page that replaces a built-in
 * one takes its slot; the others join their group, before the page they
 * name or at the group's end. */
export function sidebarPages(
  extensionPages: AppExtensionPage[],
): SidebarPage[] {
  const list: SidebarPage[] = pages.map((page) => {
    const replacement = extensionPages.find(
      (item) => item.replaces === page.id,
    );
    return replacement
      ? {
          id: replacement.id,
          label: replacement.title,
          icon: page.icon,
          color: replacement.color ?? page.color,
          description: replacement.description ?? page.description,
          group: page.group,
          customIcon: replacement.icon,
        }
      : { ...page };
  });
  for (const page of extensionPages) {
    if (page.replaces) continue;
    const entry: SidebarPage = {
      id: page.id,
      label: page.title,
      icon: Puzzle,
      color: page.color ?? "#7474d4",
      description: page.description ?? "",
      group: page.group ?? pageGroups[pageGroups.length - 1],
      customIcon: page.icon,
    };
    const before = page.before
      ? list.findIndex((item) => item.id === page.before)
      : -1;
    if (before >= 0) {
      list.splice(before, 0, { ...entry, group: list[before].group });
      continue;
    }
    let last = -1;
    list.forEach((item, index) => {
      if (pageGroups.indexOf(item.group) <= pageGroups.indexOf(entry.group))
        last = index;
    });
    list.splice(last + 1, 0, entry);
  }
  return list;
}
