# 系统文档：美术（Art）

## 1. 现状视觉风格（As-Is）

- 宇宙虚空底色 + 星云渐变 + 行星贴图 + 星点层
- 两角色使用贴图（`ak-texture.png` / `celu-texture.png`）并叠加发光 aura
- Link 是一条带渐变与发光滤镜的曲线，并附带粒子流

## 2. 颜色体系（As-Is）

- **Celu（冷青）**：探测/发现
- **Ak（暖橙）**：收集/获得
- **Tier 进化**：从红色断裂到金色升华
- **Fragment**：休眠偏灰紫，激活偏亮紫

这些颜色定义在 `src/index.css` 与 `tailwind.config.ts` 的 CSS variables / theme 中。

## 3. 可读性原则（As-Is）

玩家应该能在 1 秒内从画面读出：

- 当前 Tier（颜色/亮度/链接质感）
- 当前风险（链接拉伸/抖动/警示色）
- 当前目标（碎片是否被点亮）

## 4. 资产与命名（As-Is）

资源位置：

- `src/assets/`
  - `ak-texture.png`
  - `celu-texture.png`
  - `planet*.png`
  - `tile*.png`
  - `audio/*.wav`

> TODO：建立资产命名规范（例如 `character_celu_v01.png`、`bg_planet_01.png`），避免后期迭代混乱。

## 5. To-Be（美术可扩展点 / TODO）

- Tier 不是“更亮”就结束：可以在 ASCENSION 加入更明确的形态变化（例如几何外壳、尾迹、共振波纹）。
- 让“过近/过远”风险更可读：边缘扭曲、链接变细断续、角色发光失真等。



