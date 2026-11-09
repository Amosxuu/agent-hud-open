import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Snapshot } from "@agent-hud/protocol";

/** Shows a client's failed or unconfirmed answer to a request as a toast,
 * once each and only while `enabled`; an answer older than five minutes
 * stays quiet. */
export function useRequestDeliveryToasts(
  snapshot: Snapshot | null,
  enabled: boolean,
) {
  const seenRequestDeliveries = useRef(new Set<string>());
  useEffect(() => {
    if (!enabled) return;
    for (const delivery of snapshot?.requestDeliveries ?? []) {
      const key = `${delivery.id}:${delivery.state}`;
      if (seenRequestDeliveries.current.has(key)) continue;
      seenRequestDeliveries.current.add(key);
      if (
        delivery.state === "confirmed" ||
        Date.now() - Date.parse(delivery.at) > 300_000
      )
        continue;
      const zh = snapshot?.language?.startsWith("zh") ?? false;
      const title =
        delivery.state === "uncertain"
          ? zh
            ? "未能確認用戶端已收到回應"
            : "Client response unconfirmed"
          : zh
            ? "用戶端回應失敗"
            : "Client response failed";
      const description =
        delivery.reason ??
        (zh
          ? "請先在原用戶端中查看，再做下一步操作。"
          : "Check the original client before taking another action.");
      if (delivery.state === "uncertain") toast.warning(title, { description });
      else toast.error(title, { description });
    }
  }, [enabled, snapshot?.requestDeliveries]);
}
