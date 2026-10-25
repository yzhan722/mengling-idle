import { LEGACY_PERK_ORDER, LEGACY_PERKS, canBuyPerk, perkCost, perkLevel } from "../systems/rebirth.js";
import { renderFutureStageHtml, setHtmlPreservingStage } from "./tab_stages.js";
import { renderResSvg } from "./rpg_svg_icons.js";

export function createRenderFutureShop({ elFutureShop, ui, defs, fmt, getState }) {
  return function renderFutureShop() {
    const state = getState();
    if (!elFutureShop) return;
    if (ui.activeTab !== "future") return;
    if (!ui.futureDirty) return;

    const badge = document.getElementById("futureCoinBadge");
    if (badge) {
      const fc = Math.max(0, Math.floor(state.res?.futurecoin?.value ?? 0));
      badge.textContent = `未来币 ${typeof fmt === "function" ? fmt(fc) : fc}`;
    }

    const fmtRemain = (sec) => {
      const s = Math.max(0, Math.ceil(typeof sec === "number" && Number.isFinite(sec) ? sec : 0));
      const hh = Math.floor(s / 3600);
      const mm = Math.floor((s % 3600) / 60);
      const ss = s % 60;
      const pad2 = (x) => String(x).padStart(2, "0");
      if (hh > 0) return `${hh}:${pad2(mm)}:${pad2(ss)}`;
      return `${mm}:${pad2(ss)}`;
    };

    const rates = {
      catnip: 1000,
      wood: 500,
    };

    const AUTO_EX_MAX_LEVEL = 10;
    const autoExLvl0 = state.auto?.autoExchangeLevel ?? 0;
    const autoExLvl =
      typeof autoExLvl0 === "number" && Number.isFinite(autoExLvl0)
        ? Math.max(0, Math.min(AUTO_EX_MAX_LEVEL, Math.floor(autoExLvl0)))
        : 0;
    const autoExOn = Boolean(state.auto?.autoExchangeOn) && autoExLvl > 0;
    const autoExMinText = autoExLvl > 0 ? String(Math.round((100 / autoExLvl) * 100) / 100) : "-";

    const rows = [];
    const foldCfg = ui.futureShopFold && typeof ui.futureShopFold === "object" ? ui.futureShopFold : {};
    const foldDefaults = { daily: false, rebirth: false, exchange: false, boost: true, permanent: true, item: true, auto: true, craft: true };
    const isFolded = (k) =>
      Boolean(
        foldCfg && Object.prototype.hasOwnProperty.call(foldCfg, k)
          ? foldCfg[k]
          : Object.prototype.hasOwnProperty.call(foldDefaults, k)
            ? foldDefaults[k]
            : true
      );
    const sectionHeader = (k, title) => {
      const folded = isFolded(k);
      const icon = folded ? "▸" : "▾";
      return `
        <div class="sidebar__sectionTitleRow">
          <div class="sidebar__sectionTitle">${title}</div>
          <button class="btn btn--small btn--ghost" data-fc-fold="${k}">${icon}</button>
        </div>
      `;
    };

    const dailyRows = [];
    const exchangeRows = [];
    const autoRows = [];
    const craftRows = [];
    const boostRows = [];
    const permanentRows = [];
    const itemRows = [];

    const todayStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();
    if (!state.meta || typeof state.meta !== "object") state.meta = {};
    const claimedDailyFree = state.meta.dailyFreeFcDate === todayStr;
    const claimedDailySpin = state.meta.dailySpinDate === todayStr;

    rows.push(
      renderFutureStageHtml({
        state,
        fmt,
        claimedDailyFree,
        claimedDailySpin,
      }),
    );

    if (autoExLvl > 0) {
      exchangeRows.push(`
        <div class="row row--full">
          <div class="row__left">
            <div class="row__title">自动兑币总开关</div>
            <div class="row__desc"><input class="chk" type="checkbox" data-auto-exchange ${autoExOn ? "checked" : ""} /> 自动兑币（每 ${autoExMinText} 分钟自动把灵果、灵木兑换为未来币）</div>
          </div>
          <div class="row__right">
            <div class="badge">Lv.${autoExLvl}/${AUTO_EX_MAX_LEVEL}</div>
          </div>
        </div>
      `);
    }

    {
      const today = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })();
      if (!state.meta || typeof state.meta !== "object") state.meta = {};
      const claimed = state.meta.dailyFreeFcDate === today;
      dailyRows.push(`
        <div class="row">
          <div class="row__left">
            <div class="row__title row__titleLine">${renderResSvg("futurecoin", 20)}<span>每日免费未来币</span><span class="tag">+5 未来币</span></div>
            <div class="row__desc">每天可领 +5 未来币（本地日界）。</div>
          </div>
          <div class="row__right">
            <button class="btn btn--primary btn--small" data-fc-daily-free ${claimed ? "disabled" : ""}>${claimed ? "今日已领" : "领取 +5"}</button>
          </div>
        </div>
      `);
      const spinClaimed = state.meta.dailySpinDate === today;
      dailyRows.push(`
        <div class="row">
          <div class="row__left">
            <div class="row__title row__titleLine">${renderResSvg("shinyCharm", 20)}<span>每日幸运转盘</span><span class="tag">每日 1 次</span></div>
            <div class="row__desc">免费转一次：未来币或大灵果（加权随机，诚实表）。</div>
          </div>
          <div class="row__right">
            <button class="btn btn--primary btn--small" data-fc-daily-spin ${spinClaimed ? "disabled" : ""}>${spinClaimed ? "今日已转" : "免费转一次"}</button>
          </div>
        </div>
      `);
    }

    for (const [rid, perCoin] of Object.entries(rates)) {
      const def = defs.resources[rid];
      if (!def) continue;
      const have = state.res[rid]?.value ?? 0;
      const maxCoins = Math.max(0, Math.floor(have / perCoin));
      const can1 = have >= perCoin;
      const canMax = maxCoins >= 1;
      exchangeRows.push(`
        <div class="row">
          <div class="row__left">
            <div class="row__title row__titleLine">${renderResSvg(rid, 20)}<span>${def.name}炼金</span><span class="tag">当前 ${fmt(have)}</span></div>
            <div class="row__desc">${perCoin} ${def.name} = 1 未来币</div>
          </div>
          <div class="row__right">
            <button class="btn btn--small" data-fc="${rid}" data-fc-qty="1" ${can1 ? "" : "disabled"}>兑换 1</button>
            <button class="btn btn--primary btn--small" data-fc="${rid}" data-fc-qty="max" ${canMax ? "" : "disabled"}>全部(+${maxCoins})</button>
          </div>
        </div>
      `);
    }

    const candyPrice = 50;
    const candyQty = 1;
    const candyPrice10 = 500;
    const candyQty10 = 10;
    const canBuyCandy = (state.res.futurecoin?.value ?? 0) >= candyPrice;
    const canBuyCandy10 = (state.res.futurecoin?.value ?? 0) >= candyPrice10;
    exchangeRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("rareCandy", 20)}<span>兑换跃级糖丸</span><span class="tag">库存 ${fmt(state.res.rareCandy?.value ?? 0)}</span></div>
          <div class="row__desc">${candyPrice} 未来币 = 跃级糖丸 x${candyQty}（直接提升萌灵 1 级）</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-fc-buy="rareCandy" data-fc-price="${candyPrice}" data-fc-amount="${candyQty}" ${canBuyCandy ? "" : "disabled"}>兑换1个</button>
          <button class="btn btn--small" data-fc-buy="rareCandy" data-fc-price="${candyPrice10}" data-fc-amount="${candyQty10}" ${canBuyCandy10 ? "" : "disabled"}>兑换10个</button>
        </div>
      </div>
    `);

    const autoPrice = 100;
    const autoUnlocked = Boolean(state.unlocks?.autoResearch);
    const autoBuildPrice = 100;
    const autoBuildUnlocked = Boolean(state.unlocks?.autoBuild);
    const autoCraftPrice = 200;
    const autoCraftUnlocked = Boolean(state.unlocks?.autoCraft);
    const autoBallPrice = 200;
    const autoBallUnlocked = Boolean(state.unlocks?.autoBall);

    if (!autoBuildUnlocked) {
      const canBuyAutoBuild = (state.res.futurecoin?.value ?? 0) >= autoBuildPrice;
      autoRows.push(`
        <div class="row">
          <div class="row__left">
            <div class="row__title">自动建造</div>
            <div class="row__desc">一次性解锁：${autoBuildPrice} 未来币</div>
          </div>
          <div class="row__right">
            <button class="btn btn--primary" data-fc-buy="autoBuild" data-fc-price="${autoBuildPrice}" data-fc-amount="1" ${canBuyAutoBuild ? "" : "disabled"}>解锁</button>
          </div>
        </div>
      `);
    }

    if (!autoUnlocked) {
      const canBuyAuto = (state.res.futurecoin?.value ?? 0) >= autoPrice;
      autoRows.push(`
        <div class="row">
          <div class="row__left">
            <div class="row__title">自动科研</div>
            <div class="row__desc">一次性解锁：${autoPrice} 未来币</div>
          </div>
          <div class="row__right">
            <button class="btn btn--primary" data-fc-buy="autoResearch" data-fc-price="${autoPrice}" data-fc-amount="1" ${canBuyAuto ? "" : "disabled"}>解锁</button>
          </div>
        </div>
      `);
    }

    if (!autoCraftUnlocked) {
      const canBuyAutoCraft = (state.res.futurecoin?.value ?? 0) >= autoCraftPrice;
      autoRows.push(`
        <div class="row">
          <div class="row__left">
            <div class="row__title">自动合成</div>
            <div class="row__desc">一次性解锁：${autoCraftPrice} 未来币</div>
          </div>
          <div class="row__right">
            <button class="btn btn--primary" data-fc-buy="autoCraft" data-fc-price="${autoCraftPrice}" data-fc-amount="1" ${canBuyAutoCraft ? "" : "disabled"}>解锁</button>
          </div>
        </div>
      `);
    }

    if (!autoBallUnlocked) {
      const canBuyAutoBall = (state.res.futurecoin?.value ?? 0) >= autoBallPrice;
      autoRows.push(`
        <div class="row">
          <div class="row__left">
            <div class="row__title">自动搓球</div>
            <div class="row__desc">一次性解锁：${autoBallPrice} 未来币</div>
          </div>
          <div class="row__right">
            <button class="btn btn--primary" data-fc-buy="autoBall" data-fc-price="${autoBallPrice}" data-fc-amount="1" ${canBuyAutoBall ? "" : "disabled"}>解锁</button>
          </div>
        </div>
      `);
    }

    const autoExPrice = 1000;
    const canUpAutoEx = (state.res.futurecoin?.value ?? 0) >= autoExPrice;
    const autoExMaxed = autoExLvl >= AUTO_EX_MAX_LEVEL;
    autoRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title">自动兑币</div>
          <div class="row__desc">等级：Lv.${autoExLvl}（上限${AUTO_EX_MAX_LEVEL}）· 每级消耗 ${autoExPrice} 未来币</div>
          <div class="row__desc">效果：每（100/等级）分钟自动把灵果、灵木全部兑换未来币${autoExLvl > 0 ? `（当前约每 ${autoExMinText} 分钟）` : ""}</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary" data-fc-autoex-up="1" data-fc-price="${autoExPrice}" ${canUpAutoEx && !autoExMaxed ? "" : "disabled"}>升级</button>
        </div>
      </div>
    `);

    const expBoostRem = typeof state.expBoostRemainingSec === "number" && Number.isFinite(state.expBoostRemainingSec) ? state.expBoostRemainingSec : 0;
    const expBoostPrice1 = 10;
    const expBoostPrice10 = 100;
    const expBoostSec1 = 3600;
    const expBoostSec10 = 36000;
    const canBuyBoost1 = (state.res.futurecoin?.value ?? 0) >= expBoostPrice1;
    const canBuyBoost10 = (state.res.futurecoin?.value ?? 0) >= expBoostPrice10;
    boostRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title">经验加成（全局双倍，限时）</div>
          <div class="row__desc">价格：${expBoostPrice1} 未来币/1小时 · ${expBoostPrice10} 未来币/10小时</div>
          <div class="row__desc">生效期：所有萌灵获得双倍经验。可叠加累积时长。</div>
          <div class="row__desc">剩余时间：${expBoostRem > 0 ? fmtRemain(expBoostRem) : "无"}</div>
        </div>
        <div class="row__right">
          <button class="btn btn--small" data-fc-boost="exp2" data-fc-price="${expBoostPrice1}" data-fc-sec="${expBoostSec1}" ${canBuyBoost1 ? "" : "disabled"}>兑换一小时（${expBoostPrice1}币）</button>
          <button class="btn btn--primary" data-fc-boost="exp2" data-fc-price="${expBoostPrice10}" data-fc-sec="${expBoostSec10}" ${canBuyBoost10 ? "" : "disabled"}>兑换十小时（${expBoostPrice10}币）</button>
        </div>
      </div>
    `);

    // 捕获率加成
    const captureBoostRem = typeof state.captureBoostRemainingSec === "number" && Number.isFinite(state.captureBoostRemainingSec) ? state.captureBoostRemainingSec : 0;
    const captureBoostPrice1 = 15;
    const captureBoostPrice10 = 150;
    const captureBoostSec1 = 3600;
    const captureBoostSec10 = 36000;
    const canBuyCaptureBoost1 = (state.res.futurecoin?.value ?? 0) >= captureBoostPrice1;
    const canBuyCaptureBoost10 = (state.res.futurecoin?.value ?? 0) >= captureBoostPrice10;
    boostRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title">捕获率提升（限时）</div>
          <div class="row__desc">价格：${captureBoostPrice1} 未来币/1小时 · ${captureBoostPrice10} 未来币/10小时</div>
          <div class="row__desc">生效期：捕获率 +20%。可叠加累积时长。</div>
          <div class="row__desc">剩余时间：${captureBoostRem > 0 ? fmtRemain(captureBoostRem) : "无"}</div>
        </div>
        <div class="row__right">
          <button class="btn btn--small" data-fc-boost="capture" data-fc-price="${captureBoostPrice1}" data-fc-sec="${captureBoostSec1}" ${canBuyCaptureBoost1 ? "" : "disabled"}>兑换一小时（${captureBoostPrice1}币）</button>
          <button class="btn btn--primary" data-fc-boost="capture" data-fc-price="${captureBoostPrice10}" data-fc-sec="${captureBoostSec10}" ${canBuyCaptureBoost10 ? "" : "disabled"}>兑换十小时（${captureBoostPrice10}币）</button>
        </div>
      </div>
    `);

    // 资源产量加成
    const prodBoostRem = typeof state.prodBoostRemainingSec === "number" && Number.isFinite(state.prodBoostRemainingSec) ? state.prodBoostRemainingSec : 0;
    const prodBoostPrice1 = 20;
    const prodBoostPrice10 = 200;
    const prodBoostSec1 = 3600;
    const prodBoostSec10 = 36000;
    const canBuyProdBoost1 = (state.res.futurecoin?.value ?? 0) >= prodBoostPrice1;
    const canBuyProdBoost10 = (state.res.futurecoin?.value ?? 0) >= prodBoostPrice10;
    boostRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title">资源产量加成（限时）</div>
          <div class="row__desc">价格：${prodBoostPrice1} 未来币/1小时 · ${prodBoostPrice10} 未来币/10小时</div>
          <div class="row__desc">生效期：所有资源产量 +50%。可叠加累积时长。</div>
          <div class="row__desc">剩余时间：${prodBoostRem > 0 ? fmtRemain(prodBoostRem) : "无"}</div>
        </div>
        <div class="row__right">
          <button class="btn btn--small" data-fc-boost="production" data-fc-price="${prodBoostPrice1}" data-fc-sec="${prodBoostSec1}" ${canBuyProdBoost1 ? "" : "disabled"}>兑换一小时（${prodBoostPrice1}币）</button>
          <button class="btn btn--primary" data-fc-boost="production" data-fc-price="${prodBoostPrice10}" data-fc-sec="${prodBoostSec10}" ${canBuyProdBoost10 ? "" : "disabled"}>兑换十小时（${prodBoostPrice10}币）</button>
        </div>
      </div>
    `);

    // 特殊道具
    const masterballPrice = 2000;
    const canBuyMasterball = (state.res.futurecoin?.value ?? 0) >= masterballPrice;
    itemRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("masterball", 20)}<span>究极灵球</span><span class="tag">库存 ${fmt(state.res.masterball?.value ?? 0)}</span></div>
          <div class="row__desc">价格：${masterballPrice} 未来币/个 · 100% 捕获任何萌灵</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-fc-buy="masterball" data-fc-price="${masterballPrice}" data-fc-amount="1" ${canBuyMasterball ? "" : "disabled"}>购买1个</button>
        </div>
      </div>
    `);

    // 特殊灵球
    const ultraballPrice = 150;
    const canBuyUltraball = (state.res.futurecoin?.value ?? 0) >= ultraballPrice;
    itemRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("ultraball", 20)}<span>高级灵球</span><span class="tag">库存 ${fmt(state.res.ultraball?.value ?? 0)}</span></div>
          <div class="row__desc">价格：${ultraballPrice} 未来币/10个 · 捕获率 x2</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-fc-buy="ultraball" data-fc-price="${ultraballPrice}" data-fc-amount="10" ${canBuyUltraball ? "" : "disabled"}>购买10个</button>
        </div>
      </div>
    `);

    // 经验道具
    const expCandyPrice = 100;
    const canBuyExpCandy = (state.res.futurecoin?.value ?? 0) >= expCandyPrice;
    itemRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("expCandy", 20)}<span>历练糖丸</span><span class="tag">库存 ${fmt(state.res.expCandy?.value ?? 0)}</span></div>
          <div class="row__desc">价格：${expCandyPrice} 未来币/10个 · 萌灵获得 1000 经验值</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-fc-buy="expCandy" data-fc-price="${expCandyPrice}" data-fc-amount="10" ${canBuyExpCandy ? "" : "disabled"}>购买10个</button>
        </div>
      </div>
    `);

    // 亲密度道具
    const affectionTreatPrice = 200;
    const canBuyAffectionTreat = (state.res.futurecoin?.value ?? 0) >= affectionTreatPrice;
    itemRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("affectionTreat", 20)}<span>亲密点心</span><span class="tag">库存 ${fmt(state.res.affectionTreat?.value ?? 0)}</span></div>
          <div class="row__desc">价格：${affectionTreatPrice} 未来币/10个 · 萌灵亲密度 +5</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-fc-buy="affectionTreat" data-fc-price="${affectionTreatPrice}" data-fc-amount="10" ${canBuyAffectionTreat ? "" : "disabled"}>购买10个</button>
        </div>
      </div>
    `);

    const friendshipBraceletPrice = 800;
    const canBuyFriendshipBracelet = (state.res.futurecoin?.value ?? 0) >= friendshipBraceletPrice;
    itemRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("friendshipBracelet", 20)}<span>友谊手环</span><span class="tag">库存 ${fmt(state.res.friendshipBracelet?.value ?? 0)}</span></div>
          <div class="row__desc">价格：${friendshipBraceletPrice} 未来币/个 · 亲密度直接提升至 100</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-fc-buy="friendshipBracelet" data-fc-price="${friendshipBraceletPrice}" data-fc-amount="1" ${canBuyFriendshipBracelet ? "" : "disabled"}>购买1个</button>
        </div>
      </div>
    `);

    // 特殊功能道具
    const shinyCharmPrice = 100000;
    const canBuyShinyCharm = (state.res.futurecoin?.value ?? 0) >= shinyCharmPrice;
    itemRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("shinyCharm", 20)}<span>虹彩护符</span><span class="tag">库存 ${fmt(state.res.shinyCharm?.value ?? 0)}</span></div>
          <div class="row__desc">价格：${shinyCharmPrice} 未来币/个 · 闪光率 x2（持续24小时）</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-fc-buy="shinyCharm" data-fc-price="${shinyCharmPrice}" data-fc-amount="1" ${canBuyShinyCharm ? "" : "disabled"}>购买1个</button>
        </div>
      </div>
    `);

    const luckyEggPrice = 1500;
    const canBuyLuckyEgg = (state.res.futurecoin?.value ?? 0) >= luckyEggPrice;
    itemRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("luckyEgg", 20)}<span>福缘蛋</span><span class="tag">库存 ${fmt(state.res.luckyEgg?.value ?? 0)}</span></div>
          <div class="row__desc">价格：${luckyEggPrice} 未来币/个 · 指定萌灵 1小时经验 x1.5</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-fc-buy="luckyEgg" data-fc-price="${luckyEggPrice}" data-fc-amount="1" ${canBuyLuckyEgg ? "" : "disabled"}>购买1个</button>
        </div>
      </div>
    `);

    const bottleCapPrice = 1000;
    const canBuyBottleCap = (state.res.futurecoin?.value ?? 0) >= bottleCapPrice;
    itemRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("bottleCap", 20)}<span>银桂冠</span><span class="tag">库存 ${fmt(state.res.bottleCap?.value ?? 0)}</span></div>
          <div class="row__desc">价格：${bottleCapPrice} 未来币/个 · 单项个体值提升至 31</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-fc-buy="bottleCap" data-fc-price="${bottleCapPrice}" data-fc-amount="1" ${canBuyBottleCap ? "" : "disabled"}>购买1个</button>
        </div>
      </div>
    `);

    const goldBottleCapPrice = 5000;
    const canBuyGoldBottleCap = (state.res.futurecoin?.value ?? 0) >= goldBottleCapPrice;
    itemRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("goldBottleCap", 20)}<span>金桂冠</span><span class="tag">库存 ${fmt(state.res.goldBottleCap?.value ?? 0)}</span></div>
          <div class="row__desc">价格：${goldBottleCapPrice} 未来币/个 · 所有个体值提升至 31（6V）</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-fc-buy="goldBottleCap" data-fc-price="${goldBottleCapPrice}" data-fc-amount="1" ${canBuyGoldBottleCap ? "" : "disabled"}>购买1个</button>
        </div>
      </div>
    `);

    // 永久增益
    const MAX_PERM_LEVEL = 10;
    const permExpLvl = typeof state.permanentBoosts?.exp === "number" ? Math.max(0, Math.min(MAX_PERM_LEVEL, Math.floor(state.permanentBoosts.exp))) : 0;
    const permExpPrice = 500;
    const canUpPermExp = (state.res.futurecoin?.value ?? 0) >= permExpPrice && permExpLvl < MAX_PERM_LEVEL;
    permanentRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title">永久经验加成</div>
          <div class="row__desc">等级：Lv.${permExpLvl}/${MAX_PERM_LEVEL} · 每级消耗 ${permExpPrice} 未来币</div>
          <div class="row__desc">效果：所有萌灵获得经验 +${permExpLvl * 10}%（每级 +10%）</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary" data-fc-perm="exp" data-fc-price="${permExpPrice}" ${canUpPermExp ? "" : "disabled"}>${permExpLvl >= MAX_PERM_LEVEL ? "已满级" : "升级"}</button>
        </div>
      </div>
    `);

    const permCaptureLvl = typeof state.permanentBoosts?.capture === "number" ? Math.max(0, Math.min(MAX_PERM_LEVEL, Math.floor(state.permanentBoosts.capture))) : 0;
    const permCapturePrice = 600;
    const canUpPermCapture = (state.res.futurecoin?.value ?? 0) >= permCapturePrice && permCaptureLvl < MAX_PERM_LEVEL;
    permanentRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title">永久捕获加成</div>
          <div class="row__desc">等级：Lv.${permCaptureLvl}/${MAX_PERM_LEVEL} · 每级消耗 ${permCapturePrice} 未来币</div>
          <div class="row__desc">效果：捕获率 +${permCaptureLvl * 5}%（每级 +5%）</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary" data-fc-perm="capture" data-fc-price="${permCapturePrice}" ${canUpPermCapture ? "" : "disabled"}>${permCaptureLvl >= MAX_PERM_LEVEL ? "已满级" : "升级"}</button>
        </div>
      </div>
    `);

    const permProdLvl = typeof state.permanentBoosts?.production === "number" ? Math.max(0, Math.min(MAX_PERM_LEVEL, Math.floor(state.permanentBoosts.production))) : 0;
    const permProdPrice = 700;
    const canUpPermProd = (state.res.futurecoin?.value ?? 0) >= permProdPrice && permProdLvl < MAX_PERM_LEVEL;
    permanentRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title">永久资源产量加成</div>
          <div class="row__desc">等级：Lv.${permProdLvl}/${MAX_PERM_LEVEL} · 每级消耗 ${permProdPrice} 未来币</div>
          <div class="row__desc">效果：所有资源产量 +${permProdLvl * 10}%（每级 +10%）</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary" data-fc-perm="production" data-fc-price="${permProdPrice}" ${canUpPermProd ? "" : "disabled"}>${permProdLvl >= MAX_PERM_LEVEL ? "已满级" : "升级"}</button>
        </div>
      </div>
    `);

    const permCapLvl = typeof state.permanentBoosts?.capacity === "number" ? Math.max(0, Math.min(MAX_PERM_LEVEL, Math.floor(state.permanentBoosts.capacity))) : 0;
    const permCapPrice = 800;
    const canUpPermCap = (state.res.futurecoin?.value ?? 0) >= permCapPrice && permCapLvl < MAX_PERM_LEVEL;
    permanentRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title">永久资源上限加成</div>
          <div class="row__desc">等级：Lv.${permCapLvl}/${MAX_PERM_LEVEL} · 每级消耗 ${permCapPrice} 未来币</div>
          <div class="row__desc">效果：所有资源上限 +${permCapLvl * 10}%（每级 +10%）</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary" data-fc-perm="capacity" data-fc-price="${permCapPrice}" ${canUpPermCap ? "" : "disabled"}>${permCapLvl >= MAX_PERM_LEVEL ? "已满级" : "升级"}</button>
        </div>
      </div>
    `);


    const permEncPlusLvl = typeof state.permanentBoosts?.encPlusMax === "number" ? Math.max(0, Math.min(20, Math.floor(state.permanentBoosts.encPlusMax))) : 0;
    const permEncPlusPrice = 1000;
    const canUpPermEncPlus = (state.res.futurecoin?.value ?? 0) >= permEncPlusPrice && permEncPlusLvl < 20;
    permanentRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title">永久高级搜索上限</div>
          <div class="row__desc">等级：Lv.${permEncPlusLvl}/20 · 每级消耗 ${permEncPlusPrice} 未来币</div>
          <div class="row__desc">效果：高级遭遇次数上限 +1（当前上限 ${10 + permEncPlusLvl} 次）</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary" data-fc-perm="encPlusMax" data-fc-price="${permEncPlusPrice}" ${canUpPermEncPlus ? "" : "disabled"}>${permEncPlusLvl >= 20 ? "已满级" : "升级"}</button>
        </div>
      </div>
    `);

    // 合成灵晶石
    const bigBerryCost = 50;
    const canCraftBigBerry = (state.res.catnip?.value ?? 0) >= bigBerryCost;
    craftRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("bigBerry", 20)}<span>制作大灵果</span><span class="tag">持有 ${fmt(state.res.bigBerry?.value ?? 0)}</span></div>
          <div class="row__desc">消耗：灵果 x${bigBerryCost}（当前 ${fmt(state.res.catnip?.value ?? 0)}）→ 立即获得大灵果 x1</div>
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-craft="bigBerry" ${canCraftBigBerry ? "" : "disabled"}>制作</button>
        </div>
      </div>
    `);

    // 直接合成灵晶石（已移除套娃中间货币灵源）
    const madeStone0 =
      typeof state.evolutionStoneMade === "number" && Number.isFinite(state.evolutionStoneMade)
        ? Math.max(0, Math.floor(state.evolutionStoneMade))
        : 0;
    const stoneCost = Math.min(5000, 300 + madeStone0 * 10);
    const stoneTime = 600; // 10分钟
    const hasMinerals = (state.res.minerals?.value ?? 0) >= stoneCost;
    const craftObj = state.crafting && typeof state.crafting === "object" ? state.crafting : null;
    const stoneTask =
      craftObj && craftObj.evolutionEnergy && typeof craftObj.evolutionEnergy === "object"
        ? craftObj.evolutionEnergy
        : craftObj && craftObj.evolutionStone && typeof craftObj.evolutionStone === "object"
          ? craftObj.evolutionStone
          : null;
    const isCrafting = Boolean(stoneTask && typeof stoneTask.remainingSec === "number" && stoneTask.remainingSec > 0);
    const remainingSec = isCrafting ? stoneTask.remainingSec : 0;
    const totalSec = isCrafting && typeof stoneTask.totalSec === "number" && stoneTask.totalSec > 0 ? stoneTask.totalSec : stoneTime;
    const canStart = hasMinerals && !isCrafting;
    const progress = isCrafting ? Math.max(0, Math.min(100, ((totalSec - remainingSec) / totalSec) * 100)) : 0;
    const timeText = remainingSec > 0 ? `${Math.ceil(remainingSec)}秒` : "完成";
    const stoneBlockedText = !hasMinerals ? "灵晶不足" : isCrafting ? "合成中" : "";
    const stoneBtnText = isCrafting ? "合成中..." : stoneBlockedText ? stoneBlockedText : "开始合成";
    const autoCraftOn = Boolean(state.unlocks?.autoCraft);
    const autoCraftCfg = state.auto?.autoCraft && typeof state.auto.autoCraft === "object" ? state.auto.autoCraft : {};
    const autoCraftEnergy = Boolean(autoCraftCfg.evolutionEnergy || autoCraftCfg.evolutionStone);
    
    craftRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("evolutionStone", 20)}<span>合成灵晶石</span><span class="tag">持有 ${fmt(state.res.evolutionStone?.value ?? 0)}</span></div>
          ${autoCraftOn ? `<div class="row__desc"><input class="chk" type="checkbox" data-auto-craft="evolutionEnergy" ${autoCraftEnergy ? "checked" : ""} /> 自动合成</div>` : ""}
          <div class="row__desc">消耗：灵晶碎片 x${stoneCost}（当前 ${fmt(state.res.minerals?.value ?? 0)}）· 耗时 10 分钟</div>
          ${isCrafting ? `<div class="row__desc" style="margin-top: 4px;">进度：${Math.round(progress)}% · 剩余：${timeText}</div>` : ""}
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-craft="evolutionStone" ${canStart ? "" : "disabled"}>${stoneBtnText}</button>
        </div>
      </div>
    `);

    // 合成灵契绳
    const ropeCostStone = 3;
    const ropeTime = 900; // 15分钟
    const hasStone = (state.res.evolutionStone?.value ?? 0) >= ropeCostStone;
    const ropeTask = craftObj && craftObj.linkRope && typeof craftObj.linkRope === "object" ? craftObj.linkRope : null;
    const isRopeCrafting = Boolean(ropeTask && typeof ropeTask.remainingSec === "number" && ropeTask.remainingSec > 0);
    const ropeRemainingSec = isRopeCrafting ? ropeTask.remainingSec : 0;
    const ropeTotalSec = isRopeCrafting && typeof ropeTask.totalSec === "number" && ropeTask.totalSec > 0 ? ropeTask.totalSec : ropeTime;
    const ropeCanStart = hasStone && !isRopeCrafting;
    const ropeProgress = isRopeCrafting ? Math.max(0, Math.min(100, ((ropeTotalSec - ropeRemainingSec) / ropeTotalSec) * 100)) : 0;
    const ropeTimeText = ropeRemainingSec > 0 ? `${Math.ceil(ropeRemainingSec)}秒` : "完成";
    const ropeBlockedText = !hasStone ? "灵晶石不足" : isRopeCrafting ? "合成中" : "";
    const ropeBtnText = isRopeCrafting ? "合成中..." : ropeBlockedText ? ropeBlockedText : "开始合成";
    const autoCraftRope = Boolean(autoCraftCfg.linkRope);

    craftRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("linkRope", 20)}<span>合成灵契绳</span><span class="tag">持有 ${fmt(state.res.linkRope?.value ?? 0)}</span></div>
          ${autoCraftOn ? `<div class="row__desc"><input class="chk" type="checkbox" data-auto-craft="linkRope" ${autoCraftRope ? "checked" : ""} /> 自动合成</div>` : ""}
          <div class="row__desc">消耗：灵晶石 x${ropeCostStone}（当前 ${fmt(state.res.evolutionStone?.value ?? 0)}）· 耗时 15 分钟</div>
          ${isRopeCrafting ? `<div class="row__desc" style="margin-top: 4px;">进度：${Math.round(ropeProgress)}% · 剩余：${ropeTimeText}</div>` : ""}
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-craft="linkRope" ${ropeCanStart ? "" : "disabled"}>${ropeBtnText}</button>
        </div>
      </div>
    `);

    // 合成觉醒石
    const megaCostStone = 10;
    const megaTime = 1200; // 20分钟
    const megaHaveStone = (state.res.evolutionStone?.value ?? 0) >= megaCostStone;
    const megaTask = craftObj && craftObj.megaStone && typeof craftObj.megaStone === "object" ? craftObj.megaStone : null;
    const isMegaCrafting = Boolean(megaTask && typeof megaTask.remainingSec === "number" && megaTask.remainingSec > 0);
    const megaRemainingSec = isMegaCrafting ? megaTask.remainingSec : 0;
    const megaTotalSec = isMegaCrafting && typeof megaTask.totalSec === "number" && megaTask.totalSec > 0 ? megaTask.totalSec : megaTime;
    const megaProgress = isMegaCrafting ? Math.max(0, Math.min(100, ((megaTotalSec - megaRemainingSec) / megaTotalSec) * 100)) : 0;
    const megaTimeText = megaRemainingSec > 0 ? fmtRemain(megaRemainingSec) : "完成";
    const megaCanStart = megaHaveStone && !isMegaCrafting;
    const megaBlockedText = !megaHaveStone ? "灵晶石不足" : isMegaCrafting ? "合成中" : "";
    const megaBtnText = isMegaCrafting ? "合成中..." : megaBlockedText ? megaBlockedText : "开始合成";
    const autoCraftMega = Boolean(autoCraftCfg.megaStone);

    craftRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("megaStone", 20)}<span>合成觉醒石</span><span class="tag">持有 ${fmt(state.res.megaStone?.value ?? 0)}</span></div>
          ${autoCraftOn ? `<div class="row__desc"><input class="chk" type="checkbox" data-auto-craft="megaStone" ${autoCraftMega ? "checked" : ""} /> 自动合成</div>` : ""}
          <div class="row__desc">消耗：灵晶石 x${megaCostStone}（当前 ${fmt(state.res.evolutionStone?.value ?? 0)}）· 耗时 20 分钟</div>
          ${isMegaCrafting ? `<div class="row__desc" style="margin-top: 4px;">进度：${Math.round(megaProgress)}% · 剩余：${megaTimeText}</div>` : ""}
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-craft="megaStone" ${megaCanStart ? "" : "disabled"}>${megaBtnText}</button>
        </div>
      </div>
    `);

    // 合成巨大灵果
    const hugeCostCatnip = 5000;
    const hugeCostBig = 30;
    const hugeTime = 900;
    const haveCatnip = (state.res.catnip?.value ?? 0) >= hugeCostCatnip;
    const haveBig = (state.res.bigBerry?.value ?? 0) >= hugeCostBig;
    const hugeTask = craftObj && craftObj.hugeBerry && typeof craftObj.hugeBerry === "object" ? craftObj.hugeBerry : null;
    const isHugeCrafting = Boolean(hugeTask && typeof hugeTask.remainingSec === "number" && hugeTask.remainingSec > 0);
    const hugeRemainingSec = isHugeCrafting ? hugeTask.remainingSec : 0;
    const hugeTotalSec = isHugeCrafting && typeof hugeTask.totalSec === "number" && hugeTask.totalSec > 0 ? hugeTask.totalSec : hugeTime;
    const hugeProgress = isHugeCrafting ? Math.max(0, Math.min(100, ((hugeTotalSec - hugeRemainingSec) / hugeTotalSec) * 100)) : 0;
    const hugeTimeText = hugeRemainingSec > 0 ? fmtRemain(hugeRemainingSec) : "完成";
    const hugeCanStart = haveCatnip && haveBig && !isHugeCrafting;
    const hugeBlockedText = !haveCatnip ? "灵果不足" : !haveBig ? "大灵果不足" : isHugeCrafting ? "合成中" : "";
    const hugeBtnText = isHugeCrafting ? "合成中..." : hugeBlockedText ? hugeBlockedText : "开始合成";
    const autoCraftHuge = Boolean(autoCraftCfg.hugeBerry);

    craftRows.push(`
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("hugeBerry", 20)}<span>合成巨大灵果</span><span class="tag">持有 ${fmt(state.res.hugeBerry?.value ?? 0)}</span></div>
          ${autoCraftOn ? `<div class="row__desc"><input class="chk" type="checkbox" data-auto-craft="hugeBerry" ${autoCraftHuge ? "checked" : ""} /> 自动合成</div>` : ""}
          <div class="row__desc">消耗：灵果 x${hugeCostCatnip}（${fmt(state.res.catnip?.value ?? 0)}）+ 大灵果 x${hugeCostBig}（${fmt(state.res.bigBerry?.value ?? 0)}）· 耗时 15 分钟</div>
          ${isHugeCrafting ? `<div class="row__desc" style="margin-top: 4px;">进度：${Math.round(hugeProgress)}% · 剩余：${hugeTimeText}</div>` : ""}
        </div>
        <div class="row__right">
          <button class="btn btn--primary btn--small" data-craft="hugeBerry" ${hugeCanStart ? "" : "disabled"}>${hugeBtnText}</button>
        </div>
      </div>
    `);

    rows.push(sectionHeader("daily", "每日福利"));
    if (!isFolded("daily")) rows.push(...dailyRows);

    if (state.era?.prestigeUnlocked) {
      rows.push(sectionHeader("rebirth", "转生轮回"));
      if (!isFolded("rebirth")) {
        const essence = Math.max(0, Math.floor(state.meta?.legacy?.essence || 0));
        const rebirths = Math.max(0, Math.floor(state.era?.prestigeCount || 0));
        rows.push(`
          <div class="row">
            <div class="row__left">
              <div class="row__title">灵珀 ×${essence} · 已轮回 ${rebirths} 次</div>
              <div class="row__desc">悖梦主线全清且持有闪光萌灵后，在萌灵页时代面板发起「时空歪曲」。灵珀买轮回加成，永久生效。</div>
            </div>
          </div>
        `);
        for (const pid of LEGACY_PERK_ORDER) {
          const pdef = LEGACY_PERKS[pid];
          const lvl = perkLevel(state, pid);
          const maxed = lvl >= pdef.max;
          const cost = perkCost(pid, lvl);
          const canBuy = canBuyPerk(state, pid);
          rows.push(`
            <div class="row">
              <div class="row__left">
                <div class="row__title">${pdef.name} <span class="badge">${lvl}/${pdef.max}</span></div>
                <div class="row__desc">${pdef.desc}</div>
              </div>
              <div class="row__right">
                ${maxed ? `<span class="badge">已满</span>` : `<button class="btn btn--primary" data-legacy-perk="${pid}" ${canBuy ? "" : "disabled"}>${cost} 灵珀</button>`}
              </div>
            </div>
          `);
        }
      }
    }

    rows.push(sectionHeader("exchange", "兑换"));
    if (!isFolded("exchange")) rows.push(...exchangeRows);

    rows.push(sectionHeader("boost", "限时增益"));
    if (!isFolded("boost")) rows.push(...boostRows);

    rows.push(sectionHeader("permanent", "永久"));
    if (!isFolded("permanent")) rows.push(...permanentRows);

    rows.push(sectionHeader("item", "道具"));
    if (!isFolded("item")) rows.push(...itemRows);

    rows.push(sectionHeader("auto", "自动"));
    if (!isFolded("auto")) rows.push(...autoRows);

    rows.push(sectionHeader("craft", "合成"));
    if (!isFolded("craft")) rows.push(...craftRows);

    setHtmlPreservingStage(elFutureShop, rows.join(""));
    ui.futureDirty = false;
  };
}
