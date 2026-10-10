// PvE 关卡挑战 — 关卡定义
// 每个 chapter 包含多个 stage，线性解锁

export const PVE_DAILY_MAX = 20; // 提升每日次数上限：10→20

export const PVE_CHAPTERS = [
  {
    id: "1",
    name: "原野巡礼",
    unlockDex: 0,
    stages: [
      {
        id: "1-1", name: "萌芽林道",
        type: "grass",
        enemies: [
          { dex: 10, name: "毛茸茸", lvl: 3, stars: 0 },
          { dex: 13, name: "角尖尖", lvl: 3, stars: 0 },
        ],
        rewards: { futurecoin: 20, exp: 100 },
        repeatRewards: { futurecoin: 8, exp: 50 },
        unlockReq: null,
      },
      {
        id: "1-2", name: "碎石岩场",
        type: "stone",
        enemies: [
          { dex: 74, name: "石蛋蛋", lvl: 12, stars: 0 },
          { dex: 95, name: "石长长", lvl: 14, stars: 1 },
        ],
        rewards: { futurecoin: 50, exp: 300, evolutionEnergy: 1 },
        repeatRewards: { futurecoin: 22, exp: 135 },
        unlockReq: "1-1",
      },
      {
        id: "1-3", name: "潮汐浅湾",
        type: "water",
        enemies: [
          { dex: 120, name: "星闪闪", lvl: 18, stars: 0 },
          { dex: 121, name: "宝星辉", lvl: 21, stars: 1 },
        ],
        rewards: { futurecoin: 80, exp: 500, evolutionEnergy: 2 },
        repeatRewards: { futurecoin: 36, exp: 225 },
        unlockReq: "1-2",
      },
      {
        id: "1-4", name: "雷鸣石台",
        type: "electric",
        enemies: [
          { dex: 82, name: "磁三连", lvl: 21, stars: 0 },
          { dex: 26, name: "雷鼓将", lvl: 24, stars: 1 },
        ],
        rewards: { futurecoin: 100, exp: 800, evolutionEnergy: 2 },
        repeatRewards: { futurecoin: 45, exp: 360 },
        unlockReq: "1-3",
      },
      {
        id: "1-5", name: "花海回廊",
        type: "grass",
        enemies: [
          { dex: 71, name: "大嘴花", lvl: 24, stars: 0 },
          { dex: 69, name: "叭叭芽", lvl: 24, stars: 0 },
          { dex: 45, name: "大王花", lvl: 29, stars: 1 },
        ],
        rewards: { futurecoin: 120, exp: 1200, evolutionStone: 1 },
        repeatRewards: { futurecoin: 54, exp: 540 },
        unlockReq: "1-4",
      },
      {
        id: "1-6", name: "瘴雾湿地",
        type: "dark",
        enemies: [
          { dex: 41, name: "嗡蝠蝠", lvl: 37, stars: 0 },
          { dex: 42, name: "呲牙蝠", lvl: 39, stars: 0 },
          { dex: 44, name: "臭臭苞", lvl: 43, stars: 2 },
        ],
        rewards: { futurecoin: 150, exp: 2000, evolutionStone: 1 },
        repeatRewards: { futurecoin: 68, exp: 900 },
        unlockReq: "1-5",
      },
      {
        id: "1-7", name: "熔岩裂谷",
        type: "fire",
        enemies: [
          { dex: 58, name: "汪团团", lvl: 42, stars: 0 },
          { dex: 78, name: "烈焰骏", lvl: 40, stars: 1 },
          { dex: 59, name: "疾风汪", lvl: 47, stars: 2 },
        ],
        rewards: { futurecoin: 200, exp: 3000, evolutionStone: 2 },
        repeatRewards: { futurecoin: 90, exp: 1350 },
        unlockReq: "1-6",
      },
      {
        id: "1-8", name: "大地圣殿",
        type: "stone",
        enemies: [
          { dex: 28, name: "披甲滚", lvl: 42, stars: 1 },
          { dex: 31, name: "荆棘后", lvl: 44, stars: 1 },
          { dex: 112, name: "钻角犀", lvl: 50, stars: 2 },
        ],
        rewards: { futurecoin: 250, exp: 5000, evolutionStone: 2, linkRope: 1 },
        repeatRewards: { futurecoin: 112, exp: 2250 },
        unlockReq: "1-7",
      },
    ],
  },
  {
    id: "2",
    name: "林野巡礼",
    unlockDex: 25,
    stages: [
      {
        id: "2-1", name: "风语高台",
        type: "wind",
        enemies: [
          { dex: 16, name: "啾啾", lvl: 7, stars: 0 },
          { dex: 17, name: "咕啾", lvl: 9, stars: 0 },
        ],
        rewards: { futurecoin: 30, exp: 150 },
        repeatRewards: { futurecoin: 14, exp: 68 },
        unlockReq: null,
      },
      {
        id: "2-2", name: "虫鸣竹林",
        type: "grass",
        enemies: [
          { dex: 11, name: "茧团团", lvl: 14, stars: 0 },
          { dex: 212, name: "钢钳侠", lvl: 16, stars: 1 },
        ],
        rewards: { futurecoin: 60, exp: 400 },
        repeatRewards: { futurecoin: 27, exp: 180 },
        unlockReq: "2-1",
      },
      {
        id: "2-3", name: "金穗牧场",
        type: "wind",
        enemies: [
          { dex: 35, name: "月团团", lvl: 18, stars: 0 },
          { dex: 242, name: "天使蛋", lvl: 20, stars: 1 },
        ],
        rewards: { futurecoin: 80, exp: 600, evolutionEnergy: 2 },
        repeatRewards: { futurecoin: 36, exp: 270 },
        unlockReq: "2-2",
      },
      {
        id: "2-4", name: "幽影古塔",
        type: "dark",
        enemies: [
          { dex: 92, name: "雾团子", lvl: 21, stars: 0 },
          { dex: 93, name: "影爪爪", lvl: 23, stars: 0 },
          { dex: 94, name: "耿胖胖", lvl: 25, stars: 2 },
        ],
        rewards: { futurecoin: 120, exp: 1000, evolutionEnergy: 3 },
        repeatRewards: { futurecoin: 54, exp: 450 },
        unlockReq: "2-3",
      },
      {
        id: "2-5", name: "浪击拳馆",
        type: "stone",
        enemies: [
          { dex: 66, name: "拳头崽", lvl: 25, stars: 0 },
          { dex: 67, name: "壮壮臂", lvl: 28, stars: 1 },
          { dex: 62, name: "拳师蛙", lvl: 30, stars: 1 },
        ],
        rewards: { futurecoin: 150, exp: 1500, evolutionStone: 1 },
        repeatRewards: { futurecoin: 68, exp: 675 },
        unlockReq: "2-4",
      },
      {
        id: "2-6", name: "钢脊矿洞",
        type: "stone",
        enemies: [
          { dex: 81, name: "磁豆豆", lvl: 30, stars: 0 },
          { dex: 82, name: "磁三连", lvl: 35, stars: 1 },
          { dex: 208, name: "钢鳞长", lvl: 35, stars: 2 },
        ],
        rewards: { futurecoin: 200, exp: 2500, evolutionStone: 2 },
        repeatRewards: { futurecoin: 90, exp: 1125 },
        unlockReq: "2-5",
      },
      {
        id: "2-7", name: "霜晶冰湖",
        type: "wind",
        enemies: [
          { dex: 131, name: "浪歌鲸", lvl: 27, stars: 0 },
          { dex: 583, name: "双球冰", lvl: 31, stars: 1 },
          { dex: 471, name: "冰绒布", lvl: 34, stars: 2 },
        ],
        rewards: { futurecoin: 180, exp: 2000, evolutionStone: 1 },
        repeatRewards: { futurecoin: 81, exp: 900 },
        unlockReq: "2-6",
      },
      {
        id: "2-8", name: "龙眠深窟",
        type: "mystic",
        enemies: [
          { dex: 148, name: "丝带龙", lvl: 37, stars: 1 },
          { dex: 148, name: "丝带龙", lvl: 37, stars: 1 },
          // stars 3→2：终盘血牛+超时假负；仍需克制与练级
          { dex: 149, name: "胖胖龙", lvl: 50, stars: 2 },
        ],
        rewards: { futurecoin: 300, exp: 8000, evolutionStone: 3, linkRope: 1 },
        repeatRewards: { futurecoin: 135, exp: 3600 },
        unlockReq: "2-7",
      },
    ],
  },
  {
    id: "3",
    name: "沙海巡礼",
    unlockDex: 55,
    stages: [
      {
        id: "3-1", name: "菇影密林",
        type: "grass",
        enemies: [
          { dex: 285, name: "菇丁丁", lvl: 28, stars: 0 },
          { dex: 546, name: "棉絮球", lvl: 26, stars: 0 },
        ],
        rewards: { futurecoin: 220, exp: 2500 },
        repeatRewards: { futurecoin: 90, exp: 1100 },
        unlockReq: null,
      },
      {
        id: "3-2", name: "岩拳道场",
        type: "stone",
        enemies: [
          { dex: 66, name: "拳头崽", lvl: 30, stars: 0 },
          { dex: 67, name: "壮壮臂", lvl: 34, stars: 1 },
        ],
        rewards: { futurecoin: 260, exp: 3200, evolutionEnergy: 1 },
        repeatRewards: { futurecoin: 100, exp: 1300 },
        unlockReq: "3-1",
      },
      {
        id: "3-3", name: "烈焰泉窟",
        type: "fire",
        enemies: [
          { dex: 77, name: "焰鬃驹", lvl: 32, stars: 0 },
          { dex: 78, name: "烈焰骏", lvl: 36, stars: 1 },
        ],
        rewards: { futurecoin: 300, exp: 4000, evolutionStone: 1 },
        repeatRewards: { futurecoin: 110, exp: 1500 },
        unlockReq: "3-2",
      },
      {
        id: "3-4", name: "雨涟水宫",
        type: "water",
        enemies: [
          { dex: 258, name: "泥鳅鳅", lvl: 34, stars: 0 },
          { dex: 260, name: "沼巨灵", lvl: 40, stars: 2 },
        ],
        rewards: { futurecoin: 340, exp: 5000, evolutionStone: 1 },
        repeatRewards: { futurecoin: 120, exp: 1800 },
        unlockReq: "3-3",
      },
      {
        id: "3-5", name: "幽灯庭院",
        type: "dark",
        enemies: [
          { dex: 92, name: "雾团子", lvl: 36, stars: 1 },
          { dex: 93, name: "影爪爪", lvl: 42, stars: 2 },
          { dex: 710, name: "瓜灯灯", lvl: 44, stars: 2 },
        ],
        rewards: { futurecoin: 420, exp: 7000, evolutionStone: 2, linkRope: 1 },
        repeatRewards: { futurecoin: 150, exp: 2500 },
        unlockReq: "3-4",
      },
    ],
  },
  {
    id: "4",
    name: "峰顶巡礼",
    unlockDex: 90,
    stages: [
      {
        id: "4-1", name: "黑石矿坑",
        type: "stone",
        enemies: [
          { dex: 111, name: "犀角墩", lvl: 38, stars: 0 },
          { dex: 112, name: "钻角犀", lvl: 44, stars: 1 },
        ],
        rewards: { futurecoin: 480, exp: 8000, evolutionEnergy: 2 },
        repeatRewards: { futurecoin: 170, exp: 2800 },
        unlockReq: null,
      },
      {
        id: "4-2", name: "蔷薇花园",
        type: "grass",
        enemies: [
          { dex: 43, name: "跳跳草", lvl: 40, stars: 0 },
          { dex: 45, name: "大王花", lvl: 46, stars: 2 },
        ],
        rewards: { futurecoin: 540, exp: 9500, evolutionStone: 1 },
        repeatRewards: { futurecoin: 190, exp: 3200 },
        unlockReq: "4-1",
      },
      {
        id: "4-3", name: "雪岭营地",
        type: "wind",
        enemies: [
          { dex: 613, name: "鼻涕熊", lvl: 42, stars: 1 },
          { dex: 614, name: "冰川熊", lvl: 48, stars: 2 },
        ],
        rewards: { futurecoin: 600, exp: 11000, evolutionStone: 2 },
        repeatRewards: { futurecoin: 210, exp: 3600 },
        unlockReq: "4-2",
      },
      {
        id: "4-4", name: "巅峰之路",
        type: "mystic",
        enemies: [
          { dex: 147, name: "迷你蛟", lvl: 44, stars: 1 },
          { dex: 148, name: "丝带龙", lvl: 50, stars: 2 },
          { dex: 149, name: "胖胖龙", lvl: 55, stars: 2 },
        ],
        rewards: { futurecoin: 720, exp: 14000, evolutionStone: 3, linkRope: 1 },
        repeatRewards: { futurecoin: 250, exp: 4500 },
        unlockReq: "4-3",
      },
    ],
  },
];

// 根据 stage id 快速查找
const __stageMap = new Map();
for (const ch of PVE_CHAPTERS) {
  for (const st of ch.stages) {
    __stageMap.set(st.id, { chapter: ch, stage: st });
  }
}

export function getStageById(stageId) {
  return __stageMap.get(stageId) ?? null;
}

export function isStageUnlocked(stageId, progress) {
  const info = getStageById(stageId);
  if (!info) return false;
  const ch = info.chapter;
  const st = info.stage;
  // 章节解锁检查由外部做（需要 dexCount）
  if (st.unlockReq === null) return true;
  return Boolean(progress && progress[st.unlockReq]);
}
