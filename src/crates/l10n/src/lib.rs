//! The language the app writes its own text in: notices, statuses and
//! reasons, in Chinese or English as agent-hud-native-open's `L10n` writes them.
//! Quota window names stay in English in every language, and what a vendor
//! or a client wrote passes through.
//!
//! Text is written in the language of the moment it is made, as in Open: a
//! notice made before the language changed stays as it was until it is made
//! again. The host tells the system's language once at launch; Core follows
//! the Language setting at every snapshot.
use serde_json::Value;
use std::sync::atomic::{AtomicBool, Ordering};

static SYSTEM_CHINESE: AtomicBool = AtomicBool::new(false);
static CHINESE: AtomicBool = AtomicBool::new(false);

/// The system's preferred language, which the "system" setting follows.
pub fn set_system_chinese(chinese: bool) {
    SYSTEM_CHINESE.store(chinese, Ordering::Relaxed);
}

/// Whether the system's preferred language, told at launch, is Chinese.
pub fn system_chinese() -> bool {
    SYSTEM_CHINESE.load(Ordering::Relaxed)
}

/// Follows the Language setting: "system", "zh-CN" or "en".
pub fn follow(setting: &Value) {
    let chinese = match setting.as_str().unwrap_or("system") {
        "system" => SYSTEM_CHINESE.load(Ordering::Relaxed),
        language => language.starts_with("zh"),
    };
    CHINESE.store(chinese, Ordering::Relaxed);
}

pub fn chinese() -> bool {
    CHINESE.load(Ordering::Relaxed)
}

/// The text in the app's language (Open's `L10n.text(zh, en)`).
pub fn text(zh: &str, en: &str) -> String {
    if chinese() { zh } else { en }.to_owned()
}

pub fn language() -> &'static str {
    if chinese() { "zh-TW" } else { "en" }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn text_follows_the_setting_and_the_system_language() {
        set_system_chinese(true);
        follow(&json!("system"));
        assert_eq!(text("額度", "Quota"), "額度");
        follow(&json!("en"));
        assert_eq!(text("額度", "Quota"), "Quota");
        follow(&json!("zh-CN"));
        assert!(chinese());
        follow(&json!("zh-TW"));
        assert_eq!(language(), "zh-TW");
        assert_eq!(
            text("預設設定和工作階段紀錄", "Settings"),
            "預設設定和工作階段紀錄"
        );
        follow(&json!("system"));
        assert_eq!(language(), "zh-TW");
        set_system_chinese(false);
        follow(&json!("system"));
        assert!(!chinese());
    }
}
