//! Codex's hooks: permission requests, which wait on the reviewer gate, and
//! session origin.
use crate::hooks::{Hooks, Launch, Layout, Permission, Reply, Setup};
use crate::Location;
use crate::{PerOs, Support};

pub static HOOKS: Hooks = Hooks {
    settings: Some(Location::home(&["CODEX_HOME"], &[".codex"], "hooks.json")),
    aliases: &[],
    environment: &[],
    layout: Layout::Groups,
    permission: Some(Permission {
        timeout: 86_400,
        unanswerable: &[],
        rules: false,
        plans: false,
        reviewer_gate: true,
        settles_in_transcript: false,
        unattended: None,
        policy: None,
        opt_in: false,
        reply: Reply::HookSpecificOutput,
    }),
    completion: None,
    origin: Some(super::process::origin),
    attention: false,
    compaction: None,
    prefixed_sessions: false,
    launch: PerOs {
        macos: Support::Verified(Launch::Command),
        windows: Support::Unverified(Launch::PowerShell),
        linux: Support::Unverified(Launch::Command),
    },
};

/// Codex runs a hook only once the user allowed its exact command, and asks
/// again when the command changes; until then it skips the hook without a
/// word (`hook_review` reads which ones wait).
pub static SETUP: Setup = Setup {
    clients: &["codex"],
    step,
};

fn step(name: &str) -> String {
    crate::l10n::text(
        &format!("在 {name} 輸入框上方點「審查鈎子」，再點「全部允許」，它才會運行這些回呼；回呼改動後要再允許一次。"),
        &format!("{name} runs these hooks once you allow them: click Review hooks above its message box, then Allow all. It asks again whenever they change."),
    )
}
