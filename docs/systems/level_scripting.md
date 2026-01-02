# 系统文档：关卡脚本方案（Level Scripting Spec）

> 目标：在**改动最小化**的前提下，把当前“游乐场原型”关卡化为章节体验。  
> 方法：新增一个**声明式关卡定义 + 事件驱动脚本**层，不引入复杂引擎、不重写现有循环。

---

## 0. 设计前提（与现有机制对齐）

### 0.1 核心语义（三条轴）
- **物理约束（手感）**：`minDistance / maxDistance` 只负责推开/拉回与张力音效。
- **连接可见性（沟通）**：`linkBreakDistance` 决定引力线何时断开/消失（`LINKED/BROKEN`）。
- **主体性/能力（叙事）**：随 Tier 改变（见 `docs/systems/link_tiers.md`）。

### 0.2 Tier 机制（本方案的关卡主线）
- **SEVERED**：主体性缺失；存在失败判定（`severedFailureDistance`）。
- **NASCENT**：断开（线消失）→ 各自功能失效；游戏继续；提示必须重新连接。
- **STABLE**：断开（线消失）→ 功能仍可维持 10s；倒计时结束失能；文案简化。
- **DEEP**：线仍可消失，但双方共享能力（都可探测 + 收集）。
- **ASCENSION**：两者**重叠**后成为光源，吸引碎片（`overlapDistance`）。

### 0.3 初始体验优先的阈值默认值（可在关卡覆盖）
- `linkBreakDistance`：SEVERED 70 / NASCENT 120 / STABLE 200 / DEEP 240 / ASCENSION 240
- `severedFailureDistance`：95
- `overlapDistance`：40

---

## 1. 关卡化总目标（当前：评分式单关 v1；未来：章节式）

### 1.1 当前里程碑：评分式单关（v1）
目的：先把核心机制跑成“可反复挑战、可结算、可复盘”的单局版本，再把内容拆成章节关卡。

- **胜利条件（结算触发）**：`Energy >= 10` 且 **曾触发过合体**（`OverlapStarted` 至少一次）→ 结算
- **失败条件**：只保留 **SEVERED** 失败（`distance > severedFailureDistance`）
- **失败后流程**：失败文案提示 → **用户确认** → **全局重置并重开**
- **全局重置范围**：
  - `energy=0`、`linkTier=SEVERED`
  - 碎片清空并按开局策略重生
  - 角色位置/速度重置
  - 脚本 `flags/counters/timers` 重置
- **计分口径（v1）**：只做两项，保持清晰
  - **Collect Count**：本局收集数（通常等同 Energy）
  - **协作稳定度（Co-op Stability）**：反映“保持连接/避免危险”的质量
    - 推荐指标：`timeBroken/timeTotal`、`timeLinked/timeTotal`、`clashCount`、`brokeCount`
    - 展示为 **0–100**（避免复杂解释）

> 注：评分式单关不否定章节式；它是“先把系统跑稳、再做内容”的最小可发布路径。

### 1.2 体验曲线（5 关 / 约 6–12 分钟）
- **第 1 关（SEVERED）**：学会“靠近才能成为我们”，建立失败的边界感（短、明确）。
- **第 2 关（NASCENT）**：学会“断开会失能，但可以继续”，形成“重连”口令。
- **第 3 关（STABLE）**：学会“断开仍有 10s 窗口”，第一次出现明确策略层。
- **第 4 关（DEEP）**：学会“共享能力”，分工变成并行协作。
- **第 5 关（ASCENSION）**：学会“合体成光源并吸引碎片”，作为庆典式收束与结局。

### 1.3 关卡最小交付（每关必须有）
- **目标**：一句话能说清（玩家不读说明也能懂）。
- **脚本**：只用“事件→动作”的声明式流程表达。
- **提示**：第一次关键事件必有提示（断开、相干开始/归零、共享能力、合体成光源）。
- **验收**：可量化（达到能量/完成动作/触发事件次数）。

---

## 2. 模块化开发方案（最小改动、鲁棒、可扩展）

### 2.1 模块拆分（新增一层，不改核心循环结构）

#### A. `LevelDefinition`（纯数据）
每关一个定义文件（JSON/TS 均可），包含：
- **meta**：关卡名、章节号、目标文案、时长建议
- **overrides**：覆盖参数（如 `entitySpeed/friction/spawn 策略/阈值`）
- **objectives**：目标列表（可多阶段）
- **script**：触发器与动作序列（见 2.2）

#### B. `EventBus`（只读事件流）
由现有 `useGameLoop` 在关键点发出事件（不改变物理/碎片规则本身）：
- Link 事件：`LinkBroken`, `LinkRestored`
- Tier 事件：`TierEntered(SEVERED/NASCENT/...)`
- Coherence 事件：`CoherenceStarted`, `CoherenceTick(t)`, `CoherenceExpired`
- Overlap 事件：`OverlapStarted`, `OverlapEnded`
- Fragment 事件：`FragmentActivated`, `FragmentCollected`
- System 事件：`LevelStarted`, `LevelCompleted`, `LevelFailed`

#### C. `ScriptRunner`（轻量解释器）
读取 `LevelDefinition.script`，订阅事件并执行动作。
- **鲁棒原则**：动作必须幂等；脚本必须可重放（刷新/重开不会卡死）。
- **最小状态**：脚本内部只维护 `flags`、`counters`、`timers`。

#### D. `ObjectiveTracker`
把“关卡完成/失败”从散落逻辑收束到一个地方：
- 只认 `objective` 的条件达成/失败条件触发
- 达成后发 `LevelCompleted` 事件

---

## 2.2 脚本语言（声明式，不写代码也能实现）

### 2.2.1 触发器（Triggers）
最小集合（可覆盖 90% 章节需求）：
- **OnStart**
- **OnTierEntered(tier)**
- **OnEnergyAtLeast(n)**
- **OnLinkBroken(firstOnly?)**
- **OnLinkRestored(firstOnly?)**
- **OnCoherenceStarted**
- **OnCoherenceExpired**
- **OnOverlapStarted**
- **OnOverlapHold(ms)**：重叠持续一定时间
- **OnFragmentCollected(countAtLeast)**
- **OnTimer(ms)**：相对关卡开始的计时
- **OnFail**：失败事件

### 2.2.2 动作（Actions）
最小集合（刻意保持“UI/数据/生成策略”三类）：
- **UI 类**
  - `ShowHint(text, duration?)`
  - `ShowToast(text, severity?)`
  - `SetObjectiveText(text)`
  - `ClearHint()`
- **世界/参数 类**
  - `ApplyOverrides(overrides)` / `ClearOverrides()`
  - `SetSpawnPolicy(policy)`（见 2.3）
  - `SpawnFragments(pattern)`（一次性“布点”）
- **流程 类**
  - `SetFlag(key, value)`
  - `IncCounter(key, by?)`
  - `StartTimer(key, ms)` / `CancelTimer(key)`
  - `CompleteObjective(id)`
  - `FailLevel(reason)`
  - `CompleteLevel()`

### 2.2.3 脚本结构（推荐格式示例）
> 仅作为文档表达用，具体落地可用 JSON/TS。

- 一个关卡由多个 `rules` 组成：
  - `when`: Trigger
  - `if`: 可选条件（flag/counter/tier）
  - `do`: Actions[]
  - `once`: 是否只触发一次

---

## 2.3 碎片与目标的“关卡化”最小扩展点

当前碎片围绕质心随机环带生成（适合关系主题）。关卡化不需要地形，也能成立，关键在“生成策略数据化”。

### 2.3.1 SpawnPolicy（生成策略）
建议支持以下参数（关卡可覆盖）：
- `initialCount`：开局碎片数
- `maxAlive`：未收集上限
- `intervalMs`：刷新间隔
- `ringMin/ringMax`：围绕质心的生成环带半径
- `bias`：朝 Celu/ Ak/ 质心的偏置（用于教学）
- `specialFragments`：特殊碎片脚本化（见 2.3.2）

### 2.3.2 特殊碎片（不引入新系统也能做“关卡题”）
最小做法：给碎片加一个 `tag`（如 `handoff`, `beacon`, `finale`），脚本按 tag 改行为或计数。
- `handoff`：用于 STABLE 教学（要求在断开窗口内完成激活/收集链条）
- `beacon`：用于 DEEP 并行收集（鼓励分散）
- `finale`：用于 ASCENSION 收束（只在合体光源时吸附）

---

## 3. 章节关卡脚本（只写方案，不写代码）

> 说明：每关都给出：目标、参数覆盖、关键脚本规则、关键提示文案、验收标准。

---

## Level 1 —「失联：靠近」

### 目标
**在不崩解的前提下，完成第一次“激活→收集”。**

### 参数覆盖（教学友好）
- SpawnPolicy：`initialCount=3`，`ringMin=120 ringMax=220`（更近、更快形成闭环）
- 可选：`entitySpeed` 稍降（让新手更稳）

### 脚本（核心逻辑）
- OnStart：
  - SetObjectiveText：`靠近彼此，完成第一次收集。`
  - ShowHint：`WASD 控制 Celu（探测），方向键控制 Ak（收集）。`
- OnTierEntered(NASCENT) 或 OnEnergyAtLeast(1)：
  - CompleteObjective(“first_collect”)
  - CompleteLevel()
- OnFail（SEVERED 崩解）：
  - ShowToast：`失联崩解。再试一次：保持靠近。`
  - FailLevel(reason=“severed”)

### 验收
- 平均 30–60s 完成；新手失败不超过 2 次。

---

## Level 2 —「初级：重连」

### 目标
**经历一次“连接断开→失能→重连”，并收集到 Energy=3。**

### 参数覆盖
- SpawnPolicy：`initialCount=5`，`intervalMs=2500`，`ringMin=180 ringMax=420`（更容易拉开）
- `linkBreakDistance` 使用默认（NASCENT=120）

### 脚本
- OnStart：
  - SetObjectiveText：`断开会失去能力。靠近重连，收集到 3。`
- OnLinkBroken(once)：
  - ShowToast：`连接已断开：靠近重新连接。`
- OnLinkRestored(once)：
  - ShowToast：`连接已恢复。继续收集。`
- OnEnergyAtLeast(3)：
  - CompleteLevel()

### 验收
- 玩家能自然形成口令：“断了/靠近/连上了”。

---

## Level 3 —「中级：10 秒相干」

### 目标
**在断开后 10 秒窗口内完成一次关键交接（收集指定碎片或达到计数）。**

### 参数覆盖
- SpawnPolicy：加入 `specialFragments: handoff x2`
  - `handoff` 生成在环带外侧（迫使短暂分离）
- `linkBreakDistance`：STABLE=200（默认）
- coherence：10s（默认）

### 脚本
- OnStart：
  - SetObjectiveText：`断开后仍可行动 10s。用窗口完成交接。`
- OnCoherenceStarted(once)：
  - ShowToast：`相干 10s：10 秒后将失去现有功能。`
- OnCoherenceExpired：
  - ShowToast：`能力已失效：重新连接。`
- 关键目标（两种实现路线，二选一，建议先用 A）
  - A) OnFragmentCollected(tag=handoff, countAtLeast=1)：
    - ShowToast：`交接完成。`
    - CompleteLevel()
  - B) OnEnergyAtLeast(6) 且曾经触发过 CoherenceStarted：
    - CompleteLevel()

### 验收
- 玩家理解“窗口是资源”，会主动计划：谁去点亮、谁去收、什么时候重聚。

---

## Level 4 —「深度：共享能力」

### 目标
**进入 DEEP 后，分头并行完成一次“同时收集”（鼓励分散）。**

### 参数覆盖
- SpawnPolicy：`specialFragments: beacon x6`（分散生成）
- DEEP：能力共享（默认）

### 脚本
- OnTierEntered(DEEP)：
  - ShowToast：`现在你们都可以探测和收集了。`
  - SetObjectiveText：`分头行动：并行收集 3 个碎片。`
- 计数逻辑：
  - OnFragmentCollected(countAtLeast=3)：
    - CompleteLevel()
- 可选提示（避免打扰）：
  - OnLinkBroken：不提示或弱提示（按你在 `link_tiers.md` 的建议）

### 验收
- 玩家会自然“分散”，而不是一直贴着走；并且不会因为线消失误以为失败。

---

## Level 5 —「终极：合体成光」

### 目标
**合体（重叠）触发光源，并通过吸附收束到 Energy=10（或完成 finale 碎片）。**

### 参数覆盖
- `overlapDistance=40`（默认）
- SpawnPolicy：`specialFragments: finale x10`（可选；不做也可直接用普通碎片）
- ASCENSION：吸附半径与速度保持默认（体验爽点）

### 脚本
- OnTierEntered(ASCENSION)：
  - ShowToast：`重叠成光源，吸引碎片。`
  - SetObjectiveText：`合体成光，完成升华。`
- OnOverlapStarted：
  - ShowHint：`保持重叠，让碎片靠近。`
- OnOverlapHold(1000ms)（可选，强化“成光”不是瞬闪）：
  - ShowToast：`点亮成功。`
- 完成条件（推荐 A）
  - A) OnEnergyAtLeast(10) 且曾经触发过 OverlapStarted：
    - CompleteLevel()
  - B) OnFragmentCollected(tag=finale, countAtLeast=10)：
    - CompleteLevel()

### 结尾（收束）
- CompleteLevel() 后进入结算页/字幕/重开（由产品化 UI 决定）

### 验收
- 玩家能主动做“合体”这个动作来触发爽点，而不是被动发生。

---

## 4. 开发工作流（模块化、最小改动）

### 4.1 迭代顺序（强烈建议）
1. **事件流**：补齐 LinkBroken/Restored、TierEntered、OverlapStarted 等事件（只读，不改规则）。
2. **ObjectiveTracker**：先做“完成/失败判定统一出口”，把每关完成条件跑通。
3. **ScriptRunner**：只支持 OnStart/OnEnergy/OnLinkBroken 这 3 个触发器 + ShowToast/SetObjectiveText。
4. 逐关补齐触发器：Coherence、Overlap、特殊碎片 tag。

### 4.2 鲁棒性要求（避免脚本卡死）
- 所有 `once` 规则必须可重置（重开/失败后重置 flags）。
- 所有关键提示都应“边沿触发”（第一次 BROKEN、第一次进入 Tier）。
- 关卡完成条件必须满足“可达”：不能依赖过于精确的距离瞬间。

### 4.3 可扩展点（后续内容化）
在不新增地形/碰撞的情况下，也可以扩展章节难题：
- **环境扰动**：临时覆盖 `friction/entitySpeed`（风暴/潮汐）
- **碎片序列**：tag+脚本强制“先点亮 A 再收 B”
- **评分式目标**：限制 broke/clash 次数、限制用时

---

## 5. 已确认口径（v1）
- **失败后的体验**：失败后显示文案，用户确认后重开
- **INACTIVE 行为**：A 方案（失能时不可激活/不可收集）
- **DEEP 提示强度**：只提示一次（首次进入 DEEP 解释“线消失不等于失败”）
- **ASCENSION 终局**：结算（不做无限续玩庆典态）
- **结构选择**：优先做评分式单关（v1），章节关作为后续内容化路线
- **胜利条件**：`Energy >= 10` 且触发过合体（Overlap）
- **失败条件**：只保留 SEVERED 失败
- **重置范围**：全局重置


