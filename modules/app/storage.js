// 存档键名常量 + localStorage 安全读写（SECTION:STORAGE_CONSTANTS 拆出）
// 维护者窗口：A

export const STORAGE_KEY = "kittens_mvp_save_v1";
export const STORAGE_BACKUP_KEY = `${STORAGE_KEY}_bak`;
export const SAVE_SLOT_KEY = "kittens_mvp_save_slot_1";
export const DAILY_LOGIN_REWARD_KEY = "kittens_mvp_daily_login_reward_v1";
export const LOG_COLLAPSE_KEY = "kittens_mvp_log_collapsed_v1";
export const CAPTURE_PREVIEW_KEY = "kittens_mvp_capture_preview_hidden_v1";
export const LB_UID_KEY = "kittens_mvp_lb_uid_v1";
export const LB_NAME_KEY = "kittens_mvp_lb_name_v1";
export const LB_AVATAR_KEY = "kittens_mvp_lb_avatar_v1";
export const BOSS_BULLY_SNOOZE_KEY = "kittens_mvp_boss_bully_snooze_until_v1";

export function readLocalStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
  }
}
