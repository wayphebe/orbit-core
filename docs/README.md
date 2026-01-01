# Orbit! 设计文档索引

本目录用于沉淀 **Orbit!** 的游戏设计总文档（GDD）与分系统文档。内容以“**代码现状（As-Is）**”为准，并对“**规划（To-Be）**”用 TODO/占位明确标注，避免把愿望当成实现。

## 快速入口

- **GDD（总览）**：`docs/GDD.md`
- **系统文档**
  - **玩法（核心机制/规则）**：`docs/systems/gameplay.md`
  - **关卡/节奏（目前为无关卡游乐场）**：`docs/systems/levels.md`
  - **数值/平衡**：`docs/systems/balance.md`
  - **世界/地图（相机与空间组织）**：`docs/systems/world_map.md`
  - **UI/UX**：`docs/systems/ui_ux.md`
  - **叙事/世界观**：`docs/systems/narrative.md`
  - **美术（视觉语言/资产规范）**：`docs/systems/art.md`
  - **音乐/音效**：`docs/systems/audio.md`
  - **技术/工具链（实现约束）**：`docs/systems/tech.md`

## 文档约定

- **As-Is**：当前仓库代码/资源里已经存在的行为与数据。
- **To-Be**：设想与缺口（用 `TODO:` 标注），不默认一定会做。
- **术语**：Celu（探测者）、Ak（收集者）、Fragment（能量碎片）、Link（引力链接）、Tier（羁绊层级）。

## 待确认清单（高优先级）

- **局结构**：是否需要明确的胜利/失败/结算？（目前是无限循环）
- **STABLE 的 coherence**：10 秒缓冲到底缓冲“什么”？如何可视化？
- **目标平台**：PC 键盘为主，还是要兼容移动端/手柄？


