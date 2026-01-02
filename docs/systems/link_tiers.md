# 系统文档：Link Tiers（连接等级 / 主体性机制）

本文件定义 **Link Tier** 的“机制语义”：距离如何影响 **各自功能（主体性）**、如何通过协作完成旅程、以及 Tier 提升带来的物理/视觉/体验暗示变化。

- **定位**：这是“机制规范（Spec）”，用于指导实现与关卡化；并与现有字段保持对齐（见“实现映射”）。
- **原则**：优先让规则“看得见、听得见、感觉得到”，避免复杂数值和隐藏判定破坏 casual + 治愈体验。

---

## 1. 设计命题：主体性 + 协作

游戏不是“两个点一起收集”，而是：

- **每个原子都有自己的功能边界**（Celu 负责激活/照亮，Ak 负责收集/回收）。
- **距离决定主体性是否成立**：拉开不是纯危险，而是“我还能不能做我该做的事”。
- **Tier 是关系阶段**：从依赖（靠近才有功能）到默契（短暂分离仍能维持）到共存（远距离也完整）到升华（成为光源）。

---

## 2. 关键概念（术语）

### 2.1 距离分两层：物理约束 vs 功能可用性

- **物理约束（Link Constraint）**：由 `minDistance`/`maxDistance` 定义。
  - 过近：推开（防坍缩）
  - 过远：拉回（引力约束）
- **功能可用性（Agency / Functional Availability）**：决定 Celu/Ak 的能力是否启用。
  - **Celu 功能**：靠近碎片可“激活/照亮”
  - **Ak 功能**：可收集“已激活”碎片

> 机制意图：**物理约束提供张力**，**功能可用性提供“主体性叙事”**。二者不必完全等价。

### 2.2 连接可见性（Link Visual / “引力线断开”）
你最新的机制口径里，“**引力线是否可见**”不是纯装饰，而是玩家理解关系状态的第一语言：

- **连接可见（LINKED）**：引力线可见（关系“在场”）
- **连接断开（BROKEN）**：引力线消失/断开（关系“暂时不在场”）

关键：**BROKEN 不一定是失败**。它只是一个统一提示：*我们拉开了*。不同 Tier 对 BROKEN 的后果不同（见第 3 节）。

建议引入一个独立阈值（可先与 `functionalDistance` 复用，后期再解耦）：

- `linkBreakDistance`：当 `distance > linkBreakDistance` 时，连接进入 BROKEN（引力线消失）

### 2.3 相干（Coherence）

`STABLE（中级链接）`阶段的核心：当距离离开“功能范围”时，不是立刻失能，而是进入一个 **10s 的相干缓存**：

- 在 10s 内，Celu/Ak 功能依然可用（像“记忆仍未散逸”）。
- 倒计时到 0 后，功能才失效（生命流逝感）。

---

## 3. Tier 机制表（从概念到规格）

> 说明：本表将你提出的概念化描述，拆成“能力规则 + 物理/失败规则 + 反馈规则”。  
> 其中“能量阈值”与现有实现保持一致（0、1–3、4–6、7–9、10+）。

| 收集量（Energy） | Tier（中文） | 主体性/功能规则（Mechanics Change） | 物理/失败规则（Link） | 视觉/音频反馈（建议） | 体验暗示（建议文案语气） |
|---:|---|---|---|---|---|
| 0 | 失联态（SEVERED） | **主体性缺失**：默认不可用（或仅在“紧贴范围”可用）。 | **失败判定**：当 `distance > severedFailureDistance` 即失败/崩解；仍可保留 `minDistance` 推开与 `maxDistance` 拉回作为手感张力。<br/>（备注：SEVERED 下 `linkState= BROKEN` 推荐仅作为“危险预警”，不直接判失败；让玩家还有一次挣扎回拉的机会。） | 引力线断续、虚弱；失败前提示更明确但不刺耳。 | 孤独、脆弱。 |
| 1–3 | 初级链接（NASCENT） | **距离拉远 → 各自功能失效（立即）**：连接断开时，Celu 无法激活，Ak 无法收集；游戏继续。 | **连接断开**：`distance > linkBreakDistance` → BROKEN（引力线消失）。仍保留 `minDistance/maxDistance` 的物理推/拉。 | 断开提示：**连接已断开：靠近重新连接。** | 学习重连。 |
| 4–6 | 中级链接（STABLE） | **断开后功能仍可维持 10s（Coherence）**：进入 BROKEN 后启动 10s 倒计时；倒计时结束 → 失去现有功能。 | **连接断开但不中止游戏**：`distance > linkBreakDistance` → BROKEN（引力线消失）。物理推/拉仍存在（coherence **不缓冲物理**）。 | 文案更直白：**相干 10s：10 秒后将失去现有功能。**（配倒计时） | 用 10s 完成交接。 |
| 7–9 | 深度链接（DEEP） | **能力共享**：无论距离，双方都拥有 **探测 + 收集**（不再受距离影响）。 | **连接仍可断开（视觉语言）**：拉远后引力线消失，但不再造成能力损失；物理推/拉可保留为手感（或仅保留推开）。 | 进入该 Tier 一次性提示：**现在你们都可以探测和收集了。** | 自由与共存。 |
| 10+ | 终极状态（ASCENSION） | **重叠成光源 + 吸引碎片**：当 `distance <= overlapDistance` 触发“合体光源”；碎片向光源/质心吸附并更易收集。 | 引力线可以弱化或替换为光晕/图腾；物理推开可更柔和。 | 光影爆发；音乐进入“庆典层”（可作为结算/收束）。 | 升华。 |

---

## 4. 状态机（建议实现口径）

### 4.1 功能可用性状态：`agencyState`

为了让机制清晰、可测试，建议把“功能可用性”抽象成一个明确状态（概念层，不一定要立刻落代码结构）：

- **ACTIVE**：Celu 可激活碎片，Ak 可收集已激活碎片
- **COHERING**（仅 STABLE）：离开功能范围后，仍 ACTIVE，但伴随倒计时
- **INACTIVE**：功能禁用（两角色的“主体性”暂时失效）

### 4.1.1 连接状态：`linkState`
为了实现“拉远后引力线断开/消失”这一统一语言，建议引入第二个状态：

- **LINKED**：连接可见
- **BROKEN**：连接断开（引力线消失）

触发规则（建议默认）：

- 若 `distance > linkBreakDistance`：`linkState = BROKEN`
- 否则：`linkState = LINKED`

### 4.2 距离触发规则（Spec）

- **SEVERED**
  - **失败判定**：当 `distance > severedFailureDistance` → fail（`linkState = BROKEN` 仅作为预警，不直接 fail）
  - **主体性缺失**：默认 `agencyState = INACTIVE`（可选：仅在“紧贴范围”短暂 ACTIVE）
- **NASCENT**
  - 若 `linkState = LINKED`：`agencyState = ACTIVE`
  - 若 `linkState = BROKEN`：`agencyState = INACTIVE`（立即；游戏继续）
- **STABLE**
  - 若 `linkState = LINKED`：`agencyState = ACTIVE` 且 `coherenceTimer = null`
  - 若 `linkState = BROKEN` 且此前为 LINKED/ACTIVE：
    - `agencyState = COHERING`
    - `coherenceTimer = coherenceDuration`（默认 10s）
  - 若 `linkState = BROKEN` 且处于 COHERING：
    - `coherenceTimer` 递减
    - 若 `coherenceTimer <= 0`：`agencyState = INACTIVE`
- **DEEP / ASCENSION**
  - `agencyState = ACTIVE`（无条件）
  - **DEEP**：能力共享（双方都可探测 + 收集）
  - **ASCENSION**：当 `distance <= overlapDistance` 进入光源态（吸引碎片）

> 关键：`linkBreakDistance` / `functionalDistance` / `maxDistance` 可以是三件事。  
> - `maxDistance`：物理拉回窗口（空间张力）  
> - `linkBreakDistance`：引力线断开阈值（沟通张力）  
> - `functionalDistance`：主体性边界（能力张力；可先与 `linkBreakDistance` 复用）  
> 这让你能在 STABLE 里做到“线断开，但能力还能撑 10s；物理仍拉回”。

---

## 5. UI/反馈规范（以治愈为目标）

### 5.1 UI：相干倒计时（STABLE）

- **出现条件**：`agencyState = COHERING`
- **表现**：
  - 右上角（或 link 附近）显示 `10 → 0` 倒计时
  - 推荐用“生命流逝感”视觉：细线缩短 / 呼吸衰减 / 轻微抖动
- **玩家理解目标**：不用解释也能懂——“我们还能分开一会，但得尽快重聚/完成交接”。

### 5.1.1 UI：断开提示（NASCENT / STABLE / DEEP）
- **出现条件**：`linkState = BROKEN`
- **建议文案**：
  - NASCENT：**连接已断开：靠近重新连接。**
  - STABLE：**相干 10s：10 秒后将失去现有功能。**
  - DEEP：可不提示（或弱提示“连接断开”），避免打扰自由阶段

### 5.1.2 UI：能力共享提示（DEEP）
- **触发**：进入 DEEP 的瞬间（一次性）
- **建议文案**：**共享能力已解锁：现在你们都可以探测和收集了。**

### 5.2 视觉：Link 的阶段语言（与现有实现一致）

- SEVERED：断续、弱、暗
- NASCENT：稳定、冷蓝
- STABLE：脉冲、变暖（从冷到暖=关系升温）
- DEEP：连接可消失，但角色本身更明亮（共存）
- ASCENSION：重叠光源化 + 图腾（文明显现）

### 5.3 音频提示（低压，不惩罚玩家）

- COHERING 倒计时开始：轻微“心跳/钟摆”层
- 倒计时归零（进入 INACTIVE）：更像“呼出一口气/灯熄灭”，避免刺耳失败音
- 回到 ACTIVE：和声回归（让“重聚”听得见）

---

## 6. 实现映射（与当前代码对齐）

### 6.1 现有字段（As-Is）

- `GameState.linkTier`：Tier 阶段
- `GameState.coherenceTimer: number | null`：已预留（目前未使用）
- `LINK_TIER_CONFIG.STABLE.coherenceDuration = 10000`：已预留
- `GAME_CONFIG.celuDetectionRadius / akCollectionRadius`：能力作用半径

### 6.2 现有逻辑雏形（As-Is）

当前 `useGameLoop.ts` 里存在：

- `isWithinLimit = distance <= tierConfig.maxDistance`  
- Celu 激活碎片时会判断 `isWithinLimit`（DEEP/ASCENSION 因 `maxDistance = Infinity` 等价于永远允许）

这说明“**距离影响功能**”已经是系统方向，只差把它升级为你这张表的“主体性规格”。

### 6.3 To-Be：需要新增/明确的参数

为了落地上面的 Spec，建议引入（可先写死、后数据化）：

- `functionalDistance`：主体性边界距离
  - 可默认等于各 Tier 的 `maxDistance`，但建议允许独立配置（尤其 STABLE）
- `severedFunctionalDistance`：失联态的“紧贴范围”（通常 < SEVERED.maxDistance）
- `linkBreakDistance`：引力线断开的距离阈值（建议默认与 `functionalDistance` 相同，后期再解耦）
- `severedFailureDistance`：失联态失败判定阈值（**建议 > `linkBreakDistance`**，形成“断线预警 → 仍可挣扎回拉 → 超距才崩解”的窗口）
- `overlapDistance`：终极状态触发“重叠成光源”的距离阈值

---

## 7. 天文叙事主线（机制解释用，非剧情）

> 目的：给“机制变化”一个可反复引用的天文解释，让 UI 文案与美术主题统一。

- **失联态**：未被引力捕获的漂流体，只有贴近时才“相互点亮”
- **初级链接**：引力捕获后的依赖期——拉开就失能（主体性依附于连接）
- **中级链接**：量子相干窗口——分离后相干仍存，但会散逸（10s）
- **深度链接**：稳定双体系统——距离不再威胁主体性（共存）
- **终极状态**：轨道共振点火——两者成为光源，文明图腾显现（PoL）

---

## 8. 口径确认（已澄清）& 仍需定值项

### 8.1 已确认口径（本版本按此实现）
- **SEVERED**：主体性缺失，并存在失败判定
- **NASCENT**：连接断开（线消失）→ 各自能力立即失效；游戏继续；提示“必须重新连接”
- **STABLE**：连接断开（线消失）→ 能力维持 10s；倒计时结束失去现有功能；文案更直白
- **DEEP**：连接仍可断开（线消失），但双方共享能力：都可探测 + 收集
- **ASCENSION**：两者重叠后成为光源，吸引碎片

### 8.2 仍需定值（建议先写死，后数据化）
1. `severedFailureDistance`（失败阈值）
2. `linkBreakDistance`（引力线断开阈值）
3. `overlapDistance`（重叠成光源阈值）

建议初始值（以“用户体验优先”为目标，先好玩再精调）：

| Tier | `linkBreakDistance` | 说明 |
|---|---:|---|
| SEVERED | 70 | 线更早断开，给玩家“危险前”的可见提示 |
| NASCENT | 120 | 断开即失能 → 需要快速重连 |
| STABLE | 200 | 断开后仍可行动 10s → 做交接 |
| DEEP | 240 | 线可消失但不影响能力（纯视觉语言） |
| ASCENSION | 240 | 可弱化/替换为光晕，先留配置占位 |

- `severedFailureDistance = 95`
- `overlapDistance = 40`（与当前 `minDistance=30` 推开并存时，仍能稳定触发“合体”）


