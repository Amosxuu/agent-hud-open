//! What the recipient reads around a message, and why a call was refused, in
//! the app's language.
use super::journal::Party;
use agent_hud_platform::delivery::PromptForm;

fn say(zh: bool, chinese: &str, english: &str) -> String {
    if zh { chinese } else { english }.to_owned()
}
fn client(client: &str) -> &'static str {
    match client {
        "claude" => "Claude Code",
        "antigravity" => "Antigravity",
        "deepseek" => "DeepSeek Harness",
        _ => "Codex",
    }
}

/// Agent HUD's send_message as the recipient's client names it to its model.
/// Each client also has a send_message of its own (Claude Code's SendMessage,
/// Codex's for its collaborators, Harness's for its sub-agents), so a bare
/// "send_message" is taken for those. Antigravity's name is not known yet.
fn reply_tool(zh: bool, client: &str) -> String {
    let name = match client {
        "claude" | "deepseek" => "mcp__agent-hud__send_message",
        "codex" => "mcp__agent_hud__send_message",
        _ => {
            return say(
                zh,
                "agent-hud 的 send_message 工具",
                "agent-hud's send_message tool",
            )
        }
    };
    if zh {
        format!("agent-hud 的 MCP 工具 {name}")
    } else {
        format!("agent-hud's MCP tool {name}")
    }
}

/// The words delivered. Labelled: a first line naming the sender and the
/// message, the text, and a last line saying how to reply: with send_message
/// and reply_to first, as the recipient's client names that tool, so the
/// reply comes back as a message; a plain answer, which the sender reads with
/// get_message, only without the tool. A reply's last line is shorter, so two
/// agents do not thank each other back and forth. As the user's own: the text
/// alone.
pub fn compose(
    zh: bool,
    form: PromptForm,
    from: &Party,
    to_client: &str,
    id: &str,
    reply_to: Option<&str>,
    text: &str,
) -> String {
    if form == PromptForm::Own {
        return text.to_owned();
    }
    let title = from
        .title
        .as_deref()
        .map(|title| {
            title
                .chars()
                .map(|c| match c {
                    '\n' | '\r' => ' ',
                    ']' => ')',
                    '[' => '(',
                    c => c,
                })
                .take(60)
                .collect::<String>()
        })
        .filter(|title| !title.trim().is_empty())
        .map(|title| format!(" · {}", title.trim()))
        .unwrap_or_default();
    let reply = reply_to
        .map(|parent| format!(" · {} {parent}", if zh { "回復" } else { "re" }))
        .unwrap_or_default();
    let label = format!(
        "[Agent HUD · {} {}{title} · {id}{reply}]",
        if zh { "來自" } else { "from" },
        client(&from.client)
    );
    let tool = reply_tool(zh, to_client);
    let footer = match (zh, reply_to) {
        (true, None) => format!("請用 {tool} 回復，reply_to: {id}，回復會作為一條訊息送到發件方。沒有這個工具時就直接作答，發件方能取回你這一輪最後的回答。"),
        (false, None) => format!("Reply with {tool}, reply_to: {id}: your reply reaches the sender as a message. Without that tool, answer here: the sender can read this turn's last reply."),
        (true, Some(parent)) => format!("這是對 {parent} 的回復。還需要再說時，用 {tool} 回復，reply_to: {id}。"),
        (false, Some(parent)) => format!("This answers {parent}. Only if more is needed, reply with {tool}, reply_to: {id}."),
    };
    format!("{label}\n\n{text}\n\n{footer}")
}

pub fn off(zh: bool) -> String {
    say(
        zh,
        "Agent 互發訊息已關閉，可在 設定 → Agent插件 里打開。",
        "Agent messages are off; the user can turn them on in Settings → Agent plugins.",
    )
}
pub fn no_caller(zh: bool) -> String {
    say(
        zh,
        "Agent HUD 認不出是哪個工作階段在呼叫，不發匿名訊息。",
        "Agent HUD could not tell which session is calling, and it sends no anonymous messages.",
    )
}
pub fn empty(zh: bool) -> String {
    say(zh, "沒有要發的內容。", "There is no text to send.")
}
pub fn phone_tag(zh: bool) -> String {
    say(zh, "以 [Agent HUD · iPhone] 開頭的話代表使用者本人在手機上說的，agent 不能這樣開頭。", "Text starting with [Agent HUD · iPhone] stands for the user speaking from their phone; an agent's message cannot start with it.")
}
pub fn to_self(zh: bool) -> String {
    say(zh, "這是你自己的工作階段。", "That is your own session.")
}
pub fn unknown(zh: bool) -> String {
    say(
        zh,
        "沒有這個 id 的 Claude Code、Codex、Antigravity 或 DeepSeek Harness 工作階段，list_sessions 里有各工作階段的 id。",
        "No Claude Code, Codex, Antigravity or DeepSeek Harness session has this id; list_sessions shows the ids.",
    )
}
pub fn other_client(zh: bool) -> String {
    say(
        zh,
        "只能發給 Claude Code、Codex、Antigravity 和 DeepSeek Harness 工作階段。",
        "Messages go to Claude Code, Codex, Antigravity and DeepSeek Harness sessions only.",
    )
}
pub fn child(zh: bool) -> String {
    say(
        zh,
        "這是一個子 agent，只能發給主工作階段。",
        "That is a sub-agent; messages go to main sessions only.",
    )
}
pub fn unknown_reply(zh: bool, id: &str) -> String {
    if zh {
        format!("reply_to {id} 不是這個工作階段收到的訊息。")
    } else {
        format!("reply_to {id} names no message this session received.")
    }
}
pub fn limit(zh: bool, limit: u32) -> String {
    if zh {
        format!("兩個 agent 已經連續來回 {limit} 次，等你看一眼。使用者在這條鏈上的任何一個工作階段裡親手打一句話，計數就清零。")
    } else {
        format!("These agents have passed messages {limit} times in a row; waiting for the user to take a look. A word the user types in any session of the chain starts the count again.")
    }
}
pub fn cannot_start(zh: bool, which: &str) -> String {
    if zh {
        format!(
            "這台電腦上開不了新的 {} 工作階段：沒找到它的命令行，或者沒有可用的資料夾。",
            client(which)
        )
    } else {
        format!("Agent HUD cannot start a {} session on this computer: its command line was not found, or there is no folder to start in.", client(which))
    }
}
pub fn folder(zh: bool, folder: &str, folders: &[String]) -> String {
    let list = if folders.is_empty() {
        "—".to_owned()
    } else {
        folders.join(", ")
    };
    match (zh, folder.is_empty()) {
        (true, true) => format!("這裡不能開不進目錄的工作階段。可選的資料夾：{list}"),
        (true, false) => format!("{folder} 不是這個用戶端在這台電腦上用過的資料夾。可選：{list}；或傳空字符串，開在它自己的任務資料夾里。"),
        (false, true) => format!("A session without a folder is not offered here. Folders: {list}"),
        (false, false) => format!("{folder} is not a folder this client works in on this computer. Choose one of: {list}; or pass an empty folder for its own task folder."),
    }
}
pub fn unknown_message(zh: bool) -> String {
    say(
        zh,
        "沒有這個 id 的訊息（訊息記錄保留一周）。",
        "No message has this id (messages are kept for a week).",
    )
}
pub fn claude_ready(zh: bool) -> String {
    say(
        zh,
        "Agent HUD 插件已報到，工作階段空閒時就會收到。",
        "Agent HUD's plugin checked in; the session takes it once idle.",
    )
}
pub fn claude_not_loaded(zh: bool) -> String {
    say(zh, "這個工作階段沒有載入 Agent HUD 的 Claude Code 插件（在工作階段裡執行一次 /reload-plugins），或者工作階段已關閉或被桌面版暫停。", "Agent HUD's Claude Code plugin is not loaded in this session (run /reload-plugins in it), or the session is closed or paused by the desktop app.")
}
pub fn deepseek_ready(zh: bool) -> String {
    say(
        zh,
        "Agent HUD 插件已報到，訊息會排進這個工作階段的隊列，空閒時送達。",
        "Agent HUD's plugin checked in; the message joins the session's queue and goes in once it is idle.",
    )
}
pub fn deepseek_not_loaded(zh: bool) -> String {
    say(
        zh,
        "這個工作階段沒有運行 Agent HUD 的 DeepSeek Harness 插件（在 設定 → Agent插件 里安裝），或者工作階段已關閉。",
        "Agent HUD's DeepSeek Harness plugin is not running in this session (install it in Settings → Agent plugins), or the session is closed.",
    )
}
pub fn deepseek_no_start(zh: bool) -> String {
    say(
        zh,
        "Agent HUD 還不能開新的 DeepSeek Harness 工作階段；可以用 send_message 發給已經打開的工作階段。",
        "Agent HUD cannot start DeepSeek Harness sessions yet; send_message reaches one that is open.",
    )
}
pub fn codex_open(zh: bool) -> String {
    say(
        zh,
        "Codex 正開著這個對話，空閒時就會把訊息當作新的一輪。",
        "Codex has this thread open; it takes the message as a new turn once idle.",
    )
}
pub fn codex_wakes(zh: bool) -> String {
    say(
        zh,
        "Agent HUD 會在 Codex 桌面版里打開這個對話來送達。",
        "Agent HUD opens the thread in the Codex app to deliver it.",
    )
}
pub fn codex_waits(zh: bool) -> String {
    say(
        zh,
        "訊息會留在 Codex 的隊列里，等 Codex 打開這個對話時送達。",
        "Codex keeps it queued until a Codex app or command line opens this thread.",
    )
}
pub fn codex_no_command(zh: bool) -> String {
    say(
        zh,
        "沒找到 Codex 的命令行，無法把訊息放進它的隊列。",
        "No Codex command line was found to queue the message through.",
    )
}
pub fn antigravity_waits(zh: bool) -> String {
    say(
        zh,
        "發送時會通過正在運行的 Antigravity 本地服務送達。",
        "Antigravity delivers the message through its running local service when sent.",
    )
}
pub fn replied(zh: bool, reply: &str) -> String {
    if zh {
        format!("對方用訊息 {reply} 回復了；這條回復會在你空閒時作為新的一輪送到你的工作階段。")
    } else {
        format!("They answered with message {reply}; it comes to your session as a new turn once you are idle.")
    }
}
