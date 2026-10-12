// 排行榜数据流：拉取 10 榜 + 成绩提交（SECTION:LEADERBOARD_DATA 拆出）
// 维护者窗口：D

import { getGameVersion } from "../utils.js";

export function createLeaderboardData({
  ui,
  lbBaseUrl,
  lbFetchJson,
  getState,
  dexCaughtUnique,
  calcTopMons,
  calcTeamPower,
  calcTotalPower,
  markLeaderboardDirty,
  render,
}) {
  async function refreshLeaderboards() {
    const base = lbBaseUrl();
    ui.lbBusy = true;
    ui.lbErr = "";
    markLeaderboardDirty();
    render();
    try {
      const [dex, power, contrib, hatch, shiny, totalPower, gather, resource, catchLb, rebirthLb] = await Promise.all([
        lbFetchJson(`${base}/api/leaderboard/dex?limit=100`).catch(() => ({ items: [] })),
        lbFetchJson(`${base}/api/leaderboard/power?limit=100`).catch(() => ({ items: [] })),
        lbFetchJson(`${base}/api/leaderboard/contrib?limit=100`).catch(() => ({ items: [] })),
        lbFetchJson(`${base}/api/leaderboard/hatch?limit=100`).catch(() => ({ items: [] })),
        lbFetchJson(`${base}/api/leaderboard/shiny?limit=100`).catch(() => ({ items: [] })),
        lbFetchJson(`${base}/api/leaderboard/total_power?limit=100`).catch(() => ({ items: [] })),
        lbFetchJson(`${base}/api/leaderboard/gather?limit=100`).catch(() => ({ items: [] })),
        lbFetchJson(`${base}/api/leaderboard/resource?limit=100`).catch(() => ({ items: [] })),
        lbFetchJson(`${base}/api/leaderboard/catch?limit=100`).catch(() => ({ items: [] })),
        lbFetchJson(`${base}/api/leaderboard/rebirths?limit=100`).catch(() => ({ items: [] })),
      ]);
      ui.lbDexItems = Array.isArray(dex?.items) ? dex.items : [];
      ui.lbPowerItems = Array.isArray(power?.items) ? power.items : [];
      ui.lbContribItems = Array.isArray(contrib?.items) ? contrib.items : [];
      ui.lbHatchItems = Array.isArray(hatch?.items) ? hatch.items : [];
      ui.lbShinyItems = Array.isArray(shiny?.items) ? shiny.items : [];
      ui.lbTotalPowerItems = Array.isArray(totalPower?.items) ? totalPower.items : [];
      ui.lbGatherItems = Array.isArray(gather?.items) ? gather.items : [];
      ui.lbResourceItems = Array.isArray(resource?.items) ? resource.items : [];
      ui.lbCatchItems = Array.isArray(catchLb?.items) ? catchLb.items : [];
      ui.lbRebirthItems = Array.isArray(rebirthLb?.items) ? rebirthLb.items : [];
    } catch (e) {
      const raw = String(e && typeof e === "object" && "message" in e ? e.message : e || "请求失败");
      const isAbort = Boolean(e && typeof e === "object" && "name" in e && e.name === "AbortError");
      ui.lbErr = isAbort || raw.toLowerCase().includes("aborted") ? "请求超时/被取消" : raw;
    } finally {
      ui.lbBusy = false;
      markLeaderboardDirty();
      render();
    }
  }

  async function submitScoreAndRefresh() {
    const base = lbBaseUrl();
    const name = typeof ui.lbName === "string" ? ui.lbName.trim() : "";
    if (!name) {
      ui.lbErr = "请先填写昵称";
      markLeaderboardDirty();
      render();
      return;
    }

    ui.lbBusy = true;
    ui.lbErr = "";
    markLeaderboardDirty();
    render();
    try {
      const state = getState();
      const topMons = calcTopMons(6);
      const teamPower = calcTeamPower(topMons);
      const totalPower = calcTotalPower();
      const hatchCount = Math.max(0, Math.floor(Number.isFinite(state.hatchCount) ? state.hatchCount : 0));
      const shinyCount = Math.max(0, Math.floor(Number.isFinite(state.shinyCount) ? state.shinyCount : 0));
      const gatherClicks = Math.max(0, Math.floor(Number.isFinite(state.gatherClicks) ? state.gatherClicks : 0));
      const resourceProduced = Math.max(0, Math.floor(Number.isFinite(state.resourceProduced) ? state.resourceProduced : 0));
      const catchCount = Math.max(0, Math.floor(Number.isFinite(state.catchCount) ? state.catchCount : 0));

      const body = {
        uid: ui.lbUid,
        name,
        dexCount: dexCaughtUnique(),
        power: teamPower,
        totalPower,
        hatchCount,
        shinyCount,
        gatherClicks,
        resourceProduced,
        catchCount,
        rebirthCount: Math.max(0, Math.floor(Number.isFinite(state.era?.prestigeCount) ? state.era.prestigeCount : 0)),
        gameVersion: getGameVersion(),
        topMons,
        avatar: typeof ui.lbAvatar === "string" && ui.lbAvatar ? ui.lbAvatar : null,
      };
      await lbFetchJson(`${base}/api/score/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await refreshLeaderboards();
    } catch (e) {
      const raw = String(e && typeof e === "object" && "name" in e ? e.message : e || "提交失败");
      const isAbort = Boolean(e && typeof e === "object" && "name" in e && e.name === "AbortError");
      ui.lbErr = isAbort || raw.toLowerCase().includes("aborted") ? "请求超时/被取消" : raw;
      ui.lbBusy = false;
      markLeaderboardDirty();
      render();
    }
  }

  return { refreshLeaderboards, submitScoreAndRefresh };
}
