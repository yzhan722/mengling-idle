// 主渲染循环：computeDerived → tab 可见性 → 各面板按需渲染（SECTION:RENDER_AND_SAVE 中 render() 拆出）
// 维护者窗口：A

export function createRenderLoop({ ui, getState, computeDerived, renders, elLog, getTabController }) {
  let renderQueued = false;

  return function render() {
    if (renderQueued) return;
    renderQueued = true;
    const schedule = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (cb) => setTimeout(cb, 0);
    schedule(() => {
      renderQueued = false;
      const state = getState();
      const eff = computeDerived();
      renders.renderResources(eff);

      // Tab 阶段性解锁：核心路径尽早可见，重玩法仍按进度开门
      (function updateTabVisibility() {
        const caught = state.dex?.caught ?? {};
        let unique = 0;
        for (const v of Object.values(caught)) if (typeof v === "number" && v > 0) unique++;
        const pokeballUnlocked = Boolean(state.unlocks?.pokeball);
        const hasMons = (state.mons?.list?.length ?? 0) > 0;
        const tabRules = {
          capture:     true,
          mons:        pokeballUnlocked || hasMons,
          functions:   pokeballUnlocked || hasMons,
          items:       pokeballUnlocked || hasMons,
          pve:         unique >= 5,
          dex:         true,
          future:      unique >= 1,
          social:      true,
          leaderboard: true,
          science:     true,
          bonfire:     true,
          help:        true,
          options:     true,
        };
        document.querySelectorAll(".tab[data-tab]").forEach((tabEl) => {
          const tabName = tabEl.getAttribute("data-tab");
          const visible = tabRules[tabName] !== false;
          tabEl.setAttribute("data-unlocked", visible ? "1" : "0");
        });
        const tabController = getTabController();
        if (typeof tabController?.refreshTabChrome === "function") {
          tabController.refreshTabChrome();
        }
      })();
      if (ui.bonfireDirty || ui.activeTab === "bonfire") renders.renderBonfireActions();
      if (ui.activeTab === "bonfire") renders.renderBuildings();
      if (ui.activeTab === "science") renders.renderTech();
      if (ui.activeTab === "capture") renders.renderCapture();
      if (ui.activeTab === "functions") renders.renderFunctions();
      if (ui.activeTab === "leaderboard") renders.renderLeaderboard();
      if (ui.activeTab === "future") {
        renders.renderFutureShop();
        if (typeof renders.renderItems === "function") renders.renderItems();
      }
      if (ui.activeTab === "options" && typeof renders.renderHelp === "function") {
        renders.renderHelp();
      }
      if (ui.activeTab === "mons") renders.renderMons();
      if (ui.activeTab === "dex") renders.renderDex();
      if (ui.activeTab === "pve") renders.renderPve();
      renders.renderServerBuffBar();
      renders.renderOverlays();
      const logCollapsed = elLog && elLog.classList.contains("is-collapsed");
      if (!logCollapsed && ui.logDirty) {
        renders.renderLog();
        ui.logDirty = false;
      }
    });
  };
}
