import { canClaimDailySpin, localDateStr, markDailySpinClaimed, rollDailySpin } from "../systems/gameplay_fun.js";
import { buyPerk, LEGACY_PERKS } from "../systems/rebirth.js";

export function initFutureTab({ elFutureShop, ui, defs, getState, addRes, addLog, render }) {
  if (!elFutureShop) return;

  const FUTURE_SHOP_FOLD_KEY = "mengling_idle_future_shop_fold_v1";
  if (!ui.futureShopFold || typeof ui.futureShopFold !== "object") {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(FUTURE_SHOP_FOLD_KEY) || "null");
    } catch (e) {
      saved = null;
    }
    const foldDefault = (k, folded) =>
      Boolean(saved && typeof saved === "object" && Object.prototype.hasOwnProperty.call(saved, k) ? saved[k] : folded);
    ui.futureShopFold = {
      daily: foldDefault("daily", false),
      exchange: foldDefault("exchange", false),
      boost: foldDefault("boost", true),
      permanent: foldDefault("permanent", true),
      item: foldDefault("item", true),
      rebirth: foldDefault("rebirth", false),
      auto: foldDefault("auto", true),
      craft: foldDefault("craft", true),
    };
  }

  elFutureShop.addEventListener("click", (ev) => {
    const dailyFreeBtn = ev.target?.closest?.("button[data-fc-daily-free]");
    if (dailyFreeBtn && elFutureShop.contains(dailyFreeBtn)) {
      if (dailyFreeBtn.disabled) return;
      const state = getState();
      const today = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })();
      if (!state.meta || typeof state.meta !== "object") state.meta = {};
      if (state.meta.dailyFreeFcDate === today) {
        addLog("今日免费未来币已领取");
        return;
      }
      state.meta.dailyFreeFcDate = today;
      addRes("futurecoin", 5);
      addLog("领取每日免费未来币 +5", true);
      ui.futureDirty = true;
      render();
      return;
    }

    const spinBtn = ev.target?.closest?.("button[data-fc-daily-spin]");
    if (spinBtn && elFutureShop.contains(spinBtn)) {
      if (spinBtn.disabled) return;
      const state = getState();
      const today = localDateStr();
      if (!state.meta || typeof state.meta !== "object") state.meta = {};
      if (!canClaimDailySpin(state.meta, today)) {
        addLog("今日幸运转盘已转过");
        return;
      }
      const hit = rollDailySpin();
      markDailySpinClaimed(state.meta, today);
      if (hit.futurecoin > 0) addRes("futurecoin", hit.futurecoin);
      if (hit.bigBerry > 0) addRes("bigBerry", hit.bigBerry);
      addLog(`幸运转盘：${hit.label}`, true);
      ui.futureDirty = true;
      render();
      return;
    }

    const legacyBtn = ev.target?.closest?.("button[data-legacy-perk]");
    if (legacyBtn && elFutureShop.contains(legacyBtn)) {
      if (legacyBtn.disabled) return;
      const state = getState();
      const result = buyPerk(state, legacyBtn.getAttribute("data-legacy-perk"));
      if (result.ok) {
        addLog(`轮回加成升级：${LEGACY_PERKS[legacyBtn.getAttribute("data-legacy-perk")]?.name || ""} Lv.${result.level}（灵珀 -${result.cost}）`, true);
        ui.futureDirty = true;
        render();
      }
      return;
    }

    const foldBtn = ev.target?.closest?.("button[data-fc-fold]");
    if (foldBtn && elFutureShop.contains(foldBtn)) {
      const k = foldBtn.getAttribute("data-fc-fold");
      if (!k) return;
      if (!ui.futureShopFold || typeof ui.futureShopFold !== "object") {
        ui.futureShopFold = { daily: false, exchange: false, boost: true, permanent: true, item: true, auto: true, craft: true };
      }
      if (!Object.prototype.hasOwnProperty.call(ui.futureShopFold, k)) return;
      ui.futureShopFold[k] = !ui.futureShopFold[k];
      try {
        localStorage.setItem(FUTURE_SHOP_FOLD_KEY, JSON.stringify(ui.futureShopFold));
      } catch (e) {
        // ignore
      }
      ui.futureDirty = true;
      render();
      return;
    }

    const boostBtn = ev.target?.closest?.("button[data-fc-boost]");
    if (boostBtn && elFutureShop.contains(boostBtn)) {
      if (boostBtn.disabled) return;
      const kind = boostBtn.getAttribute("data-fc-boost");
      const price = Math.max(0, Math.floor(Number(boostBtn.getAttribute("data-fc-price") || "0")));
      const sec = Math.max(0, Math.floor(Number(boostBtn.getAttribute("data-fc-sec") || "0")));
      if (!kind || price <= 0 || sec <= 0) return;

      const state = getState();
      if ((state.res.futurecoin?.value ?? 0) < price) return;

      state.res.futurecoin.value = Math.max(0, (state.res.futurecoin?.value ?? 0) - price);

      if (kind === "exp2") {
        const cur =
          typeof state.expBoostRemainingSec === "number" && Number.isFinite(state.expBoostRemainingSec) ? state.expBoostRemainingSec : 0;
        state.expBoostRemainingSec = Math.max(0, cur + sec);
        addLog(`兑换：未来币 -${price} → 双倍经验 +${Math.round(sec / 3600)}小时`, true);
      } else if (kind === "capture") {
        const cur =
          typeof state.captureBoostRemainingSec === "number" && Number.isFinite(state.captureBoostRemainingSec) ? state.captureBoostRemainingSec : 0;
        state.captureBoostRemainingSec = Math.max(0, cur + sec);
        addLog(`兑换：未来币 -${price} → 捕获率提升 +${Math.round(sec / 3600)}小时`, true);
      } else if (kind === "production") {
        const cur =
          typeof state.prodBoostRemainingSec === "number" && Number.isFinite(state.prodBoostRemainingSec) ? state.prodBoostRemainingSec : 0;
        state.prodBoostRemainingSec = Math.max(0, cur + sec);
        addLog(`兑换：未来币 -${price} → 资源产量加成 +${Math.round(sec / 3600)}小时`, true);
      }

      ui.futureDirty = true;
      render();
      return;
    }

    // 永久增益
    const permBtn = ev.target?.closest?.("button[data-fc-perm]");
    if (permBtn && elFutureShop.contains(permBtn)) {
      if (permBtn.disabled) return;
      const kind = permBtn.getAttribute("data-fc-perm");
      const price = Math.max(0, Math.floor(Number(permBtn.getAttribute("data-fc-price") || "0")));
      if (!kind || price <= 0) return;

      const state = getState();
      if ((state.res.futurecoin?.value ?? 0) < price) return;

      if (!state.permanentBoosts || typeof state.permanentBoosts !== "object") {
        state.permanentBoosts = { exp: 0, capture: 0, production: 0, capacity: 0, encPlusMax: 0 };
      }
      if (typeof state.permanentBoosts.encPlusMax !== "number") state.permanentBoosts.encPlusMax = 0;

      const MAX_PERM_LEVELS = { exp: 10, capture: 10, production: 10, capacity: 10, encPlusMax: 20 };
      const MAX_PERM_LEVEL = MAX_PERM_LEVELS[kind] ?? 10;
      const currentLvl = typeof state.permanentBoosts[kind] === "number" ? Math.max(0, Math.min(MAX_PERM_LEVEL, Math.floor(state.permanentBoosts[kind]))) : 0;
      if (currentLvl >= MAX_PERM_LEVEL) return;

      state.res.futurecoin.value = Math.max(0, (state.res.futurecoin?.value ?? 0) - price);
      state.permanentBoosts[kind] = currentLvl + 1;

      const names = {
        exp: "永久经验加成",
        capture: "永久捕获加成",
        production: "永久资源产量加成",
        capacity: "永久资源上限加成",
        encPlusMax: "永久高级搜索上限",
      };
      addLog(`升级：${names[kind]} Lv.${currentLvl + 1}（未来币 -${price}）`, true);

      ui.futureDirty = true;
      render();
      return;
    }

    const buyBtn = ev.target?.closest?.("button[data-fc-buy]");
    if (buyBtn && elFutureShop.contains(buyBtn)) {
      if (buyBtn.disabled) return;
      const kind = buyBtn.getAttribute("data-fc-buy");
      const price = Math.max(0, Math.floor(Number(buyBtn.getAttribute("data-fc-price") || "0")));
      const amount = Math.max(0, Math.floor(Number(buyBtn.getAttribute("data-fc-amount") || "0")));
      if (!kind || price <= 0 || amount <= 0) return;

      const state = getState();
      if ((state.res.futurecoin?.value ?? 0) < price) return;
      if (kind === "autoResearch" && state.unlocks?.autoResearch) return;
      if (kind === "autoBuild" && state.unlocks?.autoBuild) return;
      if (kind === "autoBall" && state.unlocks?.autoBall) return;
      if (kind === "autoCraft" && state.unlocks?.autoCraft) return;

      state.res.futurecoin.value = Math.max(0, (state.res.futurecoin?.value ?? 0) - price);
      if (kind === "rareCandy") {
        addRes("rareCandy", amount);
        addLog(`兑换：未来币 -${price} → 跃级糖丸 +${amount}`);
      } else if (kind === "masterball") {
        addRes("masterball", amount);
        addLog(`购买：未来币 -${price} → 究极灵球 +${amount}`, true);
      } else if (kind === "ultraball") {
        addRes("ultraball", amount);
        addLog(`购买：未来币 -${price} → 高级灵球 +${amount}`, true);
      } else if (kind === "quickball") {
        addRes("quickball", amount);
        addLog(`购买：未来币 -${price} → 迅捷灵球 +${amount}`, true);
      } else if (kind === "luxuryball") {
        addRes("luxuryball", amount);
        addLog(`购买：未来币 -${price} → 豪华灵球 +${amount}`, true);
      } else if (kind === "expCandy") {
        addRes("expCandy", amount);
        addLog(`购买：未来币 -${price} → 历练糖丸 +${amount}`, true);
      } else if (kind === "expCandyL") {
        addRes("expCandyL", amount);
        addLog(`购买：未来币 -${price} → 历练糖丸L +${amount}`, true);
      } else if (kind === "expCandyXL") {
        addRes("expCandyXL", amount);
        addLog(`购买：未来币 -${price} → 历练糖丸XL +${amount}`, true);
      } else if (kind === "affectionTreat") {
        addRes("affectionTreat", amount);
        addLog(`购买：未来币 -${price} → 亲密点心 +${amount}`, true);
      } else if (kind === "friendshipBracelet") {
        addRes("friendshipBracelet", amount);
        addLog(`购买：未来币 -${price} → 友谊手环 +${amount}`, true);
      } else if (kind === "shinyCharm") {
        addRes("shinyCharm", amount);
        addLog(`购买：未来币 -${price} → 虹彩护符 +${amount}`, true);
      } else if (kind === "luckyEgg") {
        addRes("luckyEgg", amount);
        addLog(`购买：未来币 -${price} → 福缘蛋 +${amount}`, true);
      } else if (kind === "bottleCap") {
        addRes("bottleCap", amount);
        addLog(`购买：未来币 -${price} → 银桂冠 +${amount}`, true);
      } else if (kind === "goldBottleCap") {
        addRes("goldBottleCap", amount);
        addLog(`购买：未来币 -${price} → 金桂冠 +${amount}`, true);
      } else if (kind === "netball") {
        addRes("netball", amount);
        addLog(`购买：未来币 -${price} → 捕灵球 +${amount}`, true);
      } else if (kind === "duskball") {
        addRes("duskball", amount);
        addLog(`购买：未来币 -${price} → 暗夜灵球 +${amount}`, true);
      } else if (kind === "energyDrink") {
        addRes("energyDrink", amount);
        addLog(`购买：未来币 -${price} → 能量饮料 +${amount}`, true);
      } else if (kind === "searchFlare") {
        addRes("searchFlare", amount);
        addLog(`购买：未来币 -${price} → 搜索信号弹 +${amount}`, true);
      } else if (kind === "advSearchCell") {
        addRes("advSearchCell", amount);
        addLog(`购买：未来币 -${price} → 高级搜索电池 +${amount}`, true);
      } else if (kind === "sootheBell") {
        addRes("sootheBell", amount);
        addLog(`购买：未来币 -${price} → 暖心铃 +${amount}`, true);
      } else if (kind === "expCandyS") {
        addRes("expCandyS", amount);
        addLog(`购买：未来币 -${price} → 历练糖丸S +${amount}`, true);
      } else if (kind === "autoResearch") {
        state.unlocks.autoResearch = true;
        addLog("解锁：自动科研", true);
      } else if (kind === "autoBuild") {
        state.unlocks.autoBuild = true;
        addLog("解锁：自动建造", true);
      } else if (kind === "autoBall") {
        state.unlocks.autoBall = true;
        addLog("解锁：自动搓球", true);
      } else if (kind === "autoCraft") {
        state.unlocks.autoCraft = true;
        addLog("解锁：自动合成", true);
      } else {
        state.res.futurecoin.value = Math.max(0, (state.res.futurecoin?.value ?? 0) + price);
        return;
      }
      ui.futureDirty = true;
      render();
      return;
    }

    const autoCraftChk = ev.target?.closest?.("input[data-auto-craft]");
    if (autoCraftChk && elFutureShop.contains(autoCraftChk)) {
      const k = autoCraftChk.getAttribute("data-auto-craft");
      if (!k) return;
      const state = getState();
      if (!state.auto || typeof state.auto !== "object") state.auto = {};
      if (!state.auto.autoCraft || typeof state.auto.autoCraft !== "object") {
        state.auto.autoCraft = { evolutionEnergy: false, evolutionStone: false, linkRope: false, hugeBerry: false, megaStone: false };
      }
      if (!Object.prototype.hasOwnProperty.call(state.auto.autoCraft, "evolutionEnergy")) state.auto.autoCraft.evolutionEnergy = false;
      if (!Object.prototype.hasOwnProperty.call(state.auto.autoCraft, k)) return;
      state.auto.autoCraft[k] = Boolean(autoCraftChk.checked);
      ui.futureDirty = true;
      render();
      return;
    }

    const autoExChk = ev.target?.closest?.("input[data-auto-exchange]");
    if (autoExChk && elFutureShop.contains(autoExChk)) {
      const state = getState();
      if (!state.auto || typeof state.auto !== "object") state.auto = {};
      const lvl0 = state.auto.autoExchangeLevel;
      const lvl = typeof lvl0 === "number" && Number.isFinite(lvl0) ? Math.max(0, Math.floor(lvl0)) : 0;
      if (lvl <= 0) {
        state.auto.autoExchangeOn = false;
      } else {
        state.auto.autoExchangeOn = Boolean(autoExChk.checked);
      }
      ui.futureDirty = true;
      render();
      return;
    }

    const autoExUpBtn = ev.target?.closest?.("button[data-fc-autoex-up]");
    if (autoExUpBtn && elFutureShop.contains(autoExUpBtn)) {
      if (autoExUpBtn.disabled) return;
      const price = Math.max(0, Math.floor(Number(autoExUpBtn.getAttribute("data-fc-price") || "0")));
      if (price <= 0) return;
      const state = getState();
      if ((state.res.futurecoin?.value ?? 0) < price) return;
      state.res.futurecoin.value = Math.max(0, (state.res.futurecoin?.value ?? 0) - price);

      if (!state.auto || typeof state.auto !== "object") state.auto = {};
      const AUTO_EX_MAX_LEVEL = 10;
      const lvl0 = state.auto.autoExchangeLevel;
      const lvl = typeof lvl0 === "number" && Number.isFinite(lvl0) ? Math.max(0, Math.floor(lvl0)) : 0;
      if (lvl >= AUTO_EX_MAX_LEVEL) {
        ui.futureDirty = true;
        render();
        return;
      }
      state.auto.autoExchangeLevel = Math.min(AUTO_EX_MAX_LEVEL, lvl + 1);
      ui.futureDirty = true;
      render();
      return;
    }

    const btn = ev.target?.closest?.("button[data-fc]");
    if (btn && elFutureShop.contains(btn)) {
      if (btn.disabled) return;

      const rid = btn.getAttribute("data-fc");
      const qtyRaw = btn.getAttribute("data-fc-qty");
      if (!rid || !qtyRaw) return;

      const rates = {
        catnip: 1000,
        wood: 500,
      };
      const perCoin = rates[rid];
      if (typeof perCoin !== "number" || perCoin <= 0) return;

      const state = getState();
      const have = state.res[rid]?.value ?? 0;
      const maxCoins = Math.max(0, Math.floor(have / perCoin));
      const qty = qtyRaw === "max" ? maxCoins : Math.max(0, Math.floor(Number(qtyRaw)));
      if (!qty || qty <= 0) return;

      const cost = perCoin * qty;
      if ((state.res[rid]?.value ?? 0) < cost) return;

      state.res[rid].value = Math.max(0, state.res[rid].value - cost);
      addRes("futurecoin", qty);
      addLog(`兑换：${defs.resources[rid].name} -${cost} → 未来币 +${qty}`);
      ui.futureDirty = true;
      render();
      return;
    }

    const craftBtn = ev.target?.closest?.("button[data-craft]");
    if (craftBtn && elFutureShop.contains(craftBtn)) {
      if (craftBtn.disabled) return;
      const craftType = craftBtn.getAttribute("data-craft");
      const state = getState();

      if (craftType === "bigBerry") {
        const cost = 50;
        if ((state.res.catnip?.value ?? 0) < cost) return;
        state.res.catnip.value = Math.max(0, state.res.catnip.value - cost);
        addRes("bigBerry", 1);
        addLog(`制作：灵果 -${cost} → 大灵果 +1`, true);
        ui.futureDirty = true;
        render();
        return;
      }

      if (!state.crafting || typeof state.crafting !== "object" || state.crafting.type) {
        state.crafting = {
          evolutionEnergy: null,
          evolutionStone: null,
          linkRope: null,
          hugeBerry: null,
          megaStone: null,
        };
      }
      const craftObj = state.crafting;

      const curTask =
        craftType === "evolutionEnergy" || craftType === "evolutionStone"
          ? craftObj?.evolutionEnergy ?? craftObj?.evolutionStone
          : craftType
            ? craftObj?.[craftType]
            : null;
      const curOn = Boolean(curTask && typeof curTask === "object" && typeof curTask.remainingSec === "number" && curTask.remainingSec > 0);
      if (curOn) {
        addLog("合成失败：该合成任务进行中。", true);
        return;
      }

      if (craftType === "energyToStone") {
        const costEnergy = 10;
        if ((state.res.evolutionEnergy?.value ?? 0) < costEnergy) {
          addLog("兑换失败：灵源不足。", true);
          return;
        }
        state.res.evolutionEnergy.value = Math.max(0, (state.res.evolutionEnergy?.value ?? 0) - costEnergy);
        addRes("evolutionStone", 1);
        addLog(`兑换：灵源 -${costEnergy} → 灵晶石 +1`, true);
        ui.futureDirty = true;
        render();
        return;
      }

      if (craftType === "evolutionEnergy" || craftType === "evolutionStone") {
        const made0 =
          typeof state.evolutionStoneMade === "number" && Number.isFinite(state.evolutionStoneMade)
            ? Math.max(0, Math.floor(state.evolutionStoneMade))
            : 0;
        const stoneCost = Math.min(5000, 300 + made0 * 10);
        const stoneTime = 600; // 10分钟
        if ((state.res.minerals?.value ?? 0) < stoneCost) {
          addLog("合成失败：灵晶碎片不足。", true);
          return;
        }
        state.res.minerals.value = Math.max(0, (state.res.minerals?.value ?? 0) - stoneCost);
        craftObj.evolutionEnergy = {
          remainingSec: stoneTime,
          totalSec: stoneTime,
        };
        addLog("开始合成：灵晶石（10分钟）", true);
        ui.futureDirty = true;
        render();
        return;
      }

      if (craftType === "linkRope") {
        const ropeCostStone = 3;
        const ropeTime = 900; // 15分钟
        if ((state.res.evolutionStone?.value ?? 0) < ropeCostStone) {
          addLog("合成失败：灵晶石不足。", true);
          return;
        }
        state.res.evolutionStone.value = Math.max(0, (state.res.evolutionStone?.value ?? 0) - ropeCostStone);
        craftObj.linkRope = {
          remainingSec: ropeTime,
          totalSec: ropeTime,
        };
        addLog("开始合成：灵契绳（15分钟）", true);
        ui.futureDirty = true;
        render();
        return;
      }

      if (craftType === "hugeBerry") {
        const hugeCostCatnip = 5000;
        const hugeCostBig = 30;
        const hugeTime = 900; // 15分钟
        if ((state.res.catnip?.value ?? 0) < hugeCostCatnip) {
          addLog("合成失败：灵果不足。", true);
          return;
        }
        if ((state.res.bigBerry?.value ?? 0) < hugeCostBig) {
          addLog("合成失败：大灵果不足。", true);
          return;
        }
        state.res.catnip.value = Math.max(0, (state.res.catnip?.value ?? 0) - hugeCostCatnip);
        state.res.bigBerry.value = Math.max(0, (state.res.bigBerry?.value ?? 0) - hugeCostBig);
        craftObj.hugeBerry = {
          remainingSec: hugeTime,
          totalSec: hugeTime,
        };
        addLog("开始合成：巨大灵果（15分钟）", true);
        ui.futureDirty = true;
        render();
        return;
      }

      if (craftType === "megaStone") {
        const megaCostStone = 10;
        const megaTime = 1200; // 20分钟
        if ((state.res.evolutionStone?.value ?? 0) < megaCostStone) {
          addLog("合成失败：灵晶石不足。", true);
          return;
        }
        state.res.evolutionStone.value = Math.max(0, (state.res.evolutionStone?.value ?? 0) - megaCostStone);
        craftObj.megaStone = {
          remainingSec: megaTime,
          totalSec: megaTime,
        };
        addLog("开始合成：觉醒石（20分钟）", true);
        ui.futureDirty = true;
        render();
        return;
      }
    }
  });
}
