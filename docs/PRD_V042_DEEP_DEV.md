# PRD — 二次深度开发（v0.42 系列）

> 基线：v0.41.8（`master` @ `d17657b`，生产 = 仓库同步）  
> 撰写：2026-10-09 · 状态：**已评审，执行中**  
> 关联：`ARCHITECTURE.md` / `PLAYER_FUN_SCORECARD.md` / `docs/IAP_DECISION.md` / `docs/COMMERCIAL_OPS.md`

## 已确认决策（2026-10-09）

| 决策点 | 结论 | 影响 |
|--------|------|------|
| 世界观方向 | **萌系幻想生物**（Q版可爱泛幻想，非修仙/科幻/西幻） | 命名法：叠字/食物系/自然系；立绘风格 Q 版 |
| 立绘档位 | **混合**：精修 AI 图（约 100 只）+ 程序化兜底其余 | 先交付程序化管线跑全量，精修名单后补 |
| 图鉴规模 | **砍到 ~150 精选** | 放弃全图鉴卖点，每只精心设计；捕捉区域不按世代分区 |
| 商业化 | **暂不商业化** —— P5 整段删除，PRD 止于 P4 | 去 IP 化仍必需：防任天堂 DMCA 撤站/下架，保住公开分发资格 |

**调整后顺序**：`P1 去IP化 → P2 Prestige → P3 PvE扩容 → P4 app.js拆解`（P5 砍掉；若未来重启商业化，恢复 §7 并重新过审）。

## 0. 背景与问题

项目功能骨架已完成：721 物种图鉴、9 纪元、4 章 PvE、异步多人环、云存档、27 条 selfcheck + CI。但当前是「诚实空服」——真实用户 ≈ 0，IAP 为 stub，乐趣分 9.51 为内部自评。

**阻塞商业化的最大单点：IP**。721 只宝可梦原名、图鉴、`assets/pokemon{,_shiny}/` 共 1442 张官方立绘、精灵球系道具名、PvE 章节地名（常磐森林/尼比道馆…）全部是任天堂版权/商标资产。免费同人可用，接真 IAP 即构成实质法律风险。

**目标**：按以下五阶段把项目从「同人 MVP」推进到「可商业化独立 IP 挂机游戏」。顺序即优先级，前面阶段是后面的前置。

```
P1 去IP化 → P2 Prestige循环 → P3 PvE扩容 → P4 app.js拆解 → P5 真IAP
```

## 1. 范围

**In scope**：P1–P5 五个阶段全部交付物（见 §3–§7）。

**Out of scope**：获客/导量（独立运营议题，见 §8）；更换技术栈；实时 PvP（v0.43+ 候选）。

## 2. 成功度量

| 指标 | 现状 | 目标 |
|------|------|------|
| IP 资产残留 | 721 物种名 + 1442 张官方立绘 + PokeAPI 依赖 | **0**（无任天堂资产可被发现） |
| 长线终局 | 纪元 9（paradox）到头，无循环 | prestige 轮回可用，转生收益可验证 |
| PvE 内容 | 4 章（关都→神奥） | ≥ 8 章，数据驱动可纯加内容 |
| app.js | 3,299 行 / 28 SECTION | < 800 行纯组装层 |
| 商业化 | `purchasable: false` stub | 保持 stub（已决策不商业化） |
| 验证链 | 27 selfcheck 全绿 | 每阶段新增自检入链，全绿才允许进下一阶段 |

## 3. P1 — 去 IP 化（代号 Rebrand）

**目标**：仓库与产品中不留任何可识别的任天堂资产。这是商业化的法律前置，也是后续所有内容工作的地基（新内容直接用新设定写）。

### 3.1 耦合面清单（已盘点）

| 面 | 文件/位置 | 规模 |
|----|-----------|------|
| 物种中文名 | `data/pokemon_zh.js`（POKEMON_ZH, p001–p721） | 721 条 |
| 物种英文名 | `modules/pokemon_defs.js` `legacyId`（如 `"pidgey"`） | 140 条精选 + data 全量 |
| 属性/进化/捕捉率/梯度 | `data/pokemon_{types,evo,evo_req,catch_rate,tier}.js` | 721/338 条 |
| 立绘 | `assets/pokemon/*.png` + `assets/pokemon_shiny/*.png` | 1442 张 |
| 立绘回退 | `modules/sprites.js` → PokeAPI GitHub + jsdelivr 镜像 | 4 个 URL |
| 在线图鉴客户端 | `modules/pokeapi_client.js` → pokeapi.co | 整个模块可删 |
| 道具名 | `pokeball/ultraball/masterball` 等资源键 + UI 文案 | 资源键可保留 internal，显示名必改 |
| PvE 地名 | `modules/pve_defs.js` 章节/关卡名 | 4 章 ~30 处 |
| 标题/公告 | `index.html`「宝可梦放置冒险」、bulletin 全文 | ~10 处 |

### 3.2 方案（按已确认决策更新）

- **世界观**：萌系幻想生物。物种统称「萌灵」，统称词替换 宝可梦/精灵→萌灵、精灵球→灵球/绒球（内部资源键 `pokeball` 等保留不动）。
- **图鉴规模 ~150**：`buildPokemonList721()` 改为从 **roster 白名单**构建；roster 选取规则 = 进化链完整 + 18 类型覆盖 + tier 分布。被裁物种在旧存档中渲染为「逸散的萌灵」（灰显、不可再获得）——不删数据、不失收集记录。
- **命名**：~150 个原创萌系名（叠字/食物/自然系），进化链内名字成系列（如 芽苞→叶团→花绒球）。
- **立绘**：`assets/pokemon*/` 整目录删除。程序化 SVG 生成器出全部 ~150×2（闪光=配色偏移/星芒标记）；top ~100 名单标记「待 AI 精修」，管线留 `assets/beasts_hd/` 覆盖槽。`sprites.js` 远程回退整段删除，只走本地。
- **捕捉区域重构**：9 个世代分区 → ~6 个萌系生态区（如 萌芽草甸/果冻森林/棉花糖海岸/星光雪原/蜜糖沙漠/梦境秘境），pool 按 roster 名单+类型划分。
- **PvE 地名/道具显示名**：同步改萌系原创名。
- **存档兼容**：`SAVE_VERSION` 不变；pid `pNNN` 键保留 → 零迁移。

### 3.3 验收（✅ 2026-10-09 实施完成）

- [x] `branding-selfcheck.mjs` 全绿：运行时文件零 IP 词命中（白名单：`scripts/_srcdata/`、`build-beast-*`、`beast_defs.js` 的 LEGACY_DEX 迁移表、docs）
- [x] `assets/pokemon*/` 已删（-4.2MB/1442 张）；立绘 = `assets/beasts/{dex}.png` 精修位 + 程序化 SVG 兜底（18 色系 × 形态参数，闪光独立配色+星芒）
- [x] 捕捉区域 = 9 萌系生态区（芽芽草甸→幻梦秘境），`BEAST_ZONES` 按类型亲和+进化阶段生成；旧存档 roster 外物种显示「逸散的萌灵」
- [x] 标题/公告/帮助/NPC/PvE 地名全部去 IP 化
- [x] 旧存档兼容：`pNNN` pid 保留、`legacyIdMap` 迁移老键、mon.name 读档时重命名到新名表、`dexCaughtCount` 只计 roster 内物种

**实际偏差**：roster 落地 160 种（进化链完整约束下略高于 150）；生态区 9 个而非 ~6（保留原解锁节奏映射）；捕捉/纪元门槛按 160 图鉴重标定（unlockReq 0→120，era gate dex ≤120，dex_unique 目标 140/150）。

**遗留**：精修立绘 ~100 张为后续素材工作流（管线已留 `assets/beasts*/` 槽位）；域名 `game.pokeauto.online` 改名属部署层决策。

**工作量**：S（数据面）× 3 天级 + M（立绘管线）× 取决于档位。**风险**：立绘质量直接决定玩家观感，MVP 档先跑通管线。

## 4. P2 — Prestige 循环（代号 转生）

**目标**：补 idle 游戏缺失的终局长线。纪元 9（paradox）通关后可「飞升转世」，重置进度换取永久性 prestige 货币与加成，开启二周目。

### 4.1 设计要点

- **解锁条件**：达成 paradox 纪元全部目标 + 图鉴 ≥ 300 + 拥有 ≥ 1 闪光（门槛让转生有仪式感，非无脑刷）。
- **重置**：`state.res`、`state.tech`、建筑、精灵队伍、纪元进度清空；**保留**：`meta`、账号、好友/社交、图鉴收集记录（含闪光馆 —— 收集是身份资产不能清）、IAP 购得的 futurecoin 余额。
- **获得**：`legacyEssence`（新资源，按图鉴完成度/纪元速度/闪光数结算）→ 兑换永久加成树（产出倍率、捕捉率、起始科技解锁、开局稀有精灵蛋）。
- **轮回叙事**：周目计数 `state.meta.rebirths`，排行榜新增「轮回榜」，纪元目标随周目动态加难度（数值 ×1.5^n）。

### 4.2 技术落点

- `modules/systems/rebirth.js`（新，纯函数）：`canRebirth(state)` / `computeEssence(state)` / `applyRebirth(state)`
- `modules/state.js`：`meta.rebirths` / `meta.legacy` 字段，`SAVE_VERSION` 2→3 + 迁移（旧档补默认 0）
- `modules/tabs/` 新增「转生」或并入 future tab；排行榜 API 加 `rebirths` board（D1 `scores` 表已支持多 board，见 `functions/api/leaderboard/[board].js`）

### 4.3 验收

- [ ] `rebirth-selfcheck.mjs`：模拟全通关存档 → 转生 → 断言保留/清空集合正确、essence 结算正确、存档 v2→v3 迁移幂等
- [ ] `player-sim.mjs` 二周目跑通：转生后二周目速度显著快于一周目（可测断言）
- [ ] 云端：轮回榜 submit/pull 正常；旧账号（无 rebirths 字段）不崩

**工作量**：M。**依赖**：P1 完成（新设定下写转生叙事，避免双写文案）。

## 5. P3 — PvE 章节扩容

**目标**：4 章 → 8 章。关卡是纯数据（`PVE_CHAPTERS` 数组），加章不改代码逻辑。

- **第 5–8 章**：城都/丰缘/合众/卡洛斯对应难度带；每章 5–8 关、章末「冠军之路」型连战（沿用 `champ_*` 纪元目标呼应）。
- **复用机制**：`unlockReq` 线性链、`repeatRewards` 刷取、`PVE_DAILY_MAX` 体力门控全部沿用；新星系守关 Boss 可挂 `boss_bully` 同款结构。
- **数值校验**：新增 `pve-coverage-selfcheck.mjs` —— 每章关底敌方战力 vs 该阶段典型玩家队伍战力（用 `player-sim` 的 6h 快照校准），防止脚填数值。

**验收**：8 章全通有 selfcheck 覆盖；末章关底预期「paradox 纪元中期」玩家可通过；每日上限下章通关节奏 ≈ 2–3 天/章。

**工作量**：S/M（纯内容 + 一个校验脚本）。**可与 P4 并行**（不同 SECTION，不冲突）。

## 6. P4 — app.js 拆解（技术债）

**目标**：3,299 行 → < 800 行纯组装。28 个 `SECTION:` 注释分区下沉为真模块；`modules/state.js`（1,846 行）拆出 save/load/migrate。**行为不变**（`kittens-collab.mdc` 底线：refactor ≠ behavior-change）。

- **顺序**：先抽无 DOM 依赖段（DEFS_AND_BALANCE→`defs_*`、ECONOMY→`systems/`、SAVE_CLOUD→`save_codec` 归位）→ 再抽 render 段 → 最后组装层只剩 import + boot + tick 接线。
- **每步验收**：`selfcheck` + `api-contract-selfcheck` + `playwright-smoke` 三绿即过；单 PR 只搬 1–2 个 SECTION。
- **顺带收益**：`kittens-collab.mdc` 的多窗口分工规则在拆解后自然弱化 —— SECTION 冲突消失。

**工作量**：M/L（分 5–8 个 PR）。**为什么排第 4**：P1–P3 都在加内容，先加完再拆，避免拆解与新功能互相 conflict。

## 7. ~~P5 — 真 IAP~~（已取消）

**2026-10-09 决策：暂不商业化，本阶段整段删除。** IAP 代码保持现有诚实 stub 状态（`purchasable:false`），台账/验签代码保留不删 —— 若未来重启商业化，恢复本节并重新评审。

由此带来的 scope 变化：
- 商户资质申请的外部依赖消失，项目无硬截止日期
- 去 IP 化的紧迫性从「法律阻塞」降为「分发安全」（仍必须做：保住公开部署资格）
- M4 里程碑改为「P4 完成 = 架构还清」

## 8. 风险与开放项

| 风险 | 等级 | 对策 |
|------|------|------|
| 商业化资质/商户周期 | 高 | P1 阶段即启动申请，与技术线并行 |
| 立绘质量拉低观感 | 中 | P1 先 MVP 档管线，P3 前可替换升级 |
| 去 IP 后老玩家不认账 | 低 | 存档无缝迁移 + 公告叙事（「世界观重启」包装成游戏事件） |
| Prestige 数值失衡 | 中 | `player-sim` 对比一周目/二周目时长的硬断言 |
| **真实用户为零** | **高** | 本项目 PRD 之外的第一优先级：5 阶段做完≠有人玩。建议 P1 完成后即开始小范围导量验证留存（issue #3 的 D1 analytics 必须先行接通，否则无数据可判） |

## 9. 里程碑

| 里程碑 | 内容 | 出口 |
|--------|------|------|
| M1 | P1 完成 = 「萌灵放置冒险」（工作名）可公开 | branding-selfcheck 绿，零 IP 残留，~150 roster 全量可玩 |
| M2 | P2 完成 = 终局循环 | rebirth-selfcheck 绿，二周目可玩 |
| M3 | P3+P4 完成 = 内容×2 + 架构还清 | 8 章 + app.js<800 行，selfcheck 全绿 |

M3 之后发布 v0.42.0 release tag（当前 release 停在 v0.41.2，需补上）。商业化若未来重启，单开 PRD 恢复 P5。
