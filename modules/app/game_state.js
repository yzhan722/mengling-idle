// 存档初始化：主存档 → 备份 → 新档（SECTION:STATE_INIT 拆出）
// 维护者窗口：A

import { defaultState, loadFromRaw } from "../state.js";
import { getBeastTier } from "../beast_defs.js";
import { decodeSaveText } from "../save_codec.js";
import { STORAGE_KEY, STORAGE_BACKUP_KEY, readLocalStorage } from "./storage.js";

// 迁移：根据最新 capture_rate 规则，重算所有已存在萌灵实例的稀有度
function migrateMonTiers(state) {
  if (!state || !state.mons || !Array.isArray(state.mons.list)) return;
  for (const m of state.mons.list) {
    if (!m || typeof m.dex !== "number") continue;
    try {
      m.tier = getBeastTier(m.dex);
    } catch {
      // 保底：如果计算失败，维持原 tier
    }
  }
}

// 确保所有道具资源都存在（兼容旧存档）
const ENSURE_RESOURCES = [
  "expCandy", "expCandyL", "expCandyXL",
  "ultraball", "quickball", "luxuryball",
  "affectionTreat", "friendshipBracelet",
  "shinyCharm", "luckyEgg",
  "bottleCap", "goldBottleCap"
];

function ensureResourceDefaults(state) {
  if (!state.res) state.res = {};
  for (const rid of ENSURE_RESOURCES) {
    if (!state.res[rid] || typeof state.res[rid] !== "object") {
      state.res[rid] = { value: 0, cap: 0 };
    }
    if (typeof state.res[rid].value !== "number") {
      state.res[rid].value = 0;
    }
    if (typeof state.res[rid].cap !== "number") {
      state.res[rid].cap = 0;
    }
  }
}

// 返回 { state, autosaveEnabled }——双档俱损时 autosaveEnabled=false 防止覆盖
export function initGameState() {
  let autosaveEnabled = true;
  let state;
  const rawPrimary = readLocalStorage(STORAGE_KEY);
  if (rawPrimary) {
    const s = loadFromRaw(decodeSaveText(rawPrimary));
    if (s) {
      state = s;
    } else {
      const rawBak = readLocalStorage(STORAGE_BACKUP_KEY);
      const sBak = rawBak ? loadFromRaw(decodeSaveText(rawBak)) : null;
      if (sBak) {
        state = sBak;
      } else {
        // 主存档和备份均损坏，禁止自动存档以防覆盖
        autosaveEnabled = false;
        state = defaultState();
      }
    }
  } else {
    // 首次访问，创建新存档
    state = defaultState();
  }

  migrateMonTiers(state);
  ensureResourceDefaults(state);

  return { state, autosaveEnabled };
}
