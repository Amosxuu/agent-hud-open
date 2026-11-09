import { useCallback, useEffect, useState } from "react";
import {
  Footnote,
  Notice,
  Page,
  Pill,
  Row,
  Section,
  useText,
  type SettingsPaneProps,
  type Text,
} from "./SettingsPrimitives";
import {
  LinkButton,
  SmallButton,
  ToggleRow,
  Unavailable,
} from "./SettingsControls";
import { usePending } from "./use-pending";

interface Peer {
  id: string;
  name: string | null;
  version?: string | null;
  address: string;
  online: boolean;
  lastSeenMs: number;
}
interface ShareStatus {
  supported: boolean;
  on: boolean;
  enabled: boolean;
  endpoint?: string | null;
  alternateEndpoints?: string[];
  pairedClients: number;
  peers: Peer[];
  error?: string | null;
}
interface Invitation {
  uri: string;
  image: string;
  invitation: { expiresAtMs: number };
}

/** A clock time in the app's language, not the system's. */
const clock = (ms: number, t: Text) =>
  new Date(ms).toLocaleTimeString(t("en-US", "zh-TW"));

/**
 * The Local Network page: paired phones read this computer's quota readings
 * and token usage over the local network (or the owner's Tailscale), and
 * nothing of its sessions. A phone pairs by scanning a single-use code.
 */
export function LocalNetworkPane({
  snapshot,
  action,
  active = true,
}: SettingsPaneProps) {
  const t = useText(snapshot);
  const [status, setStatus] = useState<ShareStatus | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);
  const { pending, error, setError, run } = usePending();
  const share = useCallback(
    (method: string, params: Record<string, unknown> = {}) =>
      action("phone_share", { method, params }),
    [action],
  );
  const read = useCallback(
    () =>
      share("status")
        .then((value) => setStatus(value as ShareStatus))
        .catch((failure) => setError(String(failure))),
    [share],
  );
  // Online state comes from the phones' own connections: read it again
  // while the page is on screen.
  useEffect(() => {
    if (!active) return;
    void read();
    const timer = window.setInterval(() => void read(), 5_000);
    return () => window.clearInterval(timer);
  }, [active, read]);
  const perform = async (job: () => Promise<unknown>) => {
    await run(job);
    void read();
  };
  if (!status)
    return (
      <Page>
        <Footnote>
          {t("Reading local sharing…", "正在讀取局域網設定…")}
        </Footnote>
        {error && <Notice tone="error">{error}</Notice>}
      </Page>
    );
  const addresses = status.endpoint
    ? [
        status.endpoint,
        ...(status.alternateEndpoints ?? []).map(
          (address) => `Tailscale ${address}`,
        ),
      ].join(" · ")
    : status.on
      ? t("No usable network address", "沒有可用的網路地址")
      : t("Sharing is off", "共享已關閉");
  const create = (
    <SmallButton
      disabled={pending || !status.enabled}
      onClick={() =>
        void perform(async () => {
          setInvitation((await share("pair_invitation")) as Invitation);
          setCopied(false);
        })
      }
    >
      {invitation
        ? t("New invitation", "重新建立")
        : t("Create invitation", "建立邀請")}
    </SmallButton>
  );
  const problem = error ?? status.error;
  const unsupported = t(
    "Sharing with phones is not available on this system yet.",
    "這個系統暫不支援與手機共享。",
  );
  return (
    <Page>
      <Section>
        <ToggleRow
          title={t("Share with paired phones", "與已配對手機共享")}
          subtitle={t(
            "Paired iPhones read quota and token usage only.",
            "已配對的 iPhone 只能查看額度和 token 用量。",
          )}
          checked={status.on}
          disabled={!status.supported || pending}
          reason={status.supported ? undefined : unsupported}
          change={(enabled) => {
            setInvitation(null);
            void perform(() => share("set_enabled", { enabled }));
          }}
        />
        <Row title={t("Connection", "連接")} detail={addresses} />
      </Section>
      <Section
        title={t("Pair a device", "配對設備")}
        footer={t(
          "An invitation works once and expires after five minutes. Paired devices can only read.",
          "邀請僅可使用一次，五分鐘後失效。配對設備只能查看。",
        )}
      >
        <Row
          title={t("QR invitation", "二維碼邀請")}
          subtitle={
            invitation
              ? t(
                  "Scan it with Agent HUD on iPhone.",
                  "用 iPhone 上的 Agent HUD 掃描。",
                )
              : undefined
          }
          below={
            invitation && (
              // A white ground whatever the theme, so a phone camera reads it.
              <div style={{ display: "grid", justifyItems: "center" }}>
                <img
                  src={invitation.image}
                  width={200}
                  height={200}
                  alt={t(
                    "Single-use Agent HUD pairing invitation",
                    "一次性 Agent HUD 配對邀請",
                  )}
                  style={{ background: "white", padding: 10, borderRadius: 8 }}
                />
              </div>
            )
          }
        >
          {!status.enabled && !pending ? (
            <Unavailable
              reason={
                !status.supported
                  ? unsupported
                  : status.on
                    ? t("Sharing isn’t running.", "共享未在運行。")
                    : t("Turn on sharing first.", "請先打開共享。")
              }
            >
              {create}
            </Unavailable>
          ) : (
            create
          )}
        </Row>
        {invitation && (
          <Row
            title={t("Pairing link", "配對鏈接")}
            subtitle={t(
              `Expires at ${clock(invitation.invitation.expiresAtMs, t)}`,
              `${clock(invitation.invitation.expiresAtMs, t)} 失效`,
            )}
            detail={invitation.uri}
          >
            <LinkButton
              onClick={() =>
                void navigator.clipboard
                  .writeText(invitation.uri)
                  .then(() => setCopied(true))
                  .catch(() => setCopied(false))
              }
            >
              {copied ? t("Copied", "已複製") : t("Copy link", "複製鏈接")}
            </LinkButton>
          </Row>
        )}
      </Section>
      <Section
        title={t("Devices", "設備")}
        subtitle={pairedSummary(status.pairedClients, t)}
        action={
          status.pairedClients > 0 && (
            <LinkButton
              tone="destructive"
              disabled={pending}
              onClick={() => {
                setInvitation(null);
                void perform(() => share("revoke_clients"));
              }}
            >
              {t("Revoke paired devices", "撤銷已配對設備")}
            </LinkButton>
          )
        }
      >
        {status.peers.length ? (
          status.peers.map((peer) => (
            <Row
              key={peer.id}
              title={
                (peer.name ?? t("Paired device", "已配對設備")) +
                (peer.version ? ` · ${peer.version}` : "")
              }
              detail={peer.address}
            >
              {peer.online ? (
                <Pill tone="green" dot>
                  {t("Online", "在線")}
                </Pill>
              ) : (
                <Pill>
                  {t(
                    `Last seen ${clock(peer.lastSeenMs, t)}`,
                    `最後連接 ${clock(peer.lastSeenMs, t)}`,
                  )}
                </Pill>
              )}
            </Row>
          ))
        ) : (
          <Row
            muted
            title={t(
              "No device has connected since Agent HUD started.",
              "這次啓動後還沒有設備連接。",
            )}
          />
        )}
      </Section>
      {problem && <Notice tone="error">{problem}</Notice>}
    </Page>
  );
}

/** "2 paired devices": the saved pairings, not this launch's connections,
 * which the rows below list. */
function pairedSummary(grants: number, t: Text) {
  return t(
    `${grants} paired ${grants === 1 ? "device" : "devices"}`,
    `已配對 ${grants} 台設備`,
  );
}
