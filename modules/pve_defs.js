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
          { dex: 10, name: "翠玉灵蚕", lvl: 3, stars: 0 },
          { dex: 13, name: "琥珀刺虫", lvl: 3, stars: 0 },
        ],
        rewards: { futurecoin: 20, exp: 100 },
        repeatRewards: { futurecoin: 8, exp: 50 },
        unlockReq: null,
      },
      {
        id: "1-2", name: "碎石岩场",
        type: "stone",
        enemies: [
          { dex: 74, name: "晶簇岩球", lvl: 12, stars: 0 },
          { dex: 95, name: "巨岩晶蛇", lvl: 14, stars: 1 },
        ],
        rewards: { futurecoin: 50, exp: 300, evolutionEnergy: 1 },
        repeatRewards: { futurecoin: 22, exp: 135 },
        unlockReq: "1-1",
      },
      {
        id: "1-3", name: "潮汐浅湾",
        type: "water",
        enemies: [
          { dex: 120, name: "辰光海星", lvl: 18, stars: 0 },
          { dex: 121, name: "紫微宝星皇", lvl: 21, stars: 1 },
        ],
        rewards: { futurecoin: 80, exp: 500, evolutionEnergy: 2 },
        repeatRewards: { futurecoin: 36, exp: 225 },
        unlockReq: "1-2",
      },
      {
        id: "1-4", name: "雷鸣石台",
        type: "electric",
        enemies: [
          { dex: 82, name: "三联磁晶阵", lvl: 21, stars: 0 },
          { dex: 26, name: "天雷御守鼠", lvl: 24, stars: 1 },
        ],
        rewards: { futurecoin: 100, exp: 800, evolutionEnergy: 2 },
        repeatRewards: { futurecoin: 45, exp: 360 },
        unlockReq: "1-3",
      },
      {
        id: "1-5", name: "花海回廊",
        type: "grass",
        enemies: [
          { dex: 71, name: "幽林捕蝇皇", lvl: 24, stars: 0 },
          { dex: 69, name: "翠蔓灵芽", lvl: 24, stars: 0 },
          { dex: 45, name: "绯冠大王花", lvl: 29, stars: 1 },
        ],
        rewards: { futurecoin: 120, exp: 1200, evolutionStone: 1 },
        repeatRewards: { futurecoin: 54, exp: 540 },
        unlockReq: "1-4",
      },
      {
        id: "1-6", name: "瘴雾湿地",
        type: "dark",
        enemies: [
          { dex: 41, name: "幽谷夜蝠", lvl: 37, stars: 0 },
          { dex: 42, name: "影翼猎蝠", lvl: 39, stars: 0 },
          { dex: 44, name: "迷雾梦花", lvl: 43, stars: 2 },
        ],
        rewards: { futurecoin: 150, exp: 2000, evolutionStone: 1 },
        repeatRewards: { futurecoin: 68, exp: 900 },
        unlockReq: "1-5",
      },
      {
        id: "1-7", name: "熔岩裂谷",
        type: "fire",
        enemies: [
          { dex: 58, name: "炽焰幼犬", lvl: 42, stars: 0 },
          { dex: 78, name: "逐日天马", lvl: 40, stars: 1 },
          { dex: 59, name: "燎原炎狮犬", lvl: 47, stars: 2 },
        ],
        rewards: { futurecoin: 200, exp: 3000, evolutionStone: 2 },
        repeatRewards: { futurecoin: 90, exp: 1350 },
        unlockReq: "1-6",
      },
      {
        id: "1-8", name: "大地圣殿",
        type: "stone",
        enemies: [
          { dex: 28, name: "金刚刺甲兽", lvl: 42, stars: 1 },
          { dex: 31, name: "紫曜棘甲王", lvl: 44, stars: 1 },
          { dex: 112, name: "破山钻角犀", lvl: 50, stars: 2 },
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
          { dex: 16, name: "云羽雏雀", lvl: 7, stars: 0 },
          { dex: 17, name: "疾风灵隼", lvl: 9, stars: 0 },
        ],
        rewards: { futurecoin: 30, exp: 150 },
        repeatRewards: { futurecoin: 14, exp: 68 },
        unlockReq: null,
      },
      {
        id: "2-2", name: "虫鸣竹林",
        type: "grass",
        enemies: [
          { dex: 11, name: "凝翠星茧", lvl: 14, stars: 0 },
          { dex: 212, name: "赤金铁钳皇", lvl: 16, stars: 1 },
        ],
        rewards: { futurecoin: 60, exp: 400 },
        repeatRewards: { futurecoin: 27, exp: 180 },
        unlockReq: "2-1",
      },
      {
        id: "2-3", name: "金穗牧场",
        type: "wind",
        enemies: [
          { dex: 35, name: "月咏花仙", lvl: 18, stars: 0 },
          { dex: 242, name: "圣光天佑兽", lvl: 20, stars: 1 },
        ],
        rewards: { futurecoin: 80, exp: 600, evolutionEnergy: 2 },
        repeatRewards: { futurecoin: 36, exp: 270 },
        unlockReq: "2-2",
      },
      {
        id: "2-4", name: "幽影古塔",
        type: "dark",
        enemies: [
          { dex: 92, name: "冥雾星魂", lvl: 21, stars: 0 },
          { dex: 93, name: "裂影鬼爪", lvl: 23, stars: 0 },
          { dex: 94, name: "噬影夜魔王", lvl: 25, stars: 2 },
        ],
        rewards: { futurecoin: 120, exp: 1000, evolutionEnergy: 3 },
        repeatRewards: { futurecoin: 54, exp: 450 },
        unlockReq: "2-3",
      },
      {
        id: "2-5", name: "浪击拳馆",
        type: "stone",
        enemies: [
          { dex: 66, name: "磐石武童", lvl: 25, stars: 0 },
          { dex: 67, name: "破岩战将", lvl: 28, stars: 1 },
          { dex: 62, name: "怒涛武宗蛙", lvl: 30, stars: 1 },
        ],
        rewards: { futurecoin: 150, exp: 1500, evolutionStone: 1 },
        repeatRewards: { futurecoin: 68, exp: 675 },
        unlockReq: "2-4",
      },
      {
        id: "2-6", name: "钢脊矿洞",
        type: "stone",
        enemies: [
          { dex: 81, name: "星磁浮球", lvl: 30, stars: 0 },
          { dex: 82, name: "三联磁晶阵", lvl: 35, stars: 1 },
          { dex: 208, name: "耀钢龙蛇", lvl: 35, stars: 2 },
        ],
        rewards: { futurecoin: 200, exp: 2500, evolutionStone: 2 },
        repeatRewards: { futurecoin: 90, exp: 1125 },
        unlockReq: "2-5",
      },
      {
        id: "2-7", name: "霜晶冰湖",
        type: "wind",
        enemies: [
          { dex: 131, name: "沧海颂歌龙", lvl: 27, stars: 0 },
          { dex: 583, name: "寒璇冰灵", lvl: 31, stars: 1 },
          { dex: 471, name: "霜华冰狐", lvl: 34, stars: 2 },
        ],
        rewards: { futurecoin: 180, exp: 2000, evolutionStone: 1 },
        repeatRewards: { futurecoin: 81, exp: 900 },
        unlockReq: "2-6",
      },
      {
        id: "2-8", name: "龙眠深窟",
        type: "mystic",
        enemies: [
          { dex: 148, name: "瑞霭灵龙", lvl: 37, stars: 1 },
          { dex: 148, name: "瑞霭灵龙", lvl: 37, stars: 1 },
          // stars 3→2：终盘血牛+超时假负；仍需克制与练级
          { dex: 149, name: "凌霄圣龙", lvl: 50, stars: 2 },
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
          { dex: 285, name: "森林小伞菇", lvl: 28, stars: 0 },
          { dex: 546, name: "云絮小团", lvl: 26, stars: 0 },
        ],
        rewards: { futurecoin: 220, exp: 2500 },
        repeatRewards: { futurecoin: 90, exp: 1100 },
        unlockReq: null,
      },
      {
        id: "3-2", name: "岩拳道场",
        type: "stone",
        enemies: [
          { dex: 66, name: "磐石武童", lvl: 30, stars: 0 },
          { dex: 67, name: "破岩战将", lvl: 34, stars: 1 },
        ],
        rewards: { futurecoin: 260, exp: 3200, evolutionEnergy: 1 },
        repeatRewards: { futurecoin: 100, exp: 1300 },
        unlockReq: "3-1",
      },
      {
        id: "3-3", name: "烈焰泉窟",
        type: "fire",
        enemies: [
          { dex: 77, name: "星焰幼驹", lvl: 32, stars: 0 },
          { dex: 78, name: "逐日天马", lvl: 36, stars: 1 },
        ],
        rewards: { futurecoin: 300, exp: 4000, evolutionStone: 1 },
        repeatRewards: { futurecoin: 110, exp: 1500 },
        unlockReq: "3-2",
      },
      {
        id: "3-4", name: "雨涟水宫",
        type: "water",
        enemies: [
          { dex: 258, name: "跃浪小水鲵", lvl: 34, stars: 0 },
          { dex: 260, name: "裂海巨渊兽", lvl: 40, stars: 2 },
        ],
        rewards: { futurecoin: 340, exp: 5000, evolutionStone: 1 },
        repeatRewards: { futurecoin: 120, exp: 1800 },
        unlockReq: "3-3",
      },
      {
        id: "3-5", name: "幽灯庭院",
        type: "dark",
        enemies: [
          { dex: 92, name: "冥雾星魂", lvl: 36, stars: 1 },
          { dex: 93, name: "裂影鬼爪", lvl: 42, stars: 2 },
          { dex: 710, name: "幽火南瓜灵", lvl: 44, stars: 2 },
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
          { dex: 111, name: "重甲岩犀", lvl: 38, stars: 0 },
          { dex: 112, name: "破山钻角犀", lvl: 44, stars: 1 },
        ],
        rewards: { futurecoin: 480, exp: 8000, evolutionEnergy: 2 },
        repeatRewards: { futurecoin: 170, exp: 2800 },
        unlockReq: null,
      },
      {
        id: "4-2", name: "蔷薇花园",
        type: "grass",
        enemies: [
          { dex: 43, name: "星夜曼陀芽", lvl: 40, stars: 0 },
          { dex: 45, name: "绯冠大王花", lvl: 46, stars: 2 },
        ],
        rewards: { futurecoin: 540, exp: 9500, evolutionStone: 1 },
        repeatRewards: { futurecoin: 190, exp: 3200 },
        unlockReq: "4-1",
      },
      {
        id: "4-3", name: "雪岭营地",
        type: "wind",
        enemies: [
          { dex: 613, name: "冰晶小雪熊", lvl: 42, stars: 1 },
          { dex: 614, name: "极地霜牙熊", lvl: 48, stars: 2 },
        ],
        rewards: { futurecoin: 600, exp: 11000, evolutionStone: 2 },
        repeatRewards: { futurecoin: 210, exp: 3600 },
        unlockReq: "4-2",
      },
      {
        id: "4-4", name: "巅峰之路",
        type: "mystic",
        enemies: [
          { dex: 147, name: "云渊幼蛟", lvl: 44, stars: 1 },
          { dex: 148, name: "瑞霭灵龙", lvl: 50, stars: 2 },
          { dex: 149, name: "凌霄圣龙", lvl: 55, stars: 2 },
        ],
        rewards: { futurecoin: 720, exp: 14000, evolutionStone: 3, linkRope: 1 },
        repeatRewards: { futurecoin: 250, exp: 4500 },
        unlockReq: "4-3",
      },
    ],
  },
  {
    id: "5",
    name: "深林巡礼",
    unlockDex: 110,
    stages: [
      {
        id: "5-1", name: "菌伞幽径",
        type: "grass",
        enemies: [
          { dex: 286, name: "疾风笠剑客", lvl: 48, stars: 0 },
          { dex: 470, name: "森语叶狐", lvl: 50, stars: 1 },
        ],
        rewards: { futurecoin: 800, exp: 15000 },
        repeatRewards: { futurecoin: 280, exp: 4800 },
        unlockReq: null,
      },
      {
        id: "5-2", name: "雷池高地",
        type: "electric",
        enemies: [
          { dex: 311, name: "阳雷乐拍兔", lvl: 50, stars: 0 },
          { dex: 312, name: "阴雷乐拍兔", lvl: 50, stars: 0 },
          { dex: 466, name: "雷霆泰坦王", lvl: 54, stars: 1 },
        ],
        rewards: { futurecoin: 880, exp: 16000, evolutionEnergy: 2 },
        repeatRewards: { futurecoin: 310, exp: 5200 },
        unlockReq: "5-1",
      },
      {
        id: "5-3", name: "焰影断崖",
        type: "fire",
        enemies: [
          { dex: 228, name: "冥火猎犬崽", lvl: 52, stars: 0 },
          { dex: 229, name: "炼狱魔狼王", lvl: 56, stars: 1 },
          { dex: 467, name: "炼狱炎魔皇", lvl: 58, stars: 2 },
        ],
        rewards: { futurecoin: 960, exp: 17500, evolutionStone: 1 },
        repeatRewards: { futurecoin: 340, exp: 5600 },
        unlockReq: "5-2",
      },
      {
        id: "5-4", name: "霜风雪窟",
        type: "wind",
        enemies: [
          { dex: 582, name: "霜星幼晶", lvl: 54, stars: 0 },
          { dex: 584, name: "极光双子晶", lvl: 58, stars: 1 },
          { dex: 660, name: "裂地重锤兔", lvl: 60, stars: 2 },
        ],
        rewards: { futurecoin: 1040, exp: 18500, evolutionStone: 1 },
        repeatRewards: { futurecoin: 370, exp: 6000 },
        unlockReq: "5-3",
      },
      {
        id: "5-5", name: "暗穴回廊",
        type: "dark",
        enemies: [
          { dex: 570, name: "幻夜赤尾狐", lvl: 58, stars: 1 },
          { dex: 571, name: "诡影夜狐王", lvl: 60, stars: 1 },
          { dex: 169, name: "紫电四翼蝠", lvl: 62, stars: 2 },
        ],
        rewards: { futurecoin: 1120, exp: 19500, evolutionStone: 2 },
        repeatRewards: { futurecoin: 400, exp: 6400 },
        unlockReq: "5-4",
      },
      {
        id: "5-6", name: "岩垒天井",
        type: "stone",
        enemies: [
          { dex: 104, name: "荒骨幼狼", lvl: 56, stars: 0 },
          { dex: 105, name: "镇魂骨武士", lvl: 60, stars: 1 },
          { dex: 464, name: "熔岩巨甲犀", lvl: 62, stars: 2 },
        ],
        rewards: { futurecoin: 1200, exp: 21000, evolutionStone: 2, linkRope: 1 },
        repeatRewards: { futurecoin: 430, exp: 7000 },
        unlockReq: "5-5",
      },
      {
        id: "5-7", name: "荆棘王庭",
        type: "grass",
        enemies: [
          { dex: 182, name: "晴空花舞姬", lvl: 60, stars: 1 },
          { dex: 711, name: "夜宴南瓜爵", lvl: 62, stars: 1 },
          { dex: 45, name: "绯冠大王花", lvl: 64, stars: 2 },
        ],
        rewards: { futurecoin: 1350, exp: 23000, evolutionStone: 3, linkRope: 1 },
        repeatRewards: { futurecoin: 470, exp: 7600 },
        unlockReq: "5-6",
      },
    ],
  },
  {
    id: "6",
    name: "环礁巡礼",
    unlockDex: 125,
    stages: [
      {
        id: "6-1", name: "浅滩蟹湾",
        type: "water",
        enemies: [
          { dex: 98, name: "赤甲灵蟹", lvl: 58, stars: 0 },
          { dex: 99, name: "裂海巨钳王", lvl: 62, stars: 1 },
        ],
        rewards: { futurecoin: 900, exp: 21500 },
        repeatRewards: { futurecoin: 460, exp: 7400 },
        unlockReq: null,
      },
      {
        id: "6-2", name: "墨海深沟",
        type: "water",
        enemies: [
          { dex: 116, name: "碧波小海马", lvl: 60, stars: 0 },
          { dex: 117, name: "棘冠海刺龙", lvl: 64, stars: 1 },
          { dex: 186, name: "碧玉蛙皇", lvl: 66, stars: 2 },
        ],
        rewards: { futurecoin: 990, exp: 23000, evolutionEnergy: 2 },
        repeatRewards: { futurecoin: 490, exp: 8000 },
        unlockReq: "6-1",
      },
      {
        id: "6-3", name: "棉云草甸",
        type: "light",
        enemies: [
          { dex: 684, name: "云糖绒球", lvl: 62, stars: 0 },
          { dex: 685, name: "星甜慕斯姬", lvl: 66, stars: 1 },
          { dex: 700, name: "绯星仙狐", lvl: 68, stars: 2 },
        ],
        rewards: { futurecoin: 1080, exp: 24000, evolutionStone: 1 },
        repeatRewards: { futurecoin: 520, exp: 8400 },
        unlockReq: "6-2",
      },
      {
        id: "6-4", name: "幻梦树海",
        type: "mystic",
        enemies: [
          { dex: 63, name: "星眠小狐", lvl: 62, stars: 0 },
          { dex: 64, name: "念力灵狐", lvl: 66, stars: 1 },
          { dex: 65, name: "天机星圣狐", lvl: 68, stars: 2 },
        ],
        rewards: { futurecoin: 1170, exp: 25000, evolutionStone: 1 },
        repeatRewards: { futurecoin: 560, exp: 8800 },
        unlockReq: "6-3",
      },
      {
        id: "6-5", name: "兔窟迷道",
        type: "wind",
        enemies: [
          { dex: 659, name: "灵耳掘地兔", lvl: 64, stars: 0 },
          { dex: 660, name: "裂地重锤兔", lvl: 68, stars: 1 },
          { dex: 217, name: "啸月巨灵熊", lvl: 70, stars: 2 },
        ],
        rewards: { futurecoin: 1260, exp: 26000, evolutionStone: 2 },
        repeatRewards: { futurecoin: 590, exp: 9200 },
        unlockReq: "6-4",
      },
      {
        id: "6-6", name: "双子电塔",
        type: "electric",
        enemies: [
          { dex: 702, name: "星波圆耳鼠", lvl: 70, stars: 1 },
          { dex: 125, name: "狂雷战兽", lvl: 70, stars: 1 },
          { dex: 462, name: "苍穹磁暴舰", lvl: 74, stars: 2 },
        ],
        rewards: { futurecoin: 1350, exp: 28000, evolutionStone: 2, linkRope: 1 },
        repeatRewards: { futurecoin: 620, exp: 9800 },
        unlockReq: "6-5",
      },
    ],
  },
  {
    id: "7",
    name: "苍穹巡礼",
    unlockDex: 140,
    stages: [
      {
        id: "7-1", name: "云端牧场",
        type: "wind",
        enemies: [
          { dex: 52, name: "招财星喵", lvl: 68, stars: 0 },
          { dex: 53, name: "金瞳灵豹", lvl: 72, stars: 1 },
          { dex: 301, name: "紫月贵妃喵", lvl: 74, stars: 2 },
        ],
        rewards: { futurecoin: 1000, exp: 29000 },
        repeatRewards: { futurecoin: 660, exp: 10400 },
        unlockReq: null,
      },
      {
        id: "7-2", name: "歌咏回廊",
        type: "light",
        enemies: [
          { dex: 39, name: "星歌绒灵", lvl: 70, stars: 0 },
          { dex: 40, name: "天籁歌姬兽", lvl: 74, stars: 1 },
          { dex: 36, name: "月华星后", lvl: 76, stars: 2 },
        ],
        rewards: { futurecoin: 1100, exp: 30500, evolutionEnergy: 3 },
        repeatRewards: { futurecoin: 700, exp: 11000 },
        unlockReq: "7-1",
      },
      {
        id: "7-3", name: "沼王神殿",
        type: "stone",
        enemies: [
          { dex: 194, name: "溪岸笑笑鲵", lvl: 72, stars: 0 },
          { dex: 259, name: "踏浪岩鲵", lvl: 74, stars: 1 },
          { dex: 195, name: "沧泽憨憨鲵", lvl: 78, stars: 2 },
        ],
        rewards: { futurecoin: 1200, exp: 31500, evolutionStone: 2 },
        repeatRewards: { futurecoin: 740, exp: 11600 },
        unlockReq: "7-2",
      },
      {
        id: "7-4", name: "像素回廊",
        type: "wind",
        enemies: [
          { dex: 137, name: "星轨棱晶兽", lvl: 72, stars: 0 },
          { dex: 233, name: "虚空星核兽", lvl: 76, stars: 1 },
          { dex: 474, name: "超维星灵皇", lvl: 78, stars: 2 },
        ],
        rewards: { futurecoin: 1300, exp: 32500, evolutionStone: 2 },
        repeatRewards: { futurecoin: 790, exp: 12200 },
        unlockReq: "7-3",
      },
      {
        id: "7-5", name: "火绒圣坛",
        type: "fire",
        enemies: [
          { dex: 136, name: "炽焰火狐", lvl: 74, stars: 1 },
          { dex: 38, name: "九曜天狐", lvl: 78, stars: 2 },
          { dex: 6, name: "焚天炽翼龙", lvl: 80, stars: 2 },
        ],
        rewards: { futurecoin: 1400, exp: 33500, evolutionStone: 2 },
        repeatRewards: { futurecoin: 830, exp: 12800 },
        unlockReq: "7-4",
      },
      {
        id: "7-6", name: "龙王深海",
        type: "water",
        enemies: [
          { dex: 129, name: "金鳞跃波鲤", lvl: 76, stars: 1 },
          { dex: 130, name: "覆海苍龙", lvl: 82, stars: 2 },
          { dex: 230, name: "沧溟海龙皇", lvl: 86, stars: 2 },
        ],
        rewards: { futurecoin: 1500, exp: 36000, evolutionStone: 3, linkRope: 2 },
        repeatRewards: { futurecoin: 880, exp: 13600 },
        unlockReq: "7-5",
      },
    ],
  },
  {
    id: "8",
    name: "梦境巡礼",
    unlockDex: 150,
    stages: [
      {
        id: "8-1", name: "入梦雾径",
        type: "mystic",
        enemies: [
          { dex: 360, name: "乐天小蓝团", lvl: 80, stars: 1 },
          { dex: 79, name: "梦游水獭", lvl: 80, stars: 1 },
          { dex: 202, name: "镇岳守心灵", lvl: 84, stars: 2 },
        ],
        rewards: { futurecoin: 1200, exp: 37000 },
        repeatRewards: { futurecoin: 940, exp: 14400 },
        unlockReq: null,
      },
      {
        id: "8-2", name: "默剧舞台",
        type: "mystic",
        enemies: [
          { dex: 439, name: "星戏小偶", lvl: 78, stars: 0 },
          { dex: 122, name: "幻镜星偶师", lvl: 80, stars: 1 },
          { dex: 199, name: "沧海智者獭", lvl: 80, stars: 2 },
        ],
        rewards: { futurecoin: 1350, exp: 39000, evolutionEnergy: 3 },
        repeatRewards: { futurecoin: 1000, exp: 15200 },
        unlockReq: "8-1",
      },
      {
        id: "8-3", name: "夜行暗巷",
        type: "dark",
        enemies: [
          { dex: 197, name: "幽月影狐", lvl: 78, stars: 1 },
          { dex: 711, name: "夜宴南瓜爵", lvl: 80, stars: 1 },
          { dex: 571, name: "诡影夜狐王", lvl: 82, stars: 2 },
        ],
        rewards: { futurecoin: 1500, exp: 40500, evolutionStone: 2 },
        repeatRewards: { futurecoin: 1080, exp: 16000 },
        unlockReq: "8-2",
      },
      {
        id: "8-4", name: "深潜龙渊",
        type: "water",
        enemies: [
          { dex: 9, name: "镇海重炮龟", lvl: 82, stars: 1 },
          { dex: 80, name: "螺甲灵獭", lvl: 82, stars: 1 },
          { dex: 149, name: "凌霄圣龙", lvl: 86, stars: 2 },
        ],
        rewards: { futurecoin: 1650, exp: 42500, evolutionStone: 3 },
        repeatRewards: { futurecoin: 1160, exp: 17000 },
        unlockReq: "8-3",
      },
      {
        id: "8-5", name: "绒布圣殿",
        type: "mystic",
        enemies: [
          { dex: 196, name: "曜光星狐", lvl: 80, stars: 1 },
          { dex: 197, name: "幽月影狐", lvl: 82, stars: 1 },
          { dex: 470, name: "森语叶狐", lvl: 84, stars: 2 },
        ],
        rewards: { futurecoin: 1720, exp: 43500, evolutionStone: 3 },
        repeatRewards: { futurecoin: 1200, exp: 17500 },
        unlockReq: "8-4",
      },
      {
        id: "8-6", name: "梦蚀王座",
        type: "mystic",
        enemies: [
          { dex: 151, name: "幻梦祈愿灵", lvl: 82, stars: 1 },
          { dex: 65, name: "天机星圣狐", lvl: 82, stars: 2 },
          { dex: 150, name: "太虚星蚀尊", lvl: 85, stars: 2 },
        ],
        rewards: { futurecoin: 1800, exp: 45000, evolutionStone: 3, linkRope: 2 },
        repeatRewards: { futurecoin: 1250, exp: 18000 },
        unlockReq: "8-5",
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
