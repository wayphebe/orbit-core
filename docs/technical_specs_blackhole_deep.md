# Technical Specs — DEEP 黑洞关（Black Hole / Accretion Disk Slingshot）

> 范围：在现有 demo（评分式单关 v1 + Link Tiers 机制）之上，新增 **仅在 DEEP 出现** 的黑洞事件关卡（见 `docs/delta_gdd_blackhole_deep.md`）。  
> 目标：Web 运行稳定、加载快、兼容不崩溃；实现尽量模块化、最小改动、可扩展。

---

## 0. 设计约束与不变量（Non-negotiables）

- **不推翻核心循环**：碎片依旧是 `激活 → 收集`；Tier 依旧是 `SEVERED → ASCENSION`。
- **不新增硬失败**：黑洞关不引入死亡/吞噬；失败仍**仅**保留 SEVERED 崩解（见 v1 规则）。
- **只在 DEEP 生效**：黑洞对象与逻辑默认在非 DEEP 完全不启用（CPU/复杂度/主题一致）。
- **最小可读性要求**：黑洞影响圈/捕获圈必须可见；救援关键时刻 Link 必须可见（必要时覆盖 `linkBreakDistance`）。

---

## 1. 与现有系统的接入点（Integration Surface）

现有关键模块（As-Is）：
- `useGameLoop`：单线程 rAF 更新，负责实体移动、距离约束、碎片激活/收集、Tier 进度、ASCENSION 吸附。
- `GameCanvas`：渲染层与音频触发；已有失败/结算对话框与提示。
- `LINK_TIER_CONFIG`：每 Tier 的距离阈值/相干/吸附半径。

新增黑洞关建议以“**可插拔子系统**”接入：

### 1.1 新增子系统：`LevelRuntime`（可选，但推荐）
职责：承载“关卡脚本 + 事件状态”，让后续关卡也能复用。
- **输入**：`GameState`（只读）+ 每帧 `dt`
- **输出**：`overrides`（参数覆盖）+ `events`（只读事件流）+ `uiHints`（提示请求）

### 1.2 新增子系统：`BlackHoleSystem`（本关核心）
职责：黑洞对象状态机、向心力/锁轨、张力（tension）累积、释放（甩出）。
- **输入**：两角色 `position/velocity`、Link 距离、`dt`、关卡配置参数
- **输出**：
  - 对角色速度/位置的“增量”建议（加速度/冲量）
  - 黑洞状态（ACTIVE/CAPTURED/…）
  - 事件（Captured/Released/…）
  - HUD 数据（tension 0–1）

### 1.3 对现有 demo 的最小改动清单
- **GameState** 增量字段（见第 3 节）
- **事件总线** 扩展（见第 2 节）
- **渲染**：新增 `BlackHole` 组件（仅视觉：盘/圈/粒子），+ 可选 HUD（tension 条）
- **Audio**：新增 1–2 个 SFX（可选；可先复用现有 collect/broke）

---

## 2. 接口与事件清单（API / Events）

### 2.1 事件总线（EventBus）基本形态
目标：**只读、边沿触发、可去重**。  
推荐事件载荷统一结构：

- `type`: string
- `t`: number（时间戳 ms）
- `payload`: object（小对象，避免塞入大数组）

### 2.2 黑洞关事件清单（必须/可选）

#### 必须（MVP）
- **`BlackHoleSpawned`**
  - payload: `{ pos: Vector2 }`
  - 触发：黑洞进入 ACTIVE 的第一帧

- **`BlackHoleCaptured`**
  - payload: `{ who: 'celu' | 'ak' }`
  - 触发：某玩家首次进入 CAPTURED（边沿）

- **`SlingshotChargeChanged`**
  - payload: `{ tension: number }`（0–1）
  - 触发：tension 每 N ms 变化一次（建议节流 100–200ms）

- **`SlingshotReleased`**
  - payload: `{ who: 'celu' | 'ak', tension: number }`
  - 触发：释放发生（边沿）

#### 可选（提升可读性/调试）
- **`BlackHoleDespawned`**
- **`BlackHoleEjected`**（如果你想把“释放”和“已脱离危险圈”分开）
- **`BlackHoleInfluenceEntered/Exited`**（用于提示“进入影响圈”）

### 2.3 UI/提示接口（面向 GameCanvas）
黑洞系统不直接渲染 Toast/Modal；只发“提示请求”：

- `UiHintRequest`：
  - `{ id: string, text: string, kind: 'toast' | 'hint', ttlMs?: number, once?: boolean }`
  - 例如：
    - 捕获第一次：`别怕，你不会消失。让同伴在外圈加速，用引力线把你甩出去。`
    - 释放：`重力助推！`

**稳定性要求**：`id` 用于去重；避免每帧刷提示导致性能/可用性问题。

### 2.4 参数覆盖接口（Overrides）
黑洞关需要在事件窗口内临时覆盖一部分参数，保持“线=救援工具”可读：

- `Overrides`（partial）：
  - `linkBreakDistance?: number`（推荐在黑洞关期间设为 `Infinity`）
  - `maxDistancePullScale?: number`（可选：降低原有拉回强度，避免和黑洞向心力打架）
  - `spawnPolicy?: SpawnPolicyOverride`（可选：黑洞边缘碎片奖励）

覆盖的作用域：**仅黑洞关运行期间**，退出黑洞事件必须还原。

---

## 2.5 已确认口径（MVP Freeze）

- **触发方式**：进入 `DEEP` 后黑洞事件必出一次（非随机）。
- **出现时机**：进入 `DEEP` 后延迟 `spawnDelayMs = 10000` 生成黑洞（给玩家 10s 适应）。
- **生成位置**：在 `centerOfMass` 附近生成（小范围随机偏移；推荐 `spawnJitterRadius = 120–220px`）。
- **完成条件**：`rescues >= 2` 事件完成（不绑定奖励）。
- **Overrides（强制）**：
  - `linkBreakDistance = Infinity`
  - **作用域**：黑洞事件窗口（从 `BlackHoleSpawned` 到 `BlackHoleDespawned`），退出后必须还原原 Tier 配置。
- **拉回覆盖（体验优先）**：
  - 推荐新增 override：`maxDistancePullScale = 0`（事件窗口内禁用“超距拉回”，避免与黑洞向心力打架；保留 `minDistance` 推开防抖）。
- **捕获限制**：同一时间最多 1 名玩家 CAPTURED（禁止双捕获）。第二名玩家进入捕获圈时应被推离/弹出到外圈。
- **控制口径**：CAPTURED 允许轻微径向挣扎 + 切向微调。
- **体验指标**：30–60 秒内可完成一次救援（据此设定 `tensionRate / speedThreshold / distanceThreshold / ejectImpulse`）。
- **资源范围（v1）**：不新增救援奖励、不新增音效；贴图使用 `src/assets/black_hole.png`。

---

## 3. 数据结构定义（Data Structures）

> 原则：**小而稳**，避免把大数组塞入 state；每帧只更新少量数值，渲染按需订阅。

### 3.1 基础类型（沿用）
- `Vector2 { x: number, y: number }`

### 3.2 黑洞对象状态

```ts
type BlackHolePhase = 'INACTIVE' | 'ACTIVE' | 'CAPTURED' | 'EJECTING' | 'COOLDOWN';

type CapturedWho = 'celu' | 'ak' | null;

interface BlackHoleState {
  phase: BlackHolePhase;
  position: Vector2;
  captured: CapturedWho;
  // tension: 0..1, accumulates while rescue conditions are met
  tension: number;
  // optional cooldown to prevent immediate re-capture loops
  cooldownMs: number;
}
```

> 说明：如果你不想新增 `EJECTING/COOLDOWN`，MVP 也可以只做 `ACTIVE/CAPTURED`，但建议至少有一个短 cooldown（提升体验稳定性）。

### 3.3 黑洞参数（关卡配置）

```ts
interface BlackHoleConfig {
  // field radii (px)
  influenceRadius: number;
  captureRadius: number;
  safeRadius: number; // after ejection, consider player "safe" once outside

  // force model (not real physics; tuned for feel)
  pullStrength: number; // base acceleration scale
  pullClamp: number;    // max acceleration per frame

  // accretion disk behavior
  diskInnerRadius: number;
  diskOuterRadius: number;
  captureAngularSpeed: number; // baseline angular speed
  captureControlScale: number; // how much player input can affect tangential speed

  // slingshot thresholds
  speedThreshold: number;     // outer player speed needed
  distanceThreshold: number;  // link distance needed
  tensionRate: number;        // per second
  ejectImpulse: number;       // impulse magnitude
  ejectConeDeg?: number;      // optional: constrain ejection direction

  // UX safety
  rescueMinTimeMs?: number;   // optional: minimum time in CAPTURED before release can happen
  cooldownMs?: number;        // optional: after ejection
}
```

### 3.4 关卡运行态（面向脚本）

```ts
interface DeepBlackHoleRuntime {
  enabled: boolean;          // true only when tier is DEEP and level is selected
  overrides: Overrides;      // linkBreakDistance = Infinity etc.
  blackHole: BlackHoleState; // current black hole state
  rescues: number;           // counter for objectives (e.g., 2 rescues)
}
```

---

## 4. 关键逻辑口径（Deterministic, Web-friendly）

### 4.1 启用条件
- `enabled = (linkTier === 'DEEP') AND (levelScript selects blackhole event)`
- 非 DEEP：黑洞系统不更新、不渲染、不占用 CPU（除了一个 `if`）。

### 4.2 向心力（Influence）
建议做“渐进 + clamp”的向心力，避免爆速导致数值发散：
- `dir = normalize(bhPos - playerPos)`
- `strength = pullStrength * falloff(dist)`（例如线性/平方反比的简化版本）
- `accel = clamp(strength, 0, pullClamp) * dir`
- `velocity += accel * dt`

**稳定性**：dt 需 clamp（现有 loop 已做），并且对 accel 做 clamp。

### 4.3 捕获（Capture）与锁轨（Accretion Disk）
触发：
- `distToBH < captureRadius` 且 `cooldownMs==0` → 进入 `CAPTURED(who)`

锁轨建议（MVP）：
- 将 CAPTURED 玩家投影到 `[diskInnerRadius, diskOuterRadius]` 的环带上（夹住半径）
- 用一个 `angle`（可以从当前坐标算 `atan2`）驱动角速度旋转
- 输入不完全失效：允许玩家沿切向微调速度（`captureControlScale`）

**体验原则**：CAPTURED 不是惩罚，是“进入救援题”的明确状态切换。

### 4.4 张力累积（Tension Accumulate）
累积条件（MVP，治愈优先）：
- 存在 `CAPTURED`
- OUTER 玩家速度 `> speedThreshold`
- Link 距离 `> distanceThreshold`

计算：
- `tension = clamp01(tension + tensionRate * dtSeconds)`

提示/可视化：
- Link 变亮/变粗（或 HUD 条），同时 `SlingshotChargeChanged` 节流发出。

### 4.5 释放（Slingshot Release）
触发：
- `tension >= 1.0`（可选再加最小捕获时长 `rescueMinTimeMs`）

效果（最小且稳定）：
- 对 CAPTURED 玩家施加一次 `ejectImpulse`（朝“盘外”方向）
- 清空 tension，进入 `COOLDOWN` 若干 ms（避免立刻被再抓）
- `rescues += 1`
- 发 `SlingshotReleased`

> 强烈建议 v1 不做“角度窗口判定”，否则学习成本与挫败会显著上升。

---

## 5. 渲染与资源（Web 性能 / 加载速度）

### 5.1 资源策略
- 黑洞相关纹理/SFX **按需加载**：
  - 默认 bundle 不必立即加载黑洞贴图与音效
  - 第一次进入 DEEP 前预加载（Idle 预取），避免卡顿

### 5.2 渲染实现建议（DOM/SVG 友好）
现有是 DOM + SVG（GravityLink）。黑洞推荐：
- 一个 `BlackHole` 组件渲染：
  - 中心暗核（div + radial-gradient）
  - 吸积盘（旋转渐变 ring，CSS animation）
  - 影响圈/捕获圈（半透明环）
- 避免每帧生成大量粒子 DOM：如果要粒子，做少量（< 20）且复用节点。

### 5.3 性能预算
- 黑洞系统每帧只对两个玩家做力计算 + 少量标量更新（tension/cooldown）。
- 事件发射需节流（尤其 tension tick），避免 React 频繁 setState。

---

## 6. 容错与不崩溃策略（Stability / Compatibility）

- **dt clamp**：必须 clamp（现有已做）；黑洞系统内部不信任 dt。
- **数值 clamp**：速度/加速度/角速度/半径全部 clamp；任何 NaN 立刻回退到安全默认值。
- **软禁用开关**：如果检测到异常（NaN 或爆速），将黑洞系统切回 `INACTIVE` 并清理 overrides（避免整局崩）。
- **事件去重**：Captured/Released 只在边沿触发；UI hint 必须带 id 去重。
- **低端设备降级**：如果 FPS 持续过低，可禁用黑洞粒子与高开销滤镜，只保留盘/圈与基础力学。

---

## 7. 与 v1 评分式单关的关系（兼容性）

- 黑洞关 **不改变** v1 的胜利/失败口径：
  - 失败仍仅 SEVERED（黑洞发生在 DEEP，天然不会触发失败）
  - 结算仍为 Energy>=10 且发生过 Overlap
- 评分稳定度指标（broken/clash/broke）在黑洞关仍有效：
  - 若本关覆盖 `linkBreakDistance=Infinity`，则 brokenTime 将下降（稳定度提高）——这是设计预期：救援关强调“线=工具”，不是“线=惩罚”。

---

## 8. 最小验收清单（Acceptance）

### 8.1 功能验收（MVP）
- 仅在 DEEP 启用黑洞；其它 Tier 完全不出现、不耗性能。
- CAPTURED 不会导致失控/卡死；玩家仍能输入（至少有轻微影响）。
- 外圈玩家能通过加速+拉线让 tension 充满并释放；释放可重复触发 1–2 次。
- Link 在救援过程保持可读（必要时 overrides 生效）。

### 8.2 性能/稳定验收
- 连续运行 5 分钟无 NaN、无崩溃、无明显内存增长。
- 首次进入 DEEP 黑洞事件不卡顿（资源预取或懒加载策略有效）。

---

## 9. Open Items（需提前定，但不阻塞 MVP）
> 更新：下列条目在当前版本已做 MVP Freeze（见 2.5）。

- overrides 范围：v1 强制 `linkBreakDistance = Infinity`；是否额外弱化 `maxDistance` 拉回可作为后续体验调参项。


