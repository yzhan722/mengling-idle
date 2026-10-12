// 捕捉结算流：随机抽取/入账/投球（SECTION:CAPTURE_AWARD 拆出）
// 维护者窗口：B
// getSocialTab 为惰性 thunk（socialTab 在 boot 阶段才挂）

import { getBeastTier } from "../beast_defs.js";
import { bumpEraCounter } from "../systems/era.js";
import { awardCaughtBeast as awardCaughtBeastCore } from "./capture_award.js";
import {
  pityFailStep,
  luckyCatchMul,
  bumpCatchStreak,
  resetCatchStreak,
} from "../systems/gameplay_fun.js";
import { clamp, randFloat } from "../utils.js";

export function createCaptureFlow({
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
}) {
  function pickRandomBeast() {
    const pool = defs.beasts;
    return pickRandomFromPool(pool);
  }

  function awardCaughtBeast(p, opts = null) {
    const state = getState();
    awardCaughtBeastCore(state, p, opts, {
      createMonInstance,
      ui,
      addLog,
      addRes,
      bumpEraCounter,
      syncEraProgress: () => syncEraProgress(),
      afterAward: ({ species, prev, isShiny, prevCatchCount }) => {
        if (prevCatchCount === 0) analytics.trackFirstCapture({ beastId: species.id, dex: species.dex });

        if (prev === 0 && (species.tier === "rare" || species.tier === "epic") && typeof pushTickerEvent === "function") {
          pushTickerEvent("catch", `捕捉成功 ${species.name}`);
        }
        if (prev === 0 && species.tier === "epic" && typeof pushTickerEvent === "function") {
          pushTickerEvent("mythic", `捕捉到幻灵 ${species.name}`);
        }
        if (isShiny && typeof pushTickerEvent === "function") {
          pushTickerEvent("shiny", `捕捉到闪光 ${species.name}`);
        }

        const socialTab = getSocialTab?.();
        if (!socialTab || !ui.lbUid) return;
        const tier = getBeastTier(species.dex);
        const tierNum =
          tier === "common"
            ? 5
            : tier === "uncommon"
              ? 4
              : tier === "rare"
                ? 3
                : tier === "epic"
                  ? 2
                  : tier === "legendary"
                    ? 1
                    : 6;

        if (tierNum <= 2 || isShiny) {
          socialTab.autoShareAchievement("rare_catch", {
            name: species.name,
            pid: species.id,
            tier: tierNum,
            isShiny,
          });
        }

        if (prev === 0) {
          const dexCount = dexCaughtUnique();
          if (dexCount % 50 === 0 && dexCount > 0) {
            socialTab.autoShareAchievement("dex_milestone", { count: dexCount });
          }
        }

        if (isShiny) {
          const shinyCount = state.shinyCount || 0;
          if (shinyCount % 10 === 0 && shinyCount > 0) {
            socialTab.autoShareAchievement("shiny_milestone", { count: shinyCount });
          }
        }
      },
    });
  }

  function doCatch() {
    const state = getState();
    if (state.res.pokeball.value < 1) return;
    state.res.pokeball.value = Math.max(0, state.res.pokeball.value - 1);

    const pool = getCapturePool();
    if (!pool || pool.length === 0) {
      addLog("捕捉失败：该区域没有可捕捉的萌灵。");
      return;
    }
    const p = pickRandomFromPool(pool);

    const techEff = computeTechEffects();
    const base = baseCatchChanceByDex(p.dex);
    const add = typeof techEff.catchChanceAdd === "number" ? techEff.catchChanceAdd : 0;
    // 科技加成递减边际：前20%线性，之后逐渐衰减（避免common萌灵接近100%）
    const addRaw = add;
    const addSoft = addRaw <= 0.2 ? addRaw : 0.2 + (addRaw - 0.2) * 0.4;
    const baseWithTech = base * Math.max(1, 1 + addSoft);
    const fails = typeof state.rng?.catchFails === "number" ? state.rng.catchFails : 0;
    const pity = Math.min(0.02 * Math.max(0, Math.floor(fails)), 0.2);
    const capByTier = p.tier === "epic" ? 0.98 : p.tier === "rare" ? 0.92 : p.tier === "uncommon" ? 0.85 : 0.75;
    let chance = clamp(baseWithTech + pity, 0, capByTier);
    chance = clamp(chance * luckyCatchMul(state, globalThis.BEAST_TYPES?.[p.dex]), 0, Math.max(capByTier, 0.95));
    if (randFloat() > chance) {
      if (!state.rng) state.rng = { catchFails: 0 };
      state.rng.catchFails = Math.max(0, (state.rng.catchFails ?? 0) + pityFailStep(state, randFloat));
      resetCatchStreak(state);
      addLog("捕捉失败：萌灵逃走了。");
      return;
    }

    if (!state.rng) state.rng = { catchFails: 0 };
    state.rng.catchFails = 0;
    awardCaughtBeast(p);
    const { streak, reward } = bumpCatchStreak(state);
    if (streak >= 3) addLog(`连捕中：×${streak}`);
    if (reward?.berry > 0) {
      addRes("catnip", reward.berry);
      addLog(`★ ${reward.label}：灵果 +${reward.berry}`, true);
    }
  }

  return { pickRandomBeast, awardCaughtBeast, doCatch };
}
