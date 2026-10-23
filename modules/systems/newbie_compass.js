// newbie_compass.js — 新手与前中期动态主线罗盘 + 篝火营地伙伴状态计算（纯函数模块，无 DOM/网络依赖）

import { ERA_DEFS, getEraDefById } from "../defs_eras.js";
import { questLabel } from "./era.js";

const COMPANION_MOODS = [
  "正在篝火旁烤甜灵果 ♪",
  "伴着噼啪火光打了个小哈欠~",
  "好奇地拨弄着地上的火星 ✨",
  "精神饱满，随时准备出发探险！",
  "把收集到的灵果整齐码在篮子里",
  "正对着夜空数萤火虫呢",
  "在温暖的火光下安心蜷成一团",
  "斗志昂扬地比划着招式！",
];

/**
 * 计算玩家当前所处的新手/前中期 7 步主线罗盘目标。
 * @param {object} state 游戏状态
 * @returns {object} 罗盘步骤描述对象
 */
export function computeNewbieCompass(state) {
  const s = state && typeof state === "object" ? state : {};
  const catnip = Math.max(0, Math.floor(s.res?.catnip?.value || 0));
  const clicks = Math.max(0, Math.floor(s.gatherClicks || 0));
  const hasBallTech = Boolean(s.tech?.pokeballBasics);
  const researchingBall = s.research?.tid === "pokeballBasics";
  const catchCount = Math.max(0, Math.floor(s.catchCount || 0));
  const hutOwned = Math.max(0, Math.floor(s.buildings?.hut?.owned || 0));
  const lumberOwned = Math.max(0, Math.floor(s.buildings?.lumberYard?.owned || 0));
  const workshopOwned = Math.max(0, Math.floor(s.buildings?.workshop?.owned || 0));
  const trainOwned = Math.max(0, Math.floor(s.buildings?.trainingGround?.owned || 0));
  const activeTrainCount = Array.isArray(s.training?.activeIds) ? s.training.activeIds.length : 0;
  const pveProgress = Math.max(0, Math.floor(s.pve?.progress || 0));

  const caughtMap = s.dex?.caught && typeof s.dex.caught === "object" ? s.dex.caught : {};
  let dexUnique = 0;
  for (const v of Object.values(caughtMap)) {
    if (typeof v === "number" && v > 0) dexUnique += 1;
  }

  // 第 1 步：采集满 30 灵果（或已点亮灵球基础）
  if (!hasBallTech && !researchingBall && catnip < 30 && catchCount === 0) {
    const cur = Math.min(30, catnip);
    return {
      stepIndex: 1,
      totalSteps: 7,
      id: "gather_30",
      badge: "新手第 1/7 步",
      title: "采集 30 颗灵果，点燃营地第一把火",
      desc: "连点几次【采集】或右侧快捷按钮即可攒够 30 灵果，用来研发第一项核心科技。",
      whyText: "💡 灵果是一切研究与建造的基础燃料，前几次点击采集收益丰厚！",
      progressCur: cur,
      progressMax: 30,
      pct: Math.round((cur / 30) * 100),
      ctaLabel: "立即采集灵果",
      ctaAction: "gather",
    };
  }

  // 第 2 步：研究「灵球基础」
  if (!hasBallTech && catchCount === 0) {
    const cur = researchingBall ? 1 : 0;
    return {
      stepIndex: 2,
      totalSteps: 7,
      id: "research_ball",
      badge: "新手第 2/7 步",
      title: researchingBall ? "正在研发「灵球基础」，稍候片刻…" : "前往「研究」点亮【灵球基础】",
      desc: researchingBall
        ? "研究完成后将立即获赠 5 颗灵球，并解锁【捕捉】与【萌灵】面板！"
        : "打开上方「研究」标签，花费 20 灵果启动【灵球基础】（仅需约 10 秒，完成立送 5 颗灵球）。",
      whyText: "💡 研发「灵球基础」后即可免费拿到首批灵球，去草甸抓第一只伙伴！",
      progressCur: cur,
      progressMax: 1,
      pct: researchingBall ? 60 : 15,
      ctaLabel: researchingBall ? "查看研究进度" : "去研究「灵球基础」",
      ctaAction: "tab:science",
    };
  }

  // 第 3 步：捕捉第一只萌灵
  if (catchCount < 1) {
    const balls = Math.max(0, Math.floor(s.res?.pokeball?.value || 0));
    return {
      stepIndex: 3,
      totalSteps: 7,
      id: "first_catch",
      badge: "新手第 3/7 步",
      title: "前往「捕捉 · 芽芽草甸」收服第 1 只萌灵",
      desc: `你手头已有 ${balls} 颗灵球！进入「捕捉」页点击【遭遇】，再点【投球捕捉】即可迎来第一位营地伙伴。`,
      whyText: "💡 每抓到一种新萌灵都会永久提升全资源产出倍率，伙伴还能在篝火旁陪你！",
      progressCur: 0,
      progressMax: 1,
      pct: 20,
      ctaLabel: "去捕捉第一只萌灵",
      ctaAction: "tab:capture",
    };
  }

  // 第 4 步：搭建基础产线（灵木小屋 + 伐木场 + 工坊）
  const infraScore = (hutOwned >= 1 ? 1 : 0) + (lumberOwned >= 1 ? 1 : 0) + (workshopOwned >= 1 ? 1 : 0);
  if (infraScore < 3) {
    const nextBld = hutOwned < 1 ? "灵木小屋" : lumberOwned < 1 ? "伐木场" : "制球工坊";
    return {
      stepIndex: 4,
      totalSteps: 7,
      id: "build_infra",
      badge: "新手第 4/7 步",
      title: `扩建营地：建造「${nextBld}」开启自动产线`,
      desc: "在下方建筑列表中依次建造【灵木小屋 → 伐木场 → 制球工坊】，让灵木与灵球源源不断产出。",
      whyText: "💡 有了制球工坊和灵木产线，就不用只靠手动攒球，真正开启轻松挂机！",
      progressCur: infraScore,
      progressMax: 3,
      pct: Math.round((infraScore / 3) * 100),
      ctaLabel: `建造${nextBld}`,
      ctaAction: "scroll:buildings",
    };
  }

  // 第 5 步：建造训练场并派驻萌灵
  if (trainOwned < 1 || activeTrainCount < 1) {
    const stepDone = (trainOwned >= 1 ? 1 : 0) + (activeTrainCount >= 1 ? 1 : 0);
    return {
      stepIndex: 5,
      totalSteps: 7,
      id: "setup_training",
      badge: "新手第 5/7 步",
      title: trainOwned < 1 ? "在篝火下方建造 1 座「训练场」" : "前往「功能」派驻萌灵进入训练槽",
      desc:
        trainOwned < 1
          ? "建造功能建筑【训练场】后，你的萌灵就能在后台自动获得经验升级与进化。"
          : "打开「功能」标签，把抓到的主力萌灵放进训练位，挂机也能持续变强！",
      whyText: "💡 萌灵达到指定等级即可进化为二阶/三阶形态，立绘造型与战力都会大幅蜕变！",
      progressCur: stepDone,
      progressMax: 2,
      pct: Math.round((stepDone / 2) * 100),
      ctaLabel: trainOwned < 1 ? "定位训练场建筑" : "去派驻训练伙伴",
      ctaAction: trainOwned < 1 ? "scroll:buildings" : "tab:functions",
    };
  }

  // 第 6 步：收集 5 种图鉴并首通「挑战 (PvE)」第 1 关
  if (dexUnique < 5 || pveProgress < 1) {
    const needDex = dexUnique < 5;
    const cur = Math.min(5, dexUnique) + (pveProgress >= 1 ? 1 : 0);
    return {
      stepIndex: 6,
      totalSteps: 7,
      id: "unlock_pve",
      badge: "新手第 6/7 步",
      title: needDex ? `收集 5 种不同萌灵（当前 ${dexUnique}/5），解锁【挑战】` : "前往「挑战」通关第 1 场巡礼试炼",
      desc: needDex
        ? "再去「捕捉」多抓几种不同编号的萌灵，集满 5 种图鉴即可开启 8 章 50 关【挑战】巡礼！"
        : "挑战面板已解锁！选好出战队伍击败第 1 关守卫，赢取稀有养成道具与未来币。",
      whyText: "💡 挑战巡礼会掉落蜕变石、历练糖丸与大量未来币，是检验队伍实力的核心舞台！",
      progressCur: cur,
      progressMax: 6,
      pct: Math.round((cur / 6) * 100),
      ctaLabel: needDex ? "继续去捕捉新萌灵" : "去打第 1 场挑战",
      ctaAction: needDex ? "tab:capture" : "tab:pve",
    };
  }

  // 第 7 步：接轨当前纪元主线目标
  const eraId = s.era?.id || ERA_DEFS[0]?.id || "dawn";
  const eraDef = getEraDefById(eraId) || ERA_DEFS[0];
  const quests = Array.isArray(s.era?.quests) ? s.era.quests.filter((q) => q && q.kind === "main") : [];
  const doneCount = quests.filter((q) => q.done).length;
  const totalQ = Math.max(1, quests.length);
  const nextQ = quests.find((q) => !q.done) || quests[0] || null;
  const nextLabel = nextQ ? questLabel(nextQ) : "推进时代目标";
  const allDone = quests.length > 0 && doneCount >= quests.length;

  return {
    stepIndex: 7,
    totalSteps: 7,
    id: "era_journey",
    badge: `时代征途 · ${eraDef.name}`,
    title: allDone ? `「${eraDef.name}」主线已全清！可前往捕捉页迈入下一时代` : `当前主线：${nextLabel}`,
    desc: `${eraDef.blurb || "跟随时代目标稳步扩张营地与图鉴。"}（已完成 ${doneCount}/${totalQ} 项时代主线）`,
    whyText: `💡 累计采集 ${clicks} 次 · 图鉴已点亮 ${dexUnique}/160 种 · 完成全部时代主线可升入新纪元并最终开启轮回转生！`,
    progressCur: doneCount,
    progressMax: totalQ,
    pct: Math.round((doneCount / totalQ) * 100),
    ctaLabel: allDone ? "去迈入下一时代" : "去推进时代目标",
    ctaAction: "tab:capture",
  };
}

/**
 * 为篝火营地舞台挑选最多 3 只陪伴萌灵及其实时状态描述。
 * @param {object} state 游戏状态
 */
export function selectCampCompanions(state) {
  const list = Array.isArray(state?.mons?.list) ? state.mons.list.filter((m) => m && typeof m === "object") : [];
  if (list.length === 0) return [];

  const scored = [...list].sort((a, b) => {
    const shinyDiff = (b.isShiny ? 1 : 0) - (a.isShiny ? 1 : 0);
    if (shinyDiff !== 0) return shinyDiff;
    const starDiff = (b.stars || 0) - (a.stars || 0);
    if (starDiff !== 0) return starDiff;
    const affDiff = (b.affection || 0) - (a.affection || 0);
    if (affDiff !== 0) return affDiff;
    return (b.lvl || 1) - (a.lvl || 1);
  });

  return scored.slice(0, 3).map((m, idx) => {
    const seed = (Number(m.id) || idx + 1) + Math.floor((state?.gatherClicks || 0) / 5);
    const mood = COMPANION_MOODS[seed % COMPANION_MOODS.length];
    return {
      id: m.id,
      dex: Number(m.dex) || 1,
      name: m.name || "萌灵",
      lvl: Math.max(1, Math.floor(m.lvl || 1)),
      isShiny: Boolean(m.isShiny),
      stars: Math.max(0, Math.floor(m.stars || 0)),
      mood,
    };
  });
}

/**
 * 根据建筑与时代进度计算篝火营地视觉等级（1~4 级火势）。
 */
export function getCampfireVisualTier(state) {
  const s = state && typeof state === "object" ? state : {};
  const bldTotal = Object.values(s.buildings || {}).reduce((acc, b) => acc + Math.max(0, Math.floor(b?.owned || 0)), 0);
  const eraIdx = Math.max(0, Math.floor(s.era?.index || 0));
  if (eraIdx >= 5 || bldTotal >= 35) return { tier: 4, label: "星耀圣火营地" };
  if (eraIdx >= 3 || bldTotal >= 18) return { tier: 3, label: "炽焰繁荣营地" };
  if (eraIdx >= 1 || bldTotal >= 5) return { tier: 2, label: "暖意篝火营地" };
  return { tier: 1, label: "初燃星火营地" };
}
