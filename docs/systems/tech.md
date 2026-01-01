# 系统文档：技术 / 工具链（Tech）

## 1. 技术栈（As-Is）

- 前端：Vite + React + TypeScript
- UI：Tailwind + shadcn-ui（项目基础设施已在，但游戏 UI 目前是自定义组件）
- 路由：React Router
- 音频：Web Audio API + HTMLAudioElement
- 渲染方式：DOM 绝对定位（非 Canvas/WebGL）

## 2. 游戏循环（As-Is）

- `requestAnimationFrame` 驱动 state 更新（React state）
- 关键状态：两实体的位置/速度、碎片列表、Energy、Tier、质心

风险与注意：

- React state 每帧更新会有性能上限；当前规模（实体少、碎片少）可接受。
- 若未来加入大量实体/粒子/碰撞，可能需要迁移到 Canvas/WebGL 或把循环与渲染解耦。

## 3. 数据结构（As-Is）

- `src/types/game.ts` 定义 `GameState/Entity/Fragment/LinkTier` 与 Tier 配置/阈值函数。

## 4. 可扩展性建议（To-Be / TODO）

- **参数外置**：把 `GAME_CONFIG` 变成可覆盖配置，以支持关卡/模式。
- **事件系统**：把“收集/碰撞/断裂预警”扩展为更通用的游戏事件（用于UI提示、音频、统计）。
- **调试工具**：加入 debug overlay（FPS、距离、Tier、计时、触发次数）。
- **输入抽象**：兼容手柄与移动端（虚拟摇杆/双指手势）。


