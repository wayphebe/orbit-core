# 系统文档：音乐 / 音效（Audio）

## 1. 音频目标（体验层）

- 用最少的音效让玩家“听见规则”：
  - 过近 = 撞击/压迫
  - 过远 = 断裂/拉扯
  - 收集 = 正反馈
- 让 Tier 的上升有“仪式感”（建议由 BGM 分层或动机音符承载）。

## 2. 现状音频实现（As-Is）

### 2.1 音效资源

位置：`src/assets/audio/`

- `collect.wav` - 收集碎片音效（启用）
- `clash.wav` - 撞击音效（已停用）
- `broke.wav` - 断裂音效（已停用）
- `OrbitsMusic.wav` - 背景音乐（循环播放）

### 2.2 背景音乐（BGM）

- **文件**：`OrbitsMusic.wav`
- **播放方式**：循环播放
- **启动时机**：游戏画布组件挂载时自动启动
- **音量**：0.3（30%）
- **技术**：HTMLAudioElement，支持自动循环

### 2.3 触发点（As-Is）

在游戏循环里触发事件：

- **collect**：任意碎片被收集（播放音效）
- **clash**：两实体距离 < `minDistance`（有冷却，音效已停用）
- **broke**：距离接近 `maxDistance`（0.9，且 maxDistance 非 Infinity，音效已停用）

### 2.4 播放技术

- SFX：Web Audio API（预加载 AudioBuffer）
- BGM：HTMLAudioElement（循环播放，自动启动）

## 3. 缺口与建议（To-Be / TODO）

- **BGM 策略**：
  - 随 Tier 分层（增加乐器/和声）
  - 或随“危险状态”（strain 高）加入噪声/张力音
- **动态混音**：距离越危险，滤波/失真越明显（把规则变成声音）
- **无障碍**：提供音量、静音、以及视觉替代提示（对听障玩家）


