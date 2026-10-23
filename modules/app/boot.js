// 启动序列：离线结算/每日登录/社交系统/计时器（SECTION:RENDER_AND_SAVE 中 boot() 拆出）
// 维护者窗口：A
// setSocialTab 把社交实例回挂到 app 级变量，供捕捉分享等惰性引用

import { clamp, escapeHtml, fmt, formatLocalYmd, nowMs, randFloat } from "../utils.js";
import { initGuideSystem } from "../guide.js";
import { createTabBadgeSystem } from "../tab_badges.js";
import { load as loadRemoteConfig } from "../remote_config.js";
import { formatWelcomeBackSummary, localDateStr } from "../systems/gameplay_fun.js";
import { createFriendsSystem, createRenderFriends } from "../friends.js";
import { createSocialSystem } from "../social.js";
import { createRenderSocial } from "../render/social.js";
import { createSocialTab } from "../tabs/social_tab.js";
import { createPvpBattle } from "../pvp_battle.js";
import { DAILY_LOGIN_REWARD_KEY, readLocalStorage } from "./storage.js";
import { initStageInteractions } from "../ui/stage_interactions.js";

export function createBoot({
  ui,
  getState,
  els,
  defs,
  tick,
  save,
  render,
  activateTab,
  hint,
  addLog,
  addRes,
  computeDerived,
  analytics,
  lbBaseUrl,
  lbFetchJson,
  getMonCurrentStats,
  getBeastDataByDex,
  pushTickerEvent,
  setSocialTab,
  getSocialTab,
  getAutosaveEnabled,
  ensureTickerPolling,
  ensureBossBullyPolling,
  ensureServerBuffsPolling,
  cloudSave,
  refreshCloudUI,
  doCloudSyncNow,
  bindSavePanelEvents,
}) {
  return function boot() {
    const state = getState();

    ensureTickerPolling();
    ensureBossBullyPolling();
    ensureServerBuffsPolling();
    computeDerived();

    ui.leaderboardDirty = true;
    ui.serverBuffsDirty = true;
    ui.bossDirty = true;

    refreshCloudUI();
    cloudSave.installLifecycleFlush();
    analytics.init({
      baseUrl: lbBaseUrl,
      getToken: () => cloudSave.getToken(),
      getUid: () => (typeof ui.lbUid === "string" ? ui.lbUid : ""),
    });
    analytics.trackOnceSession("session_start");
    loadRemoteConfig(lbBaseUrl()).then((cfg) => {
      ui.remoteConfig = cfg;
    }).catch(() => {});
    if (cloudSave.getToken()) {
      doCloudSyncNow();
    }

    if (!getAutosaveEnabled()) {
      addLog("检测到存档读取失败：已暂停自动存档以防覆盖。请使用云存档恢复。", true);
    }

    // 新手引导系统（前 30 分钟：采集→球→捕捉→榜→云）
    initGuideSystem({ getState, activateTab, addLog });

    // 全场景可交互热点与粒子反馈引擎
    initStageInteractions({ ui, getState, defs, addRes, addLog, hint, render });

    // Tab 红点系统
    const elTabsEl = document.querySelector(".tabs");
    const tabBadges = createTabBadgeSystem({ elTabs: elTabsEl, getState, defs });
    // 每5秒刷新一次红点
    setInterval(() => tabBadges.updateBadges(), 5000);
    tabBadges.updateBadges();

    // 设置页云面板 + 存/取档按钮（社交刷新为惰性 thunk——socialTab 稍后初始化）
    bindSavePanelEvents(els, { refreshSocial: () => getSocialTab()?.refreshSocial?.() });

    const last = state.t;
    const dt = clamp((nowMs() - last) / 1000, 0, 60 * 60 * 6);
    if (dt > 2) {
      const before = {
        catnip: state.res.catnip.value,
        wood: state.res.wood.value,
        minerals: state.res.minerals.value,
        pokeball: state.res.pokeball.value,
        catchCount: state.catchCount || 0,
        eraId: state.era?.id || "",
        pveCleared: Object.keys(state.pve?.progress || {}).filter((k) => !k.includes("_")).length,
        expeditionsCompleted: state.meta?.expeditionsCompleted ?? 0,
        trainingExpGained: state.meta?.trainingExpGained ?? 0,
      };

      tick(dt, { offline: true });

      const dCat = state.res.catnip.value - before.catnip;
      const dWood = state.res.wood.value - before.wood;
      const dMin = state.res.minerals.value - before.minerals;
      const dBall = state.res.pokeball.value - before.pokeball;

      const parts = [];
      if (dCat > 0) parts.push(`灵果 +${fmt(dCat)}`);
      if (dWood > 0) parts.push(`灵木 +${fmt(dWood)}`);
      if (dMin > 0) parts.push(`灵晶碎片 +${fmt(dMin)}`);
      if (dBall > 0) parts.push(`灵球 +${fmt(dBall)}`);
      if (parts.length > 0) addLog(`离线收益：${parts.join("，")}`);

      const highlights = formatWelcomeBackSummary(state, before, dt);
      if (highlights) addLog(`今日精彩：${highlights}`, true);
    }

    if (getAutosaveEnabled()) {
      try {
        const today = formatLocalYmd();
        const last = readLocalStorage(DAILY_LOGIN_REWARD_KEY);
        if (last !== today) {
          localStorage.setItem(DAILY_LOGIN_REWARD_KEY, today);
          addRes("pokeball", 20);
          addRes("evolutionStone", 1);
          const gotMb = randFloat() < 0.05;
          if (gotMb) addRes("masterball", 1);
          addLog(gotMb ? "每日登录奖励：灵球 +20，灵晶石 +1，额外 究极灵球 +1" : "每日登录奖励：灵球 +20，灵晶石 +1", true);
          hint(gotMb ? "今日登录奖励已发放，获得究极灵球！" : "今日登录奖励已发放。", 3000);
          save();
        }
      } catch {
        // ignore
      }
    }

    // 初始化好友系统
    const friendsSystem = createFriendsSystem({
      lbBaseUrl,
      ui,
      addLog,
    });

    const renderFriends = createRenderFriends({
      ui,
      escapeHtml,
      friendsSystem,
    });

    // 初始化社交系统
    const socialSystem = createSocialSystem({
      lbBaseUrl,
      lbFetchJson,
      ui,
      addLog,
    });

    const renderSocial = createRenderSocial({
      ui,
      escapeHtml,
      socialSystem,
      getState,
      formatTime: (ts) => {
        const now = Date.now();
        const diff = now - ts;
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        if (diff < minute) return "刚刚";
        if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
        if (diff < day) return `${Math.floor(diff / hour)}小时前`;
        if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;
        const date = new Date(ts);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      },
    });

    const socialTabInstance = createSocialTab({
      ui,
      addLog,
      socialSystem,
      renderSocial,
      friendsSystem,
      renderFriends,
      getState,
      createPvpBattle,
      getMonCurrentStats,
      getBeastDataByDex,
      pushTickerEvent,
    });

    setSocialTab(socialTabInstance);

    // 初始化社交标签页
    socialTabInstance.setupSocialTab();

    render();

    // 默认落在 Bonfire 标签页
    activateTab("bonfire");

    let lastFrame = nowMs();
    window.setInterval(() => {
      const t = nowMs();
      let dtSec = clamp((t - lastFrame) / 1000, 0, 60 * 60 * 6);
      lastFrame = t;

      const chunkSec = 60;
      const s = getState();
      while (dtSec > 0) {
        const step = Math.min(chunkSec, dtSec);
        tick(step);
        dtSec -= step;
      }
      s.t = t;
      render();
    }, 500);

    if (getAutosaveEnabled()) {
      window.setInterval(() => {
        save();
      }, 3000);
    }

    addLog("冒险开始。", true);
  };
}
