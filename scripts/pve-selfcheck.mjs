#!/usr/bin/env node
import "../data/beasts.js";
import "../data/beasts_zh.js";
import {
  calcDamage,
  simulateBattle,
  recommendedTypes,
  typeMatchScore,
  PVE_MAX_ROUNDS,
  estimateStageEnemyPower,
  pveFightModifiers,
} from "../modules/pve_battle.js";
import { PVE_CHAPTERS } from "../modules/pve_defs.js";

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  }
}

const realRandom = Math.random;
Math.random = () => 0.5;

try {
  const enemy = { side: "enemy", name: "雷压", types: ["electric"], atk: 90, spa: 90, def: 40, spd: 40, spe: 30 };
  const wrongDef = { side: "player", name: "高战风队", types: ["wind"], atk: 80, spa: 80, def: 50, spd: 50 };
  const seDef = { side: "player", name: "岩系克制队", types: ["stone"], atk: 60, spa: 60, def: 50, spd: 50 };
  const wrongHit = calcDamage(enemy, wrongDef, "electric");
  const seHit = calcDamage(enemy, seDef, "electric");
  assert(wrongHit.damage > seHit.damage, "wrong-type team takes more stage pressure damage");

  const wrongTeam = [{
    name: "高战风队",
    types: ["wind"],
    stats: { hp: 340, atk: 160, def: 90, spa: 160, spd: 90, spe: 45 },
  }];
  const seTeam = [{
    name: "岩系克制队",
    types: ["stone"],
    stats: { hp: 306, atk: 136, def: 90, spa: 136, spd: 90, spe: 45 },
  }];
  const enemies = [{ dex: 26, name: "雷鼓将", lvl: 10, stars: 1 }];
  const wrongResult = simulateBattle(wrongTeam, enemies, "electric");
  const seResult = simulateBattle(seTeam, enemies, "electric");
  assert(seResult.teamHpPct > wrongResult.teamHpPct, "SE team preserves more HP than higher-power wrong type");
  assert(seResult.superEffectiveHits > wrongResult.superEffectiveHits, "SE team lands more super-effective hits");

  const specialAttacker = { side: "player", name: "特攻手", types: ["water"], atk: 40, spa: 100 };
  const physicalAttacker = { side: "player", name: "物攻手", types: ["wind"], atk: 100, spa: 40 };
  const physWall = { side: "enemy", name: "物防墙", types: ["wind"], def: 120, spd: 40 };
  const specWall = { side: "enemy", name: "特防墙", types: ["wind"], def: 40, spd: 120 };
  assert(calcDamage(specialAttacker, physWall).damage > calcDamage(specialAttacker, specWall).damage, "special attacker checks spd");
  assert(calcDamage(physicalAttacker, specWall).damage > calcDamage(physicalAttacker, physWall).damage, "physical attacker checks def");

  // Recommend: dark stage should prefer light (唯一克制项，互克仍优先)
  const darkRec = recommendedTypes("dark", 3);
  assert(darkRec[0] === "light", `dark stage top recommend is light, got ${darkRec[0]}`);
  assert(typeMatchScore(["light"], "dark").score > typeMatchScore(["dark"], "dark").score, "light scores above dark vs dark stage");

  // Progress damage: high atk should exceed low atk vs same wall
  const high = calcDamage(
    { side: "player", types: ["stone"], atk: 120, spa: 40, def: 50, spd: 50 },
    { side: "enemy", types: ["electric"], atk: 50, spa: 50, def: 50, spd: 50 },
    "electric"
  );
  const low = calcDamage(
    { side: "player", types: ["stone"], atk: 40, spa: 20, def: 50, spd: 50 },
    { side: "enemy", types: ["electric"], atk: 50, spa: 50, def: 50, spd: 50 },
    "electric"
  );
  assert(high.damage > low.damage, "higher atk deals more damage");

  const baselineHit = calcDamage(
    { side: "player", types: ["wind"], atk: 80, spa: 40 },
    { side: "enemy", types: ["wind"], def: 60, spd: 60 },
    "wind"
  );
  const boostedHit = calcDamage(
    { side: "player", types: ["wind"], atk: 80, spa: 40 },
    { side: "enemy", types: ["wind"], def: 60, spd: 60 },
    "wind",
    { playerDamageMul: 1.5 }
  );
  assert(boostedHit.damage > baselineHit.damage, "playerDamageMul increases player damage");

  // Timeout decision: fat enemies + strong remaining HP → decision win not false loss
  // 注：保底伤害（atk/20）绕过防御，需用 HP 池顶住 500 回合磨血
  const stallTeam = [{
    name: "铁壁",
    types: ["light"],
    stats: { hp: 60000, atk: 8, def: 999, spa: 8, spd: 999, spe: 40 },
  }];
  const fatEnemies = [
    { dex: 149, name: "胖胖龙", lvl: 55, stars: 2 },
    { dex: 148, name: "丝带龙", lvl: 50, stars: 2 },
    { dex: 230, name: "海龙王", lvl: 50, stars: 2 },
    { dex: 149, name: "胖胖龙2", lvl: 45, stars: 2 },
  ];
  const stall = simulateBattle(stallTeam, fatEnemies, "mystic");
  assert(stall.rounds >= PVE_MAX_ROUNDS || stall.win, "stall fight hits cap or finishes");
  if (stall.rounds >= PVE_MAX_ROUNDS) {
    assert(stall.endReason === "decision" || stall.endReason === "timeout", "timeout sets endReason");
    if (stall.teamHpPct > stall.enemyHpPct) {
      assert(stall.win === true && stall.stars === 1, "HP-advantage timeout is 1★ decision win");
    }
  }

  // 2-8 exists and dragonite not ★3 anymore
  const dragon = PVE_CHAPTERS[1].stages.find((s) => s.id === "2-8");
  assert(dragon && dragon.enemies.some((e) => e.dex === 149 && e.stars === 2), "2-8 dragonite stars nerfed to 2");

  const stage11 = PVE_CHAPTERS[0].stages.find((s) => s.id === "1-1");
  assert(stage11 && stage11.enemies.every((e) => e.lvl <= 3), "1-1 enemy lvl tuned for early game");
  const ep = estimateStageEnemyPower(stage11);
  assert(ep > 0 && ep < 900, "1-1 enemy power in teachable range");

  const tut = pveFightModifiers("1-1", false);
  assert(tut.playerDamageMul > 1 && tut.incomingDamageMul < 1 && tut.enemyHpMul < 1, "1-1 first-clear tutorial mods");
  const noviceTeam = Array.from({ length: 6 }, (_, i) => ({
    name: `n${i}`,
    types: ["fire"],
    stats: { hp: 55, atk: 16, def: 12, spa: 16, spd: 12, spe: 14 },
  }));
  const noviceWin = simulateBattle(noviceTeam, stage11.enemies, stage11.type, tut);
  assert(noviceWin.win, "novice SE team can clear 1-1 with tutorial mods");

  assert(PVE_CHAPTERS.length >= 3, "chapter 3 exists");
  const ch3 = PVE_CHAPTERS.find((c) => c.id === "3");
  assert(ch3 && ch3.unlockDex === 55 && ch3.stages.length >= 5, "chapter 3 has 5+ stages @ dex 55");
  assert(ch3.stages[0].id === "3-1" && ch3.stages[0].unlockReq === null, "3-1 first stage open");

  assert(PVE_CHAPTERS.length >= 4, "chapter 4 exists");
  const ch4 = PVE_CHAPTERS.find((c) => c.id === "4");
  assert(ch4 && ch4.unlockDex === 90 && ch4.stages.length >= 4, "chapter 4 has 4+ stages @ dex 90");
  assert(ch4.stages[0].id === "4-1" && ch4.stages[0].unlockReq === null, "4-1 first stage open");
  assert(ch4.name.includes("峰顶"), "chapter 4 peak name");

  // P3 扩容：4→8 章（约 50 关），结构全量校验
  assert(PVE_CHAPTERS.length === 8, `8 chapters expected, got ${PVE_CHAPTERS.length}`);
  const TYPE_SET = new Set(["fire","water","grass","electric","wind","stone","light","dark","mystic"]);
  const roster = new Set(globalThis.BEAST_ROSTER ?? []);
  const zh = globalThis.BEAST_ZH ?? {};
  const stageIds = new Set();
  let stageTotal = 0;
  const REWARD_KEYS = new Set(["futurecoin","exp","evolutionEnergy","evolutionStone","linkRope"]);
  for (const ch of PVE_CHAPTERS) {
    assert(typeof ch.unlockDex === "number" && ch.unlockDex <= 150, `ch${ch.id} unlockDex reachable (${ch.unlockDex})`);
    let prevId = null;
    for (const st of ch.stages) {
      stageTotal += 1;
      assert(!stageIds.has(st.id), `dup stage id ${st.id}`);
      stageIds.add(st.id);
      assert(st.id.startsWith(`${ch.id}-`), `stage ${st.id} not in chapter ${ch.id}`);
      assert(TYPE_SET.has(st.type), `${st.id} bad type ${st.type}`);
      assert(st.unlockReq === prevId, `${st.id} unlockReq should chain from ${prevId}, got ${st.unlockReq}`);
      prevId = st.id;
      assert(st.enemies.length >= 1 && st.enemies.length <= 4, `${st.id} enemy count ${st.enemies.length}`);
      for (const e of st.enemies) {
        if (roster.size) {
          assert(roster.has(e.dex), `${st.id} enemy dex ${e.dex} not in roster`);
          const want = zh[`p${String(e.dex).padStart(3, "0")}`];
          if (want) assert(e.name === want, `${st.id} enemy ${e.dex} name ${e.name} != ${want}`);
        }
        assert(e.lvl >= 1 && e.lvl <= 100, `${st.id} enemy lvl ${e.lvl} out of range`);
        assert(e.stars >= 0 && e.stars <= 3, `${st.id} enemy stars ${e.stars}`);
      }
      for (const k of Object.keys(st.rewards ?? {})) assert(REWARD_KEYS.has(k), `${st.id} bad reward key ${k}`);
      for (const k of Object.keys(st.repeatRewards ?? {})) assert(REWARD_KEYS.has(k), `${st.id} bad repeat key ${k}`);
      assert((st.rewards?.futurecoin ?? 0) > 0 && (st.rewards?.exp ?? 0) > 0, `${st.id} must reward fc+exp`);
    }
  }
  assert(stageTotal === 50, `50 stages expected (2x), got ${stageTotal}`);
  const ch8 = PVE_CHAPTERS.find((c) => c.id === "8");
  assert(ch8 && ch8.stages.at(-1).enemies.some((e) => e.dex === 150), "8-5 梦蚀尊 finale boss present");
} finally {
  Math.random = realRandom;
}

if (failed) {
  console.error(`pve-selfcheck: ${failed} failed`);
  process.exit(1);
}
console.log("pve-selfcheck: OK");
