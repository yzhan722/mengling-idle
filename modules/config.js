// 游戏配置常量集中管理
export const GAME_CONFIG = {
  // 版本信息
  VERSION: "0.7.3",
  
  // 存储键名
  STORAGE: {
    SAVE_KEY: "mengling_idle_save_v1",
    SAVE_BACKUP_KEY: "mengling_idle_save_v1_bak",
    SAVE_SLOTS: [
      // Cloud slot1 only; API slots 2–3 reserved/unused
      "mengling_idle_save_slot_1"
    ],
    DAILY_LOGIN_KEY: "mengling_idle_daily_login_reward_v1",
    LOG_COLLAPSE_KEY: "mengling_idle_log_collapsed_v1",
    BULLETIN_COLLAPSE_KEY: "mengling_idle_bulletin_collapsed_v1",
    CAPTURE_PREVIEW_KEY: "mengling_idle_capture_preview_hidden_v1",
    LB_UID_KEY: "mengling_idle_lb_uid_v1",
    LB_NAME_KEY: "mengling_idle_lb_name_v1",
    LB_AVATAR_KEY: "mengling_idle_lb_avatar_v1",
    STYLE_GUARD_KEY: "mengling_idle_style_fix_v1",
    BOSS_BULLY_SNOOZE_KEY: "mengling_idle_boss_bully_snooze_until_v1",
  },
  
  // 服务器 Buff 配置
  SERVER_BUFF: {
    KEYS: ["exp", "resProd", "resCap", "research", "capture", "aff"],
    MAX_LEVEL: 20,
    BUY_MAX_MINUTES: 30 * 24 * 60, // 30 天
    POLL_INTERVAL: 8000, // 8 秒
    UI: {
      exp: { name: "全服经验", icon: "经验", perLvl: 0.05 },
      resProd: { name: "全服资源产量", icon: "资源", perLvl: 0.05 },
      resCap: { name: "全服资源上限", icon: "上限", perLvl: 0.05 },
      research: { name: "全服科研速度", icon: "科研", perLvl: 0.1 },
      capture: { name: "全服捕获率", icon: "捕获", perLvl: 0.05 },
      aff: { name: "全服亲密度", icon: "亲密", perLvl: 0.05 },
    },
  },
  
  // 建筑平衡参数
  BUILDING_BALANCE: {
    costMul: 0.25,
    prodMul: 0.25,
    capAddMul: 0.25,
  },
  
  // 科技平衡参数
  TECH_BALANCE: {
    researchCostMul: 2,
    prodMulNerf: 0.7,
    woodProdMulNerf: 0.35,
    capAddBuff: 1.25,
  },
  
  // 捕获系统
  CAPTURE: {
    WEIGHTS: {
      common: 80,
      uncommon: 15,
      rare: 4,
      epic: 1,
    },
  },
  
  // UI 配置
  UI: {
    DEX_PAGE_SIZE: 50,
    MON_PAGE_SIZE: 20,
    HINT_DEFAULT_TTL: 2000,
    AUTOSAVE_INTERVAL: 30000, // 30 秒
    RENDER_DEBOUNCE: 16, // 约 60fps
    VIRTUAL_SCROLL_BUFFER: 5, // 虚拟滚动缓冲区大小
    LAZY_IMAGE_ROOT_MARGIN: '100px', // 懒加载提前量
  },
  
  // 排行榜配置
  LEADERBOARD: {
    AUTO_REFRESH_INTERVAL: 60000, // 60 秒
    TOP_MONS_LIMIT: 6,
  },
  
  // Boss 配置
  BOSS_BULLY: {
    POLL_INTERVAL: 10000, // 10 秒
    SNOOZE_DURATION: 3600000, // 1 小时
  },
};

// 捕获区域配置
// 捕捉生态区：pool 按 species.zone 过滤（zone 由 build-beast-data.mjs 按类型亲和+进化阶段生成）。
// 解锁阈值 = 已登记图鉴数，按 160 种图鉴校准（每区约解锁前区 40-60% 时开放）。
export const CAPTURE_AREAS = [
  {
    id: "meadow",
    name: "芽芽草甸",
    unlockReq: 0,
    pool: (p) => p.zone === 0,
  },
  {
    id: "woods",
    name: "蜜露林径",
    unlockReq: 6,
    pool: (p) => p.zone === 1,
  },
  {
    id: "brook",
    name: "溪光浅滩",
    unlockReq: 16,
    pool: (p) => p.zone === 2,
  },
  {
    id: "plateau",
    name: "风铃高原",
    unlockReq: 32,
    pool: (p) => p.zone === 3,
  },
  {
    id: "dunes",
    name: "星砂荒漠",
    unlockReq: 48,
    pool: (p) => p.zone === 4,
  },
  {
    id: "garden",
    name: "月见花园",
    unlockReq: 64,
    pool: (p) => p.zone === 5,
  },
  {
    id: "ridge",
    name: "霜晶山脊",
    unlockReq: 80,
    pool: (p) => p.zone === 6,
  },
  {
    id: "hollow",
    name: "龙眠幽谷",
    unlockReq: 96,
    pool: (p) => p.zone === 7,
  },
  {
    id: "sanctum",
    name: "幻梦秘境（传说）",
    unlockReq: 120,
    pool: (p) => p.zone === 8,
  },
];
