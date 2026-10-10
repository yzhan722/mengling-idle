// build-beast-roster.mjs — 从原始 pokemon data 构建 ~150 萌系 roster
// 输入：ROOTS（想保留的家族根 dex）；脚本自动把整条进化链（含跨世代成员/分支）拉齐。
// 输出：data/beast_roster.gen.json + 覆盖报告（类型/tier/家族数）。
// 原始数据在 scripts/_srcdata/（build-time only，不随站点发布）。
// 用法：node scripts/build-beast-roster.mjs [--write]

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (f) => eval(readFileSync(join(root, "scripts", "_srcdata", f), "utf8"));
load("pokemon_types.js");
load("pokemon_evo.js");
load("pokemon_evo_req.js");
load("pokemon_tier.js");
load("pokemon_catch_rate.js");

const pad3 = (n) => String(n).padStart(3, "0");
const pid = (dex) => `p${pad3(dex)}`;

// ---- 想保留的家族根（dex）。萌系优先：圆润/幼体/食物/毛球；稀有类只留神兽 3+1。 ----
const ROOTS = [
  // Gen1 御三家 + 经典
  1, 4, 7, // 妙蛙/小火龙/杰尼龟
  10, 13, // 虫系两链
  16, 19, // 波波 / 小拉达
  172, // 皮丘→皮卡丘→雷丘（跨代拉回 pichu）
  27, 29, // 穿山鼠 / 尼多兰（尼多朗雄链裁掉：与雌链主题重复）
  173, // 皮宝宝→皮皮→皮可西（fairy）
  37, // 六尾→九尾
  174, // 宝宝丁→胖丁→胖可丁（fairy）
  41, // 超音蝠→大嘴蝠→叉字蝠(169)
  43, // 走路草→臭臭花→霸王花/美丽花(45/182)
  52, // 喵喵→猫老大
  54, // 可达鸭→哥达鸭
  58, // 卡蒂狗→风速狗
  60, // 蚊香蝌蚪→…→蚊香蛙皇(186) 分支
  63, // 凯西→胡地
  66, // 腕力→怪力
  69, // 喇叭芽→大食花
  74, // 小拳石→隆隆岩
  77, // 小火马→烈焰马
  79, // 呆呆兽→呆壳兽/呆呆王(199)
  81, // 小磁怪→三合一磁怪→自爆磁怪(462, steel)
  92, // 鬼斯→耿鬼
  95, // 大岩蛇→大钢蛇(208, steel)
  98, // 大钳蟹→巨钳蟹
  104, // 卡拉卡拉→嘎啦嘎啦
  111, // 独角犀牛→超甲狂犀(464)
  440, // 小福蛋→吉利蛋→幸福蛋(242)（治愈萌）
  116, // 墨海马→海刺龙→刺龙王(230)
  120, // 海星星→宝石海星
  439, // 魔尼尼→魔墙人偶(122)
  123, // 飞天螳螂→巨钳螳螂(212, steel)
  239, // 电击怪→电击兽→电击魔兽(466)
  240, // 鸭嘴宝宝→鸭嘴火兽→鸭嘴炎兽(467)
  129, // 鲤鱼王→暴鲤龙（萌点：咸鱼翻身）
  131, // 拉普拉斯
  132, // 百变怪（萌系核心：软泥）
  133, // 伊布 ×8 进化（含水/雷/火/太阳/月亮/叶/冰/仙）
  137, // 多边兽→3D龙2→3D龙Z(233/474)
  446, // 小卡比兽→卡比兽(143)（萌系顶流）
  147, // 迷你龙→快龙
  150, 151, // 超梦 / 梦幻（神兽门面）
  // Gen2+ 萌系补位（dark/steel/fairy 覆盖 + 颜值）
  194, // 乌波→沼王（萌系顶流）
  202, // 果然翁（+360 小果然）
  216, // 熊宝宝→圈圈熊
  228, // 戴鲁比→黑鲁加（dark）
  258, // 水跃鱼→巨沼怪（meme 萌）
  285, // 蘑蘑菇→斗笠菇
  300, // 向尾喵→优雅猫
  311, 312, // 正电拍拍/负电拍拍
  417, // 帕奇利兹（电气松鼠萌）
  546, // 木棉球→风妖精（fairy 棉花）
  570, // 索罗亚→索罗亚克(dark)
  582, // 迷你冰→多多冰→双倍多多冰（冰淇淋）
  613, // 喷嚏熊→冻原熊（ice）
  659, // 掘掘兔→掘地兔（XY 可爱兔）
  684, // 绵绵泡芙→胖甜妮（fairy 棉花糖；粉香香链裁掉）
  702, // 咚咚鼠（fairy 电气鼠）
  710, // 南瓜精→南瓜怪人（万圣节萌）
];

// ---- 展开：每个 ROOT 拉齐其无向进化连通族 ----
const EVO = globalThis.POKEMON_EVO; // {"p001":["p002"]}
const adj = {};
const link = (a, b) => {
  (adj[a] ??= new Set()).add(b);
  (adj[b] ??= new Set()).add(a);
};
for (const [from, tos] of Object.entries(EVO)) for (const to of tos) link(from, to);

const rosterSet = new Set();
for (const dex of ROOTS) {
  const start = pid(dex);
  if (!adj[start] && !globalThis.POKEMON_TYPES[String(dex)]) {
    console.error(`!! unknown root dex ${dex}`);
    continue;
  }
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop();
    if (rosterSet.has(cur)) continue;
    rosterSet.add(cur);
    for (const n of adj[cur] ?? []) stack.push(n);
  }
}

const roster = [...rosterSet].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

// ---- 报告 ----
const types = new Map();
const tiers = { common: 0, uncommon: 0, rare: 0, epic: 0 };
for (const id of roster) {
  const dex = Number(id.slice(1));
  for (const t of globalThis.POKEMON_TYPES[String(dex)] ?? []) types.set(t, (types.get(t) ?? 0) + 1);
  const tier = globalThis.POKEMON_TIER[id] ?? "common";
  tiers[tier] = (tiers[tier] ?? 0) + 1;
}

// 找出未覆盖类型
const ALL_TYPES = ["normal","fire","water","grass","electric","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"];
const missing = ALL_TYPES.filter((t) => !types.has(t));

console.log(`roster size: ${roster.length}`);
console.log(`tiers: ${JSON.stringify(tiers)}`);
console.log(`types (${types.size}/18):`);
for (const t of ALL_TYPES) console.log(`  ${t.padEnd(9)} ${types.get(t) ?? 0}`);
if (missing.length) console.log(`MISSING TYPES: ${missing.join(", ")}`);
console.log("\ndex list:", roster.map((id) => id.slice(1)).join(","));

if (process.argv.includes("--write")) {
  // 名表在 data/beasts_zh.js 手写维护，此处不冗余输出
  writeFileSync(
    join(root, "data", "beast_roster.gen.json"),
    JSON.stringify({ roster: roster.map((id) => Number(id.slice(1))) }, null, 2) + "\n"
  );
  console.log("\nwrote data/beast_roster.gen.json");
}
