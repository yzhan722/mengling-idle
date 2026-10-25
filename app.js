// 组合入口：拼装 state / ui / DOM / 各 app 层子系统，初始化 UI 后进入 boot。
// 域逻辑见 modules/app/* 、 modules/systems/* 、 modules/render/* 、 modules/tabs/* 。

import { setupGlobalErrorHandling } from "./modules/error_handler.js";
import { createAnalytics } from "./modules/analytics.js";
import { installSpriteHandlers } from "./modules/sprites.js";
import { installGlobalAudioWiring } from "./modules/audio/sound_engine.js";
import { escapeHtml, nowMs, randFloat } from "./modules/utils.js";
import { buildDefs } from "./modules/defs_core.js";
import { createBeastDataClient } from "./modules/beast_data.js";
import { initGameState } from "./modules/app/game_state.js";
import { createUiState } from "./modules/app/ui_state.js";
import { collectDomRefs } from "./modules/app/dom_refs.js";
import {
  BOSS_BULLY_SNOOZE_KEY,
  CAPTURE_PREVIEW_KEY,
  LOG_COLLAPSE_KEY,
  readLocalStorage,
  writeLocalStorage,
} from "./modules/app/storage.js";
import {
  initLeaderboardIdentity,
  lbBaseUrl,
  createLbFetchJson,
  createAvatarTools,
  createPowerCalcs,
  createLeaderboardAutoRefresh,
} from "./modules/app/leaderboard_core.js";
import { createTickerSystem } from "./modules/app/ticker.js";
import { createLogUiSystem } from "./modules/app/log_ui.js";
import { createCoreHelpers } from "./modules/app/core_helpers.js";
import { createMonHelpers } from "./modules/app/mon_helpers.js";
import { createCoreFns } from "./modules/app/core_fns.js";
import { createSaveCloud } from "./modules/app/save_cloud.js";
import { createCaptureSystem } from "./modules/app/capture_system.js";
import { createCaptureFlow } from "./modules/app/capture_flow.js";
import { createServerBuffsUi } from "./modules/app/server_buffs_ui.js";
import { createBossBullySystem } from "./modules/app/boss_bully.js";
import { createLeaderboardData } from "./modules/app/leaderboard_data.js";
import { createOptionsGoals } from "./modules/app/options_goals.js";
import { initGameUi } from "./modules/app/wiring.js";
import { createRenderLoop } from "./modules/app/render_loop.js";
import { createBoot } from "./modules/app/boot.js";

(() => {
  setupGlobalErrorHandling();
  const analytics = createAnalytics({ gameVersion: "0.7.26" });

  installSpriteHandlers();
  installGlobalAudioWiring();

  try {
    const STYLE_GUARD_KEY = "mengling_idle_style_fix_v1";
    const isMobile = typeof window.matchMedia === "function" ? window.matchMedia("(max-width: 980px)").matches : false;
    const ua = typeof navigator !== "undefined" ? String(navigator.userAgent || "") : "";
    const isWeChat = /micromessenger/i.test(ua);
    const already = typeof window.sessionStorage !== "undefined" ? window.sessionStorage.getItem(STYLE_GUARD_KEY) : null;
    if (isMobile && isWeChat && !already) {
      const probe = document.createElement("button");
      probe.className = "logFab";
      probe.style.position = "absolute";
      probe.style.left = "-9999px";
      probe.style.top = "-9999px";
      (document.body || document.documentElement).appendChild(probe);
      const pos = window.getComputedStyle(probe).position;
      probe.remove();
      if (pos !== "fixed") {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `./styles.css?cb=${Date.now()}`;
        document.head.appendChild(link);
      }
      try {
        window.sessionStorage.setItem(STYLE_GUARD_KEY, "1");
      } catch {
      }
    }
  } catch {
  }

  const TYPE_ZH = globalThis.TYPE_ZH;
  const { getBeastDataByDex } = createBeastDataClient();
  const defs = buildDefs();

  // ===================== STATE_INIT =====================
  let autosaveEnabled;
  let state;
  ({ state, autosaveEnabled } = initGameState());
  const getState = () => state;
  const setState = (s) => { state = s; };

  const ui = createUiState();
  const els = collectDomRefs();

  try {
    const raw = localStorage.getItem(CAPTURE_PREVIEW_KEY);
    if (raw === "1") ui.capturePreviewHidden = true;
    if (raw === "0") ui.capturePreviewHidden = false;
  } catch {
  }

  // ===================== LEADERBOARD_IDENTITY + NETWORK =====================
  initLeaderboardIdentity(ui);
  let cloudSaveRef = null;
  const lbFetchJson = createLbFetchJson({ getToken: () => cloudSaveRef?.getToken?.() });

  // ===================== TICKER + LOG =====================
  const tickerSystem = createTickerSystem({
    getElTicker: () => els.elTicker,
    getUi: () => ui,
    lbBaseUrl,
    lbFetchJson,
    escapeHtml,
    nowMs,
    readLocalStorage,
    writeLocalStorage,
  });
  const pushTickerEvent = tickerSystem.pushTickerEvent;
  const ensureTickerPolling = tickerSystem.ensureTickerPolling;

  let render = () => {};
  const logUi = createLogUiSystem({
    elLog: els.elLog,
    elLogToggle: els.elLogToggle,
    ui,
    render: () => render(),
    logCollapseKey: LOG_COLLAPSE_KEY,
  });
  logUi.initLogCollapse();
  logUi.initLogPlacement();

  // ===================== CORE_HELPERS =====================
  let wiringRef = null;
  const emptyRenders = {
    renderDex() {},
    renderCapture() {},
    renderMons() {},
    renderFunctions() {},
    renderPve() {},
    renderLeaderboard() {},
  };
  const getRenders = () => wiringRef?.renders ?? emptyRenders;

  // 捕捉系统先于 helpers：tryAdvanceEra 需要 getCaptureAreas
  const captureSystem = createCaptureSystem({ defs, getState, ui, randFloat });
  const {
    getAreas: getCaptureAreas,
    getUnlockedAreas: getUnlockedCaptureAreas,
    ensureAreaValid: ensureCaptureAreaValid,
    getActiveArea: getActiveCaptureArea,
    getPool: getCapturePool,
    getMythicPool,
    getBaseCatchChanceByDex: baseCatchChanceByDex,
    getBaseCatchChanceByTier: baseCatchChanceByTier,
    pickRandomFromPool,
  } = captureSystem;

  const helpers = createCoreHelpers({
    ui,
    elHint: els.elHint,
    getState,
    getRenders,
    getCaptureAreas,
    pushTickerEvent,
  });
  const {
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
  } = helpers;

  function activateTab(name) {
    wiringRef?.tabController?.activateTab?.(name);
  }

  // ===================== SERVER_BUFFS + MON_HELPERS =====================
  let savecRef = null;
  const sbuffs = createServerBuffsUi({
    ui,
    lbBaseUrl,
    lbFetchJson,
    getState,
    addLog,
    save: () => savecRef?.save(),
    render: () => render(),
    markOverlaysDirty,
    markServerBuffsDirty,
    pushTickerEvent,
    analytics,
    elServerBuffBar: els.elServerBuffBar,
    elServerBuffToggle: els.elServerBuffToggle,
  });
  const {
    getServerBuffLevel,
    serverBuffMul,
    serverBuffEffectText,
    closeServerBuffBuyModal,
    ensureServerBuffsPolling,
    buyServerBuff,
    bindServerBuffBarEvents,
  } = sbuffs;
  bindServerBuffBarEvents();

  const mons = createMonHelpers({
    getState,
    ui,
    defs,
    getBeastDataByDex,
    serverBuffMul,
    addLog,
  });
  const {
    getSpeciesByPid,
    getMonCurrentStats,
    createMonInstance,
    addExpToMon,
    evolveMon,
    expNeedForLevel,
    monPower,
  } = mons;

  // ===================== ECONOMY + DERIVED =====================
  const core = createCoreFns({
    getState,
    ui,
    defs,
    analytics,
    addLog,
    serverBuffMul,
    activateTab,
    pushTickerEvent,
    render: () => render(),
  });
  const {
    dexCaughtCount,
    dexCaughtUnique,
    computeDexEffects,
    computeTechEffects,
    getBuildingCost,
    getResearchCost,
    computeResearchTimeSec,
    getResearchEfficiency,
    canAfford,
    pay,
    canStartResearch,
    startResearchByTid,
    tryAutoResearch,
    addRes,
    getPokeballMakeCost,
    computeDerived,
  } = core;

  // ===================== SAVE_CLOUD =====================
  const savec = createSaveCloud({
    getState,
    setState,
    getAutosaveEnabled: () => autosaveEnabled,
    ui,
    render: () => render(),
    hint,
    addLog,
    elCloudStatus: els.elCloudStatus,
  });
  savecRef = savec;
  const {
    cloudSave,
    setCloudStatus,
    refreshCloudUI,
    doCloudSyncNow,
    save,
    bindSavePanelEvents,
  } = savec;
  cloudSaveRef = cloudSave;

  // ===================== CAPTURE_AWARD =====================
  let socialTab = null;
  const getSocialTab = () => socialTab;
  const setSocialTab = (t) => { socialTab = t; };

  const cflow = createCaptureFlow({
    getState,
    ui,
    addLog,
    addRes,
    createMonInstance,
    syncEraProgress,
    analytics,
    pushTickerEvent,
    getSocialTab,
    dexCaughtUnique,
    getCapturePool,
    pickRandomFromPool,
    baseCatchChanceByDex,
    computeTechEffects,
    defs,
  });
  const { pickRandomBeast, awardCaughtBeast, doCatch } = cflow;

  // ===================== BOSS_BULLY =====================
  const {
    ensureBossBullyPolling,
    onBossBullyMaybeReward,
    claimBossBullyReward,
    closeBossBullyRewardModal,
  } = createBossBullySystem({
    ui,
    defs,
    BOSS_BULLY_SNOOZE_KEY,
    readLocalStorage,
    lbBaseUrl,
    lbFetchJson,
    addRes,
    addLog,
    save,
    markOverlaysDirty,
    render: () => render(),
  });

  // ===================== LEADERBOARD_DATA =====================
  const avatarTools = createAvatarTools({ ui, markLeaderboardDirty, render: () => render() });
  const calcs = createPowerCalcs({ getState, monPower });
  const { refreshLeaderboards, submitScoreAndRefresh } = createLeaderboardData({
    ui,
    lbBaseUrl,
    lbFetchJson,
    getState,
    dexCaughtUnique,
    calcTopMons: calcs.calcTopMons,
    calcTeamPower: calcs.calcTeamPower,
    calcTotalPower: calcs.calcTotalPower,
    markLeaderboardDirty,
    render: () => render(),
  });
  const ensureLeaderboardAutoRefresh = createLeaderboardAutoRefresh({ ui, refreshLeaderboards });

  // ===================== OPTIONS_GOALS =====================
  const renderOptionsGoals = createOptionsGoals({ ui, getState, addRes, addLog, activateTab });

  // ===================== WIRING =====================
  const wiring = initGameUi({
      ui,
      defs,
      els,
      getState,
      analytics,
      hint,
      addLog,
      markDexDirty,
      markCaptureDirty,
      markMonsDirty,
      markMonListDirty,
      markFunctionsDirty,
      markPveDirty,
      markLeaderboardDirty,
      markOverlaysDirty,
      syncEraProgress,
      tryAdvanceEra,
      getSpeciesByPid,
      getMonCurrentStats,
      createMonInstance,
      addExpToMon,
      evolveMon,
      expNeedForLevel,
      monPower,
      dexCaughtCount,
      dexCaughtUnique,
      computeDexEffects,
      computeTechEffects,
      getBuildingCost,
      getResearchCost,
      computeResearchTimeSec,
      getResearchEfficiency,
      canAfford,
      pay,
      addRes,
      getPokeballMakeCost,
      canStartResearch,
      startResearchByTid,
      tryAutoResearch,
      computeDerived,
      pickRandomBeast,
      awardCaughtBeast,
      doCatch,
      getCaptureAreas,
      getUnlockedCaptureAreas,
      ensureCaptureAreaValid,
      getActiveCaptureArea,
      getCapturePool,
      getMythicPool,
      baseCatchChanceByDex,
      baseCatchChanceByTier,
      pickRandomFromPool,
      save,
      render: () => render(),
      activateTab,
      lbBaseUrl,
      lbFetchJson,
      refreshLeaderboards,
      submitScoreAndRefresh,
      ensureLeaderboardAutoRefresh,
      avatarFileToDataUrl: avatarTools.avatarFileToDataUrl,
      renderOwnerIcon: avatarTools.renderOwnerIcon,
      renderSelfAvatarPreview: avatarTools.renderSelfAvatarPreview,
      trainerIconSrc: avatarTools.trainerIconSrc,
      calcTopMons: calcs.calcTopMons,
      calcTeamPower: calcs.calcTeamPower,
      calcTotalPower: calcs.calcTotalPower,
      getServerBuffLevel,
      serverBuffMul,
      serverBuffEffectText,
      buyServerBuff,
      closeServerBuffBuyModal,
      closeBossBullyRewardModal,
      claimBossBullyReward,
      onBossBullyMaybeReward,
      getBeastDataByDex,
      createOptionsGoalsFn: renderOptionsGoals,
      getSocialTab,
      pushTickerEvent,
      TYPE_ZH,
  });
  wiringRef = wiring;

  render = createRenderLoop({
    ui,
    getState,
    computeDerived,
    renders: wiring.renders,
    elLog: els.elLog,
    getTabController: () => wiringRef?.tabController,
  });

  // ===================== BOOT =====================
  const boot = createBoot({
    ui,
    getState,
    els,
    defs,
    tick: wiring.tick,
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
    getAutosaveEnabled: () => autosaveEnabled,
    ensureTickerPolling,
    ensureBossBullyPolling,
    ensureServerBuffsPolling,
    cloudSave,
    refreshCloudUI,
    doCloudSyncNow,
    bindSavePanelEvents,
  });
  boot();
})();
