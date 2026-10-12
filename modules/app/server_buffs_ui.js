// 全服 Buff 子系统：轮询/购买/弹窗开关 + buffBar 折叠（SECTION:SERVER_BUFFS 拆出）
// 维护者窗口：D
// save/render/pushTickerEvent 为惰性 thunk

import {
  SERVER_BUFF_KEYS,
  SERVER_BUFF_BUY_MAX_MINUTES,
  SERVER_BUFF_UI,
  getServerBuffLevel as getServerBuffLevel0,
  serverBuffPct as serverBuffPct0,
  serverBuffMul as serverBuffMul0,
  serverBuffResearchTimeMul as serverBuffResearchTimeMul0,
  serverBuffEffectText as serverBuffEffectText0,
} from "../systems/server_buffs.js";
import { clamp } from "../utils.js";

export function createServerBuffsUi({
  ui,
  lbBaseUrl,
  lbFetchJson,
  getState,
  addLog,
  save,
  render,
  markOverlaysDirty,
  markServerBuffsDirty,
  pushTickerEvent,
  analytics,
  elServerBuffBar,
  elServerBuffToggle,
}) {
  function getServerBuffLevel(key) {
    return getServerBuffLevel0(key, ui);
  }

  function serverBuffPct(key) {
    return serverBuffPct0(key, ui);
  }

  function serverBuffMul(key) {
    return serverBuffMul0(key, ui);
  }

  function serverBuffResearchTimeMul() {
    return serverBuffResearchTimeMul0(ui, clamp);
  }

  function serverBuffEffectText(key, lvl) {
    return serverBuffEffectText0(key, lvl);
  }

  function closeServerBuffBuyModal() {
    ui.serverBuffBuyModalOpen = false;
    ui.serverBuffBuyKey = "";
    markOverlaysDirty();
    render();
  }

  function openServerBuffBuyModal(key) {
    ui.serverBuffBuyModalOpen = true;
    ui.serverBuffBuyKey = String(key || "");
    if (!Number.isFinite(ui.serverBuffBuyMinutes) || ui.serverBuffBuyMinutes < 1) ui.serverBuffBuyMinutes = 0;
    markOverlaysDirty();
    render();
  }

  async function refreshServerBuffsOnce() {
    try {
      const base = lbBaseUrl();
      const res = await lbFetchJson(`${base}/api/server/buffs`);
      ui.serverBuffs = res && typeof res === "object" ? res : null;
      const items = Array.isArray(ui.serverBuffs?.items) ? ui.serverBuffs.items : [];
      const levelMap = new Map();
      for (const key of SERVER_BUFF_KEYS) levelMap.set(key, 0);
      for (const it of items) {
        const key = String(it?.key || "");
        if (!SERVER_BUFF_KEYS.includes(key)) continue;
        const lvl = typeof it?.level === "number" && Number.isFinite(it.level) ? Math.max(0, Math.floor(it.level)) : 0;
        levelMap.set(key, lvl);
      }
      ui.serverBuffLevels = levelMap;
      markServerBuffsDirty();
      render();
    } catch {
    }
  }

  let SERVER_BUFF_TIMER_ID = 0;
  function ensureServerBuffsPolling() {
    if (SERVER_BUFF_TIMER_ID) return;
    refreshServerBuffsOnce();
    SERVER_BUFF_TIMER_ID = window.setInterval(() => {
      if (ui.serverBuffBuyModalOpen) return;
      refreshServerBuffsOnce();
    }, 8000);
  }

  async function buyServerBuff(key, minutes) {
    const k = String(key || "");
    if (!SERVER_BUFF_KEYS.includes(k)) return;
    const state = getState();
    const m0 = Math.max(1, Math.floor(minutes || 0));
    const m = Math.min(SERVER_BUFF_BUY_MAX_MINUTES, m0);
    const price = m;
    if ((state.res.futurecoin?.value ?? 0) < price) {
      addLog("未来币不足。", true);
      return;
    }

    try {
      const base = lbBaseUrl();
      const name = typeof ui.lbName === "string" && ui.lbName.trim() ? ui.lbName.trim() : "育灵师";
      await lbFetchJson(`${base}/api/server/buffs/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: k, uid: ui.lbUid, name, addSec: m * 60 }),
      });

      state.res.futurecoin.value = Math.max(0, (state.res.futurecoin?.value ?? 0) - price);
      analytics.trackFuturecoinSpend(price, "server_buff");
      ui.futureDirty = true;
      addLog(`购买全服增益：${SERVER_BUFF_UI[k]?.name ?? k}（+${m} 分钟，花费未来币 ${price}）`, true);
      if (typeof pushTickerEvent === "function") {
        pushTickerEvent("sbuff", `贡献全服增益 ${SERVER_BUFF_UI[k]?.name ?? k}（+${m} 分钟）`);
      }
      save();
      closeServerBuffBuyModal();
      refreshServerBuffsOnce();
    } catch (e) {
      const msg = typeof e?.message === "string" ? e.message : "";
      if (msg.includes("HTTP 422")) {
        addLog(`购买失败：单次购买上限 ${SERVER_BUFF_BUY_MAX_MINUTES} 分钟`, true);
      } else {
        addLog("购买失败：请求失败，请稍后重试", true);
      }
    }
  }

  function bindServerBuffBarEvents() {
    if (elServerBuffBar) {
      elServerBuffBar.addEventListener("click", (ev) => {
        const btn = ev.target?.closest?.("button[data-sbuff-key]");
        if (!btn || !elServerBuffBar.contains(btn)) return;
        const k = String(btn.getAttribute("data-sbuff-key") || "");
        openServerBuffBuyModal(k);
      });
    }

    if (elServerBuffToggle && elServerBuffBar && !elServerBuffToggle.dataset.bound) {
      elServerBuffToggle.dataset.bound = "1";
      elServerBuffToggle.addEventListener("click", () => {
        const open = elServerBuffBar.classList.toggle("is-collapsed") === false;
        elServerBuffToggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
  }

  return {
    getServerBuffLevel,
    serverBuffPct,
    serverBuffMul,
    serverBuffResearchTimeMul,
    serverBuffEffectText,
    closeServerBuffBuyModal,
    openServerBuffBuyModal,
    refreshServerBuffsOnce,
    ensureServerBuffsPolling,
    buyServerBuff,
    bindServerBuffBarEvents,
  };
}
