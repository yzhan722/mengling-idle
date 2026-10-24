// 核心微枢纽：hint/addLog + mark*Dirty + 时代推进辅助（SECTION:CORE_HELPERS + DIRTY_FLAGS 拆出）
// 维护者窗口：A
// getRenders/getCaptureAreas/pushTickerEvent 均为惰性 thunk——容忍初始化顺序

import { advanceEra, syncEraQuests } from "../systems/era.js";

export function createCoreHelpers({ ui, elHint, getState, getRenders, getCaptureAreas, pushTickerEvent }) {
  function hint(text, ttl = 2000) {
    elHint.textContent = text;
    elHint.hidden = !text;
    if (ttl > 0) {
      window.setTimeout(() => {
        if (elHint.textContent === text) {
          elHint.textContent = "";
          elHint.hidden = true;
        }
      }, ttl);
    }
  }

  function addLog(msg, important = false) {
    const state = getState();
    if (!important && ui.logLastMsg === msg && ui.logLastCount >= 1 && Array.isArray(state.log) && state.log.length > 0) {
      ui.logLastCount += 1;
      const line = `[${new Date().toLocaleTimeString()}] ${msg} ×${ui.logLastCount}`;
      state.log[0] = line;
      ui.logDirty = true;
      return;
    }

    ui.logLastMsg = important ? null : msg;
    ui.logLastCount = important ? 0 : 1;

    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    state.log.unshift(line);
    state.log = state.log.slice(0, 30);
    ui.logDirty = true;
    try {
      window.GameAudio?.playOutcomeSfxFromText?.(msg);
    } catch {}
    if (important) {
      hint(msg, 2800);
      try {
        if (typeof window.showToast === "function") {
          const ty = /闪光|✨/.test(msg) ? "shiny" : /失败|不够|不可|请先/.test(msg) ? "warn" : "ok";
          window.showToast(msg, ty, 3200);
        }
      } catch {}
    }
  }

  // ---- 脏标记 ----
  function markOverlaysDirty() {
    ui.overlaysDirty = true;
  }

  function markServerBuffsDirty() {
    ui.serverBuffsDirty = true;
  }

  function markDexDirty(resetPage = false) {
    ui.dexDirty = true;
    if (resetPage) ui.dexPage = 0;
    if (ui.activeTab === "dex") getRenders().renderDex();
  }

  function markCaptureDirty() {
    ui.captureDirty = true;
    if (ui.activeTab === "capture") getRenders().renderCapture();
  }

  function markMonsDirty() {
    ui.monsDirty = true;
    ui.functionsDirty = true;
    if (ui.activeTab === "mons") getRenders().renderMons();
  }

  function markMonListDirty(resetPage = false) {
    ui.monsDirty = true;
    ui.functionsDirty = true;
    if (resetPage) ui.monPage = 0;
    if (ui.activeTab === "mons") getRenders().renderMons();
  }

  function markFunctionsDirty() {
    ui.functionsDirty = true;
    if (ui.activeTab === "functions") getRenders().renderFunctions();
  }

  function markPveDirty() {
    ui.pveDirty = true;
    if (ui.activeTab === "pve") getRenders().renderPve();
  }

  function markLeaderboardDirty() {
    ui.leaderboardDirty = true;
    if (ui.activeTab === "leaderboard") getRenders().renderLeaderboard();
  }

  // ---- 时代推进 ----
  function syncEraProgress() {
    syncEraQuests(getState(), getCaptureAreas());
  }

  function tryAdvanceEra() {
    const state = getState();
    const advanced = advanceEra(state, { addLog, getCaptureAreas: getCaptureAreas() });
    if (advanced) {
      markCaptureDirty();
      try {
        const eraName = state.era?.id || "下一时代";
        pushTickerEvent("era", `迈入时代 ${eraName}`);
      } catch {
      }
    }
    return advanced;
  }

  return {
    hint,
    addLog,
    markOverlaysDirty,
    markServerBuffsDirty,
    markDexDirty,
    markCaptureDirty,
    markMonsDirty,
    markMonListDirty,
    markFunctionsDirty,
    markPveDirty,
    markLeaderboardDirty,
    syncEraProgress,
    tryAdvanceEra,
  };
}
