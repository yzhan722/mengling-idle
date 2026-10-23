// 存档键名常量 + localStorage 安全读写（SECTION:STORAGE_CONSTANTS 拆出）
// 维护者窗口：A

export const STORAGE_KEY = "mengling_idle_save_v1";
export const STORAGE_BACKUP_KEY = `${STORAGE_KEY}_bak`;
export const SAVE_SLOT_KEY = "mengling_idle_save_slot_1";
export const DAILY_LOGIN_REWARD_KEY = "mengling_idle_daily_login_reward_v1";
export const LOG_COLLAPSE_KEY = "mengling_idle_log_collapsed_v1";
export const CAPTURE_PREVIEW_KEY = "mengling_idle_capture_preview_hidden_v1";
export const LB_UID_KEY = "mengling_idle_lb_uid_v1";
export const LB_NAME_KEY = "mengling_idle_lb_name_v1";
export const LB_AVATAR_KEY = "mengling_idle_lb_avatar_v1";
export const BOSS_BULLY_SNOOZE_KEY = "mengling_idle_boss_bully_snooze_until_v1";

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
