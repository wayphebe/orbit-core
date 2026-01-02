# 系统文档：数值 / 平衡（Balance）

本文件记录当前可调参数、阈值与它们对体验的影响，用于后续迭代平衡与做关卡/模式变体。

---

## 1. 核心指标（Design Metrics）

- **连接张力**：玩家在 `minDistance` 与 `maxDistance` 之间维持的稳定时间比例
- **协作效率**：平均每分钟收集的碎片数（Energy/min）
- **危险频率**：
  - **clash**（过近）触发次数/min
  - **broke**（过远预警）触发次数/min
- **阶段耗时**：到达每个 Tier 的平均时间（0→1、1→4、4→7、7→10）

> TODO：把以上指标写进 debug overlay（否则平衡只能靠主观感受）。

## 2. 当前数值表（As-Is）

### 2.1 移动与手感（`src/hooks/useGameLoop.ts`）

- `entitySpeed = 4`
- `friction = 0.92`

含义：

- speed 提高会放大“过近/过远”的风险，也会提高收集效率。
- friction 越低（更滑）越难协作；越高（更粘）越像“推箱子”，更可控但少了宇宙漂移感。

### 2.2 Link Tier 阈值（`src/types/game.ts`）

Energy → Tier：

- 0：SEVERED
- 1–3：NASCENT
- 4–6：STABLE
- 7–9：DEEP
- 10+：ASCENSION

### 2.3 距离窗口（`src/types/game.ts`）

- SEVERED：`min 20 / max 80`
- NASCENT：`min 30 / max 150`
- STABLE：`min 30 / max 250`
- DEEP：`min 30 / max Infinity`
- ASCENSION：`min 30 / max Infinity`

解读：

- 失联阶段的 `maxDistance` 很小，是主要张力来源。
- 从 DEEP 起，最大的系统风险只剩“过近”（坍缩），整体趋向轻松。

### 2.4 碎片参数（`src/hooks/useGameLoop.ts`）

- Celu 探测半径：`celuDetectionRadius = 100`
- Ak 收集半径：`akCollectionRadius = 25`
- 生成节奏：
  - `fragmentSpawnInterval = 3000ms`
  - `maxFragments = 12`（未收集）
  - 初始生成 5 个
- ASCENSION 吸附半径（实现写死）：`200`

> TODO：把 ASCENSION 的 `collectRadius=200` 与配置 `LINK_TIER_CONFIG.ASCENSION.collectRadius` 对齐（当前实现是硬编码 200）。

## 3. 平衡风险点（As-Is）

- **后期难度塌陷**：DEEP/ASCENSION 的 `maxDistance=Infinity` 使“断联张力”消失，体验可能变成单纯漂移收集。
- **clash 反馈偏软**：过近只有推开与提示音，没有明显代价；如果目标是“张力”，可能需要惩罚或资源损失。
- **碎片密度可能溢出**：最大 12 个未收集 + 3 秒刷新，会让玩家在熟练后很快把进度推到 ASCENSION，缺少中段停留。

## 4. 平衡策略建议（To-Be / TODO）

### 4.1 让每个 Tier 都有“策略差异”

- NASCENT：学会分工与呼叫（现状OK）
- STABLE：coherence 成为“资源”（需要实现）
- DEEP：自由度提高，但引入新的约束（例如环境扰动/碎片更挑剔）
- ASCENSION：作为结算/庆典，不建议无限续玩（否则稀释主题）

### 4.2 让“危险”有代价

可选轻量代价（不破坏原型节奏）：

- clash：短时间速度上限下降 / 视效抖动 / 碎片熄灭一部分
- broke：coherence 消耗 / 碎片生成暂停 / 能量掉落（谨慎）

### 4.3 数据化与可调

> TODO：把 `GAME_CONFIG` 与 Tier 配置拆成可覆盖的“模式参数”，以支持：
> - 教学模式（更大窗口、更慢速度）
> - 挑战模式（更小窗口、更稀疏碎片、更强惩罚）
> - 章节关卡（每关不同参数）



