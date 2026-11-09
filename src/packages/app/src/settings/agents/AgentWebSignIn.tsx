import { invoke, isTauri } from "@tauri-apps/api/core";
import type { NativeMethod, Provider } from "@agent-hud/protocol";
import { Button } from "@agent-hud/ui/components/button";
import { Row, Section, type Text } from "../SettingsPrimitives";

/** A quota only the vendor's site shows: the user signs in to it in Agent
 * HUD's own window, and can sign out here. Agent HUD keeps only the session
 * the window ends with, on this computer, and opens the window only when the
 * user asks. */
export function AgentWebSignIn({
  t,
  source,
  action,
  perform,
  pending,
}: {
  t: Text;
  source: Provider;
  action: (
    method: NativeMethod,
    params?: Record<string, unknown>,
  ) => Promise<unknown>;
  perform: (work: () => Promise<unknown>) => void;
  pending: boolean;
}) {
  const web = source.accountStatus?.webSignIn;
  if (!web?.sites.length) return null;
  const ended = source.accountStatus?.failure === "signedOut";
  return (
    <Section
      title={t("Quota sign-in", "額度登入")}
      footer={t(
        "This quota is shown only on the vendor's site. Sign in there in Agent HUD's own window; Agent HUD keeps that sign-in on this computer and never reads your browser's. Google may refuse to sign in inside such a window; another way the site offers works.",
        "這項額度只在廠商網站上顯示。在 Agent HUD 自己的視窗里登入後，Agent HUD 只在這台電腦上儲存這次登入，不會讀取瀏覽器里的登入。Google 可能拒絕在這種視窗里登入，可改用網站提供的其他方式。",
      )}
    >
      {web.sites.map((site) => (
        <Row
          key={site.host}
          title={site.name}
          subtitle={
            site.signedIn
              ? ended
                ? t("Sign-in ended; sign in again", "登入已失效，請重新登入")
                : t(`Signed in on ${site.host}`, `已在 ${site.host} 登入`)
              : t(`Not signed in on ${site.host}`, `未在 ${site.host} 登入`)
          }
        >
          <div style={{ display: "flex", gap: 6 }}>
            {(!site.signedIn || ended) && (
              <Button
                size="sm"
                disabled={pending || !isTauri()}
                onClick={() =>
                  perform(() =>
                    invoke("web_sign_in", {
                      provider: web.provider,
                      host: site.host,
                    }),
                  )
                }
              >
                {t("Sign in", "登入")}
              </Button>
            )}
            {site.signedIn && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  perform(() =>
                    action("web_sign_out", {
                      provider: web.provider,
                      host: site.host,
                    }),
                  )
                }
              >
                {t("Sign out", "結束登入")}
              </Button>
            )}
          </div>
        </Row>
      ))}
    </Section>
  );
}
