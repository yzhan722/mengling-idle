// branding-selfcheck.mjs — 去 IP 化红线检查：运行时文件不得再出现宝可梦 IP 词汇。
// 用法：node scripts/branding-selfcheck.mjs
// 白名单仅允许：构建期源数据快照 / 生成器 / 本检查脚本自身 / 历史文档。

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// 用户可见/品牌红线词（命中即失败）
const FORBIDDEN = [
  /宝可梦/, /神奇宝贝/, /口袋妖怪/, /宠物小精灵/, /Pokemon/i, /Pok[eé]mon/i,
  /pokeapi/i, /任天堂/, /Nintendo/i, /Game ?Freak/i,
  /皮卡丘/, /妙蛙/, /喷火龙/, /水箭龟/, /杰尼龟/, /小火龙/, /超梦/, /卡比兽/, /伊布(?!.*萌)/,
  /关都/, /城都/, /丰缘/, /神奥/, /合众/, /卡洛斯/, /阿罗拉/, /伽勒尔/,
  /道馆/, /太晶/, /极巨化/, /冠军之路/,
  /精灵球/, /大师球/, /大师灵球/, /先机球/, /豪华球/, /捕网球/, /黑暗球/, /神奇糖果/, /安抚之铃/, /幸运蛋/,
  /树果/, /球果/, /进化石/, /进化能量/, /奇迹糖果/, /稀有糖果/, /经验糖果/, /闪耀护符/, /福气蛋/, /牵绊绳/, /HP药剂/, /驯养/,
  /神兽/, /精灵(?!)/, // 「精灵」任何残留
  /raw\.githubusercontent\.com\/PokeAPI/i, /jsdelivr\.net\/gh\/PokeAPI/i, /pokeapi\.co/i,
  /assets\/pokemon/,
];

// 放行：构建期源数据、数据生成器、本检查脚本自身、存档迁移白名单文件
const WHITELIST = [
  /scripts[\/\\]_srcdata[\/\\]/,
  /scripts[\/\\]build-beast-/,
  /scripts[\/\\]branding-selfcheck\.mjs/,
  /docs[\/\\]/,                  // 历史文档
  /CHANGELOG|README/i,
];

const SCAN_DIRS = ["", "modules", "data", "functions", "scripts"];
const SCAN_EXT = /\.(js|mjs|html|css|json)$/i;

function* walk(dir) {
  const abs = join(root, dir);
  let entries;
  try {
    entries = readdirSync(abs);
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(abs, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (e === "node_modules" || e === ".git" || e === "_srcdata") continue;
      yield* walk(join(dir, e));
    } else if (SCAN_EXT.test(e)) {
      yield join(dir, e);
    }
  }
}

const fails = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const rel = relative(root, join(root, file)).replace(/\\/g, "/");
    if (WHITELIST.some((re) => re.test(rel))) continue;
    const text = readFileSync(join(root, file), "utf8");
    text.split("\n").forEach((line, i) => {
      for (const re of FORBIDDEN) {
        if (re.test(line)) {
          fails.push(`${rel}:${i + 1}  ${re}  →  ${line.trim().slice(0, 80)}`);
        }
      }
    });
  }
}

if (fails.length) {
  console.log(`branding-selfcheck: ${fails.length} FAIL`);
  for (const f of fails.slice(0, 60)) console.log("  FAIL", f);
  process.exit(1);
}
console.log("branding-selfcheck: OK — 运行时文件无宝可梦 IP 词汇残留");
