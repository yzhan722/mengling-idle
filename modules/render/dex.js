import {
  buildShinyShareText,
  shinyGalleryEntries,
  shinyUniqueCount,
  syncShinyGalleryFromMons,
} from "../systems/collection_fun.js";
import { typeZh } from "../systems/gameplay_fun.js";
import { ZONE_IDS, ZONE_LABELS } from "../beast_defs.js";
import { renderDexStageHtml, setHtmlPreservingStage } from "./tab_stages.js";

export function createRenderDex({
  elDexSummary,
  elDexList,
  elDexPrev,
  elDexNext,
  elDexPageInfo,
  elDexArea,
  elDexRegionInfo,
  ui,
  defs,
  getState,
  clamp,
  pad3,
  escapeHtml,
  renderBeastIcon,
  dexCaughtCount,
  computeDexEffects,
  getCaptureAreas,
  canClaimDexRegion,
  markDexRegionClaimed,
}) {
  return function renderDex() {
    const state = getState();
    if (!elDexSummary || !elDexList || !elDexPrev || !elDexNext || !elDexPageInfo) return;
    if (ui.activeTab !== "dex") return;
    if (!ui.dexDirty) return;

    syncShinyGalleryFromMons(state);

    const totalSpecies = defs.beasts.length;
    const { unique, total } = dexCaughtCount();
    const dexEff = computeDexEffects();
    const dexPct = totalSpecies > 0 ? Math.round((unique / totalSpecies) * 100) : 0;
    const shinyCount = Math.max(0, Math.floor(Number.isFinite(state.shinyCount) ? state.shinyCount : 0));
    const shinyUnique = shinyUniqueCount(state);
    const shinyFromMons = Array.isArray(state.mons?.list)
      ? state.mons.list.filter((m) => m && m.isShiny).length
      : 0;
    const shinyShow = Math.max(shinyCount, shinyFromMons, shinyUnique);

    const areas = getCaptureAreas();
    const areaId = ui.dexAreaId || "all";
    const area = areaId === "all" ? null : areas.find((a) => a.id === areaId) ?? null;
    if (areaId !== "all" && !area) ui.dexAreaId = "all";

    let regionGoalHtml = "";
    if (area && typeof area.pool === "function") {
      const regionPool = defs.beasts.filter(area.pool);
      const regionTotal = regionPool.length;
      let regionCaught = 0;
      const caughtMap = state.dex?.caught || {};
      for (const p of regionPool) {
        if (typeof caughtMap[p.id] === "number" && caughtMap[p.id] > 0) regionCaught += 1;
      }
      const regionPct = regionTotal > 0 ? Math.round((regionCaught / regionTotal) * 100) : 0;
      const regionDone = regionTotal > 0 && regionCaught >= regionTotal;
      if (!state.meta || typeof state.meta !== "object") state.meta = {};
      const canClaim = regionDone && canClaimDexRegion(state.meta, area.id);
      const claimed = regionDone && !canClaimDexRegion(state.meta, area.id);
      regionGoalHtml = `
        <div class="row__desc">区域目标：${escapeHtml(area.name)} ${regionCaught}/${regionTotal}（${regionPct}%）
          ${regionDone ? `<span class="badge badge--ok">区域完成</span>` : ""}
          ${canClaim ? `<button type="button" class="btn btn--small btn--primary" data-dex-claim-region="${escapeHtml(area.id)}">领取 +10 未来币</button>` : ""}
          ${claimed ? `<span class="badge">已领区域奖</span>` : ""}
        </div>`;
    }

    let nextCatchHtml = "";
    {
      const caughtMap = state.dex?.caught || {};
      const pool = area && typeof area.pool === "function" ? defs.beasts.filter(area.pool) : defs.beasts;
      const missing = pool.find((p) => !(typeof caughtMap[p.id] === "number" && caughtMap[p.id] > 0));
      if (missing) {
        nextCatchHtml = `<div class="row__desc">下一只推荐：${escapeHtml(missing.name)} <button type="button" class="btn btn--small btn--primary" data-dex-goto-capture="1">去捕捉</button></div>`;
      } else if (dexPct >= 100) {
        nextCatchHtml = `<div class="row__desc"><span class="badge badge--ok">当前范围已全收集</span></div>`;
      }
    }

    const gallery = shinyGalleryEntries(state, 16);
    const shareText = buildShinyShareText(state);
    const galleryHtml =
      gallery.length > 0
        ? `<div class="row__desc" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px">
            <span class="badge badge--ok">闪光馆 ${shinyUnique}</span>
            ${gallery
              .map(
                (e) =>
                  `<button type="button" class="shiny-gallery-chip" data-dex-shiny-showcase="${escapeHtml(String(e.dex))}" title="点击全屏鉴赏 ${escapeHtml(e.name)}">${renderBeastIcon(e.dex, e.name, true)}<span class="shiny-gallery-chip__name">${escapeHtml(e.name)}</span></button>`
              )
              .join("")}
            <button type="button" class="btn btn--small btn--primary" data-dex-shiny-showcase="all">✨ 全屏陈列秀</button>
            <button type="button" class="btn btn--small btn--ghost" data-dex-shiny-share data-share="${escapeHtml(shareText)}">复制分享</button>
            <button type="button" class="btn btn--small btn--ghost" data-dex-shiny-card>保存分享卡</button>
          </div>`
        : `<div class="row__desc muted">闪光馆空空如也 — 捕捉或孵出闪光后会出现在这里，并可开启全屏星芒陈列秀。</div>`;

    const dexStageHtml = renderDexStageHtml({
      state,
      defs,
      unique,
      totalSpecies,
      dexPct,
      shinyUnique,
      dexEff,
      gallery,
      renderBeastIcon,
      escapeHtml,
    });

    setHtmlPreservingStage(
      elDexSummary,
      `
      ${dexStageHtml}
      <div class="row dex-summary">
        <div class="row__left">
          <div class="row__title">完成度</div>
          <div class="row__desc">已登记：${unique}/${totalSpecies}（${dexPct}%） · 总捕获：${total}${shinyShow > 0 ? ` · 闪光 ${shinyShow}` : ""}${shinyUnique > 0 ? ` · 闪光图鉴 ${shinyUnique}` : ""}</div>
          ${regionGoalHtml}
          ${nextCatchHtml}
          ${galleryHtml}
          <div class="dex-progress" aria-label="图鉴完成度 ${dexPct}%"><div class="dex-progress__fill" style="width:${dexPct}%"></div></div>
        </div>
        <div class="row__right">
          <div class="badge">灵果产量 x${dexEff.catnipPerSecMul.toFixed(2)}</div>
          <div class="badge">灵木产量 x${dexEff.woodRateMul.toFixed(2)}</div>
          <div class="badge">灵晶产量 x${dexEff.mineralsRateMul.toFixed(2)}</div>
        </div>
      </div>
    `,
    );

    const caught = state.dex.caught;
    const q = (ui.dexQuery || "").trim();
    const onlyCaught = Boolean(ui.dexOnlyCaught);
    const onlyMissing = Boolean(ui.dexOnlyMissing);
    const onlyShiny = Boolean(ui.dexOnlyShiny);
    const shinyMap = state.dex?.shiny && typeof state.dex.shiny === "object" ? state.dex.shiny : {};

    if (elDexArea) {
      const allSelected = (ui.dexAreaId || "all") === "all";
      elDexArea.innerHTML = [`<option value="all" ${allSelected ? "selected" : ""}>所有区域</option>`]
        .concat(
          areas.map((a) => {
            const sel = a.id === ui.dexAreaId;
            const suffix = a.unlocked ? "" : "（未解锁）";
            return `<option value="${a.id}" ${sel ? "selected" : ""}>${escapeHtml(a.name)}${suffix}</option>`;
          })
        )
        .join("");
    }

    if (elDexRegionInfo) {
      const label = area ? area.name : "所有区域";
      elDexRegionInfo.textContent = onlyShiny ? `闪光收藏 · ${label}` : `当前区域：${label}`;
    }

    const poolFn = area ? area.pool : null;

    const filtered = defs.beasts.filter((p) => {
      if (poolFn && !poolFn(p)) return false;
      if (onlyShiny) return Boolean(shinyMap[p.id]);
      const n = typeof caught[p.id] === "number" ? caught[p.id] : 0;
      const seen = n > 0;
      if (onlyMissing && seen) return false;
      if (!onlyMissing && onlyCaught && !seen) return false;
      if (!q) return true;
      const qLower = q.toLowerCase();
      const dexStr = String(p.dex);
      const orderStr = String(p.order || p.dex);
      if (dexStr === qLower || pad3(p.dex) === qLower || orderStr === qLower || pad3(p.order || p.dex) === qLower) return true;
      if (p.title && p.title.toLowerCase().includes(qLower)) return true;
      return p.name.toLowerCase().includes(qLower);
    });

    const pageSize = ui.dexPageSize;
    const maxPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
    ui.dexPage = clamp(ui.dexPage, 0, maxPage);

    const start = ui.dexPage * pageSize;
    const slice = filtered.slice(start, start + pageSize);

    if (elDexPageInfo) {
      elDexPageInfo.textContent = `第 ${ui.dexPage + 1}/${maxPage + 1} 页（共 ${filtered.length} 条）`;
    }
    if (elDexPrev) elDexPrev.disabled = ui.dexPage <= 0;
    if (elDexNext) elDexNext.disabled = ui.dexPage >= maxPage;

    const typesMap = globalThis.BEAST_TYPES ?? {};
    const TIER_LABELS = { common: "常见", uncommon: "少见", rare: "稀有", epic: "史诗" };

    const rows = [];
    for (const p of slice) {
      const n = typeof caught[p.id] === "number" ? caught[p.id] : 0;
      const seen = n > 0;
      const isShinyEntry = Boolean(shinyMap[p.id]);
      const revealMissing = onlyMissing;
      const locked = !seen && !revealMissing && !isShinyEntry;
      const displayNo = pad3(p.order || p.dex);
      const title = locked ? "????" : p.name;
      const subtitleTag = !locked && p.title ? `<span class="beast-title-tag">【${escapeHtml(p.title)}】</span>` : "";
      const zoneId = ZONE_IDS[p.zone] || "meadow";
      const zoneName = ZONE_LABELS[zoneId] || "芽芽草甸";
      const tierLabel = TIER_LABELS[p.tier] || "常见";
      const pTypes = Array.isArray(typesMap[p.dex]) ? typesMap[p.dex] : [];
      const typeBadgesHtml = !locked
        ? pTypes
            .map((t) => `<span class="badge type type-${escapeHtml(t)}">${escapeHtml(typeZh(t))}</span>`)
            .join("")
        : "";
      const loreHtml = locked
        ? `<div class="row__desc dex-lore muted">栖息地线索：${escapeHtml(zoneName)} · 探索捕捉后解锁《星野灵兽录》生态传记。</div>`
        : p.desc
          ? `<div class="row__desc dex-lore">${escapeHtml(p.desc)}</div>`
          : "";

      const icon = locked
        ? `<span class="dex-silhouette" aria-hidden="true">${renderBeastIcon(p.dex, "未知萌灵", false)}</span>`
        : renderBeastIcon(p.dex, p.name, isShinyEntry);

      rows.push(`
        <div class="row dex-card ${locked ? "is-locked" : ""}">
          <div class="row__left">
            <div class="row__title row__titleLine">${icon}<span>No.${displayNo} ${escapeHtml(title)}</span>${subtitleTag}${isShinyEntry ? ' <span class="badge badge--ok">★ 闪光</span>' : ""}${typeBadgesHtml}</div>
            ${loreHtml}
          </div>
          <div class="row__right">
            <div class="badge badge--muted">${escapeHtml(zoneName)} · ${escapeHtml(tierLabel)}</div>
            <div class="badge ${isShinyEntry ? "badge--ok" : seen ? "badge--ok" : "badge--muted"}">${isShinyEntry ? `已捕获 ${n} · ★` : seen ? `已捕获 ${n}` : "未登记"}</div>
            ${!seen ? `<button type="button" class="btn btn--small" data-dex-goto-capture="${escapeHtml(p.id)}">去捕捉</button>` : ""}
          </div>
        </div>
      `);
    }

    elDexList.innerHTML = rows.join("");
    ui.dexDirty = false;
  };
}
