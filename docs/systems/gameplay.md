# 系统文档：Gameplay（玩法）

本文件聚焦“规则是什么、如何运行、玩家如何掌握”。以当前实现（As-Is）为准，规划（To-Be）以 TODO 标注。

---

## 1. 玩家输入与操控（As-Is）

- **Celu**：W/A/S/D（四向）
- **Ak**：↑/←/↓/→（四向）
- **移动模型**：
  - 每帧计算输入方向向量并归一化
  - 乘以 `entitySpeed`
  - 与旧速度叠加后乘 `friction` 产生漂移

当前默认参数（`src/hooks/useGameLoop.ts`）：

- `entitySpeed = 4`
- `friction = 0.92`

> 现状观感：更像“太空漂移”，玩家需要提前量与协调。

## 2. 角色分工与非对称（As-Is）

- **Celu（探测者）**：靠近碎片触发“激活”
  - 探测半径：`celuDetectionRadius = 100`
  - UI/美术暗示：冷青（celu）
- **Ak（收集者）**：只能收集“已激活”的碎片
  - 收集半径：`akCollectionRadius = 25`
  - UI/美术暗示：暖橙（ak）

这构成最小协作链条：**Celu 发现 → Ak 获取**。

## 3. 距离约束（Link Constraint）（As-Is）

每个 Tier 配置：

- `minDistance`：太近触发“推开”
- `maxDistance`：太远触发“拉回”（若非 Infinity）
- `maxDistance` 接近上限（0.9）触发“broke”音效预警
- `minDistance` 以下触发“clash”音效（冷却 500ms）

Tier 距离配置（`src/types/game.ts`）：

- SEVERED：`min 20 / max 80`
- NASCENT：`min 30 / max 150`
- STABLE：`min 30 / max 250`
- DEEP：`min 30 / max Infinity`
- ASCENSION：`min 30 / max Infinity`

### 3.1 拉回/推开算法（As-Is）

距离超出 `maxDistance`：

- 计算两者连线角度
- `pullStrength = (distance - maxDistance) * 0.05`
- 对双方速度施加相反方向的加速度，使其靠近

距离小于 `minDistance`：

- `pushStrength = (minDistance - distance) * 0.1`
- 对双方速度施加相反方向，使其分离

> 设计含义：这是“软物理+硬边界”的混合，不是严格引力模拟，但可控、可读。

## 4. 碎片（Fragment）生命周期（As-Is）

状态字段：

- `isActive`：是否被点亮
- `isCollected`：是否被收集（收集后不渲染）

规则：

- **激活**：碎片到 Celu 距离 < 100（且满足“功能范围”条件）
- **收集**：碎片已激活 且 到 Ak 距离 < 25

### 4.1 “功能范围”条件（As-Is）

当前实现里，“是否允许 Celu 激活碎片”取决于：

- `isWithinLimit = distance <= maxDistance`（或 `maxDistance` 为 Infinity）
- 以及额外放行：`prev.linkTier === 'DEEP' || 'ASCENSION'`

由于 DEEP/ASCENSION 的 `maxDistance = Infinity`，该放行逻辑在现状下等价于冗余，但也暗示了设计意图：高 Tier 可以“无视断联限制”。

> To-Be（已澄清口径）：后续不再用 `maxDistance` 直接 gate 能力，而是引入：
> - **连接断开（引力线消失）**：`distance > linkBreakDistance` → BROKEN
> - **主体性（能力可用性）**：由 `agencyState` 决定（NASCENT 断开即失能；STABLE 断开后维持 10s；DEEP 不受距离影响且双方共享能力；ASCENSION 重叠成光源吸引碎片）
> - **物理推/拉**：`minDistance/maxDistance` 继续只负责“手感张力”，不直接代表能力是否可用

## 5. Tier 与进度（As-Is）

Energy 计数方式：

- `energy = 已收集碎片数量`

Tier 计算：

- 0：SEVERED
- 1–3：NASCENT
- 4–6：STABLE
- 7–9：DEEP
- 10+：ASCENSION

Tier 影响（玩法层）：

- `maxDistance` 增大直至无穷（DEEP 起自由度显著提升）
- ASCENSION 进入“自动吸附/自动收集”倾向（见下节）

> To-Be（已澄清口径）：
> - **SEVERED**：主体性缺失，并存在失败判定
> - **NASCENT / STABLE / DEEP**：距离拉远后，引力线断开/消失（BROKEN）
> - **NASCENT**：断开即失去各自功能（但游戏继续；提示必须重连）
> - **STABLE**：断开后功能维持 10s；倒计时结束失去现有功能（文案：10 秒后将失去现有功能）
> - **DEEP**：双方共享能力：现在都可以探测和收集（即使断开）
> - **ASCENSION**：两者重叠后成为光源，吸引碎片

> To-Be：本项目后续的“关卡化/叙事化”核心，不是单纯调大 `maxDistance`，而是让 **距离决定主体性（功能可用性）**。  
> 详见：`docs/systems/link_tiers.md`

## 6. ASCENSION 自动收集（As-Is）

当 `prev.linkTier === 'ASCENSION'`：

- 计算碎片到质心距离 `distToCenter`
- 若 `distToCenter < 200`：碎片每帧向质心移动（速度 ~3）
  - 同时强制 `isActive = true`
  - 若 `distToCenter < 30`：标记收集

> 设计含义：把“协作精度”逐渐变成“庆典式回收”，作为阶段性爽点与收束候选。

## 7. 胜负与局结构（现状缺口）

现状：

- 没有 `isPlaying = false` 的触发路径（字段存在但未使用）
- 没有失败条件/重开/计分

TODO（建议优先级高）：

- **选择一种局结构**：
  - 终点：Energy 达 10 结束并结算
  - 失败：断联/坍缩触发惩罚与重置
  - 评分：以时间/碰撞/拉回次数作为表现指标

## 8. STABLE coherence（现状缺口 → 已定规格）

代码存在：

- `GameState.coherenceTimer`
- `LINK_TIER_CONFIG.STABLE.hasCoherence/coherenceDuration=10000`
- UI 文案（旧）写了 “10s coherence buffer”（建议更新为：**相干 10s：10 秒后将失去现有功能。**）

但逻辑尚未实现。

To-Be（已澄清口径）：

- 触发：当连接断开（引力线消失 / `linkState = BROKEN`）
- 规则：**功能仍可维持 10s**；倒计时结束 → **失去现有功能**（需要重连）
- 约束：coherence **只缓冲功能，不缓冲物理拉回/推开**
- UI 文案（简化）：**相干 10s：10 秒后将失去现有功能。**

完整机制规格与状态机见：`docs/systems/link_tiers.md`


