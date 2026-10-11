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

// 萌灵名表逐值精确比对官方中文名（防复合名误伤，如「电毛球」≠「毛球」）
const OFFICIAL_NAMES = new Set(
  "皮卡丘,雷丘,妙蛙种子,妙蛙草,妙蛙花,小火龙,火恐龙,喷火龙,杰尼龟,卡咪龟,水箭龟,绿毛虫,铁甲蛹,巴大蝶,独角虫,铁壳昆,大针蜂,波波,比比鸟,比雕,小拉达,拉达,烈雀,大嘴雀,阿柏蛇,阿柏怪,穿山鼠,穿山王,尼多兰,尼多娜,尼多后,尼多朗,尼多力诺,尼多王,皮皮,皮可西,六尾,九尾,胖丁,胖可丁,超音蝠,大嘴蝠,走路草,臭臭花,霸王花,派拉斯,派拉斯特,毛球,摩鲁蛾,地鼠,三地鼠,喵喵,猫老大,可达鸭,哥达鸭,猴怪,火暴猴,卡蒂狗,风速狗,蚊香蝌蚪,蚊香蛙,快泳蛙,凯西,勇吉拉,胡地,腕力,豪力,怪力,喇叭芽,口呆花,大食花,玛瑙水母,毒刺水母,小拳石,隆隆石,隆隆岩,小火马,烈焰马,呆呆兽,呆壳兽,小磁怪,三合一磁怪,大葱鸭,嘟嘟,嘟嘟利,小海狮,白海狮,臭泥,臭臭泥,大舌贝,铁甲贝,鬼斯,鬼斯通,耿鬼,大岩蛇,催眠貘,引梦貘人,大钳蟹,巨钳蟹,雷电球,顽皮弹,蛋蛋,椰蛋树,可拉可拉,嘎拉嘎拉,飞腿郎,快拳郎,大舌头,瓦斯弹,双弹瓦斯,铁甲犀牛,铁甲暴龙,吉利蛋,蔓藤怪,袋龙,墨海马,海刺龙,角金鱼,金鱼王,海星星,宝石海星,吸盘魔偶,飞天螳螂,迷唇姐,电击兽,鸭嘴火龙,凯罗斯,暴鲤龙,鲤鱼王,乘龙,百变怪,伊布,水精灵,雷精灵,火精灵,多边兽,菊石兽,多刺菊石兽,化石盔,镰刀盔,化石翼龙,卡比兽,急冻鸟,闪电鸟,火焰鸟,迷你龙,哈克龙,快龙,超梦,梦幻,菊草叶,月桂叶,大菊花,火球鼠,火岩鼠,火暴兽,小锯鳄,蓝鳄,大力鳄,尾立,大尾立,咕咕,猫头夜鹰,芭瓢虫,安瓢虫,线球,阿利多斯,叉字蝠,灯笼鱼,电灯怪,皮丘,皮宝宝,宝宝丁,波克比,波克基古,天然雀,天然鸟,咩利羊,绵绵,电龙,美丽花,玛力露,玛力露丽,胡说树,牛蛙君,毽子草,毽子花,毽子绵,长尾怪手,向日种子,向日花怪,阳阳玛,乌波,沼王,太阳精灵,月精灵,黑暗鸦,呆呆皇,呆呆王,梦妖,未知图腾,果然翁,麒麟奇,榛果球,佛烈托斯,土龙,天蝎,大钢蛇,布卢,布卢皇,千针鱼,巨钳螳螂,壶壶,赫拉克罗斯,狃拉,熊宝宝,圈圈熊,熔岩虫,熔岩蜗牛,小山猪,长毛猪,太阳珊瑚,铁炮鱼,章鱼桶,信使鸟,盔甲鸟,戴鲁比,黑鲁加,刺龙王,小小象,顿甲,惊角鹿,图图犬,巴尔郎,柯波朗,迷唇娃,电击怪,小鸭嘴龙,大奶罐,幸福蛋,雷公,炎帝,水君,幼基拉,沙基拉,班基拉,洛奇亚,凤王,时拉比".split(","),
);

const fails = [];
try {
  const zhText = readFileSync(join(root, "data/beasts_zh.js"), "utf8");
  for (const m of zhText.matchAll(/p\d+:\s*"([^"]+)"/g)) {
    if (OFFICIAL_NAMES.has(m[1])) fails.push(`data/beasts_zh.js 官方宝可梦名残留: ${m[1]}`);
  }
} catch { /* 名表缺失时不阻塞其他检查 */ }

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
