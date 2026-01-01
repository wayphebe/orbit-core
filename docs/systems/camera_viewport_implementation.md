# 系统文档：摄像机与视口系统实现（Camera & Viewport Implementation）

> 本文档描述改善后的摄像机与视口系统的具体实现细节、代码结构、API 接口和参数配置。

---

## 1. 系统架构（System Architecture）

### 1.1 组件结构

```
GameCanvas (主组件)
├── StarField (背景层，独立移动)
├── GameWorldContainer (世界容器，应用摄像机变换)
│   ├── GravityLink
│   ├── Fragment[]
│   └── Entity[] (Celu, Ak)
└── GameUI (UI 层，不受摄像机影响)
```

### 1.2 数据流

```
GameState (useGameLoop)
├── celu.position
├── ak.position
└── centerOfMass (计算得出)

    ↓

CameraSystem (useCamera)
├── 计算边界框
├── 计算缩放
└── 计算偏移

    ↓

GameWorldContainer
└── CSS transform (translate + scale)
```

---

## 2. 核心实现（Core Implementation）

### 2.1 摄像机 Hook：`useCamera`

**位置：** `src/hooks/useCamera.ts`（新建）

**功能：**
- 计算摄像机位置和缩放
- 平滑插值跟随
- 响应窗口大小变化

**接口：**
```typescript
interface CameraState {
  offset: Vector2;      // 摄像机偏移（世界坐标）
  scale: number;        // 缩放比例
  targetOffset: Vector2; // 目标偏移（用于插值）
  targetScale: number;   // 目标缩放（用于插值）
}

function useCamera(
  celuPos: Vector2,
  akPos: Vector2,
  config?: CameraConfig
): CameraState
```

**实现逻辑：**
```typescript
// 1. 计算边界框
const boundingBox = {
  minX: Math.min(celuPos.x, akPos.x),
  maxX: Math.max(celuPos.x, akPos.x),
  minY: Math.min(celuPos.y, akPos.y),
  maxY: Math.max(celuPos.y, akPos.y),
};

// 2. 计算边界框中心
const centerX = (boundingBox.minX + boundingBox.maxX) / 2;
const centerY = (boundingBox.minY + boundingBox.maxY) / 2;

// 3. 计算距离
const distance = getDistance(celuPos, akPos);

// 4. 计算缩放
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;
const requiredSize = distance + config.padding * 2;
const scaleX = screenWidth / requiredSize;
const scaleY = screenHeight / requiredSize;
const targetScale = Math.max(
  config.minScale,
  Math.min(config.maxScale, Math.min(scaleX, scaleY))
);

// 5. 计算目标偏移
const targetOffsetX = -centerX * targetScale + screenWidth / 2;
const targetOffsetY = -centerY * targetScale + screenHeight / 2;

// 6. 平滑插值
const currentOffsetX = currentOffset.x + (targetOffsetX - currentOffset.x) * config.lerpFactor;
const currentOffsetY = currentOffset.y + (targetOffsetY - currentOffset.y) * config.lerpFactor;
const currentScale = currentScale + (targetScale - currentScale) * config.lerpFactor;
```

### 2.2 配置参数

**位置：** `src/config/camera.ts`（新建）

```typescript
export const CAMERA_CONFIG = {
  // 边界框边距（像素）
  padding: 150,
  
  // 缩放范围
  minScale: 0.5,    // 最小 50%
  maxScale: 1.0,    // 最大 100%
  
  // 插值系数（0-1，越大响应越快）
  lerpFactor: 0.25,
  
  // 缩放阈值（可选，用于更精细的控制）
  distanceForMinScale: 800,
  distanceForMaxScale: 200,
} as const;
```

### 2.3 GameCanvas 集成

**修改位置：** `src/components/game/GameCanvas.tsx`

**主要改动：**
1. 引入 `useCamera` hook
2. 移除旧的 `viewportOffset` 计算
3. 移除 CSS `transition-transform`
4. 应用新的摄像机变换

**代码示例：**
```typescript
import { useCamera } from '@/hooks/useCamera';

export default function GameCanvas() {
  const gameState = useGameLoop({ onEvent: handleGameEvent });
  
  // 使用新的摄像机系统
  const camera = useCamera(
    gameState.celu.position,
    gameState.ak.position
  );
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      <StarField 
        centerOfMass={gameState.centerOfMass}
        linkTier={gameState.linkTier}
        energy={gameState.energy}
      />
      
      {/* 应用摄像机变换 */}
      <div 
        className="absolute inset-0"
        style={{
          transform: `
            translate(${camera.offset.x}px, ${camera.offset.y}px) 
            scale(${camera.scale})
          `,
          transformOrigin: 'center center',
        }}
      >
        {/* 游戏世界内容 */}
      </div>
      
      <GameUI ... />
    </div>
  );
}
```

---

## 3. 辅助函数（Helper Functions）

### 3.1 边界框计算

**位置：** `src/utils/camera.ts`（新建）

```typescript
export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export function getBoundingBox(a: Vector2, b: Vector2): BoundingBox {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
  };
}
```

### 3.2 缩放计算

```typescript
export function calculateScale(
  distance: number,
  screenWidth: number,
  screenHeight: number,
  padding: number,
  minScale: number,
  maxScale: number
): number {
  const requiredSize = distance + padding * 2;
  const scaleX = screenWidth / requiredSize;
  const scaleY = screenHeight / requiredSize;
  const rawScale = Math.min(scaleX, scaleY);
  
  return Math.max(minScale, Math.min(maxScale, rawScale));
}
```

### 3.3 插值函数

```typescript
export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function lerpVector2(
  current: Vector2,
  target: Vector2,
  factor: number
): Vector2 {
  return {
    x: lerp(current.x, target.x, factor),
    y: lerp(current.y, target.y, factor),
  };
}
```

---

## 4. 性能优化（Performance Optimization）

### 4.1 使用 useMemo 缓存计算

```typescript
const camera = useMemo(() => {
  return calculateCamera(
    gameState.celu.position,
    gameState.ak.position,
    window.innerWidth,
    window.innerHeight
  );
}, [
  gameState.celu.position.x,
  gameState.celu.position.y,
  gameState.ak.position.x,
  gameState.ak.position.y,
]);
```

### 4.2 使用 useRef 存储插值状态

```typescript
const currentOffsetRef = useRef<Vector2>({ x: 0, y: 0 });
const currentScaleRef = useRef<number>(1.0);

// 在 requestAnimationFrame 中更新
useEffect(() => {
  const animate = () => {
    const target = calculateTarget(...);
    
    currentOffsetRef.current = lerpVector2(
      currentOffsetRef.current,
      target.offset,
      CAMERA_CONFIG.lerpFactor
    );
    currentScaleRef.current = lerp(
      currentScaleRef.current,
      target.scale,
      CAMERA_CONFIG.lerpFactor
    );
    
    requestAnimationFrame(animate);
  };
  
  animate();
}, [celuPos, akPos]);
```

### 4.3 防抖窗口大小变化

```typescript
const [windowSize, setWindowSize] = useState({
  width: window.innerWidth,
  height: window.innerHeight,
});

useEffect(() => {
  let timeoutId: number;
  
  const handleResize = () => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 100);
  };
  
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
    clearTimeout(timeoutId);
  };
}, []);
```

---

## 5. 响应式设计（Responsive Design）

### 5.1 移动端适配

```typescript
const CAMERA_CONFIG_MOBILE = {
  ...CAMERA_CONFIG,
  padding: 100,        // 移动端边距更小
  minScale: 0.4,       // 移动端可以更小
  lerpFactor: 0.3,     // 移动端响应更快
};

const isMobile = window.innerWidth < 768;
const config = isMobile ? CAMERA_CONFIG_MOBILE : CAMERA_CONFIG;
```

### 5.2 不同屏幕比例适配

```typescript
const aspectRatio = window.innerWidth / window.innerHeight;

if (aspectRatio > 16 / 9) {
  // 宽屏，可能需要调整 padding
  config.padding = config.padding * 1.2;
} else if (aspectRatio < 4 / 3) {
  // 窄屏，可能需要调整 padding
  config.padding = config.padding * 0.8;
}
```

---

## 6. 调试工具（Debug Tools）

### 6.1 摄像机信息显示

```typescript
// 在开发模式下显示摄像机信息
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-0 left-0 bg-black/50 text-white p-2 text-xs">
    <div>Offset: ({camera.offset.x.toFixed(1)}, {camera.offset.y.toFixed(1)})</div>
    <div>Scale: {camera.scale.toFixed(2)}</div>
    <div>Distance: {getDistance(celuPos, akPos).toFixed(1)}</div>
  </div>
)}
```

### 6.2 边界框可视化

```typescript
// 在开发模式下绘制边界框
{process.env.NODE_ENV === 'development' && (
  <div
    className="absolute border-2 border-yellow-400 border-dashed pointer-events-none"
    style={{
      left: boundingBox.minX,
      top: boundingBox.minY,
      width: boundingBox.width,
      height: boundingBox.height,
      transform: `translate(${camera.offset.x}px, ${camera.offset.y}px) scale(${camera.scale})`,
    }}
  />
)}
```

---

## 7. 测试用例（Test Cases）

### 7.1 单元测试

```typescript
describe('Camera System', () => {
  test('calculates bounding box correctly', () => {
    const box = getBoundingBox(
      { x: 100, y: 100 },
      { x: 200, y: 200 }
    );
    expect(box.centerX).toBe(150);
    expect(box.centerY).toBe(150);
  });
  
  test('calculates scale correctly', () => {
    const scale = calculateScale(500, 1920, 1080, 150, 0.5, 1.0);
    expect(scale).toBeGreaterThanOrEqual(0.5);
    expect(scale).toBeLessThanOrEqual(1.0);
  });
  
  test('lerp interpolates correctly', () => {
    const result = lerp(0, 100, 0.5);
    expect(result).toBe(50);
  });
});
```

### 7.2 集成测试场景

1. **同向移动测试**
   ```typescript
   // 两个玩家同时向右移动
   celuPos = { x: 100, y: 300 };
   akPos = { x: 200, y: 300 };
   // 移动后
   celuPos = { x: 200, y: 300 };
   akPos = { x: 300, y: 300 };
   // 验证：摄像机应该向右移动
   ```

2. **距离变化测试**
   ```typescript
   // 玩家距离从 100 增加到 800
   // 验证：缩放应该从 1.0 减小到接近 0.5
   ```

3. **快速移动测试**
   ```typescript
   // 玩家快速移动
   // 验证：摄像机应该及时跟随，无延迟
   ```

---

## 8. 迁移指南（Migration Guide）

### 8.1 从旧系统迁移

**步骤1：** 创建新的配置和工具文件
- `src/config/camera.ts`
- `src/utils/camera.ts`

**步骤2：** 创建 `useCamera` hook
- `src/hooks/useCamera.ts`

**步骤3：** 修改 `GameCanvas.tsx`
- 移除旧的 `viewportOffset` 计算
- 移除 CSS `transition-transform`
- 引入 `useCamera` hook
- 应用新的变换

**步骤4：** 测试和调优
- 测试各种场景
- 调整配置参数
- 优化性能

### 8.2 回滚方案

如果新系统有问题，可以快速回滚：

```typescript
// 在 GameCanvas.tsx 中
const USE_NEW_CAMERA = false; // 功能开关

const camera = USE_NEW_CAMERA 
  ? useCamera(celuPos, akPos)
  : { offset: oldViewportOffset, scale: 1.0 };
```

---

## 9. API 参考（API Reference）

### 9.1 useCamera Hook

```typescript
function useCamera(
  celuPos: Vector2,
  akPos: Vector2,
  config?: Partial<CameraConfig>
): CameraState

interface CameraState {
  offset: Vector2;        // 当前偏移（插值后）
  scale: number;          // 当前缩放（插值后）
  targetOffset: Vector2;  // 目标偏移（计算得出）
  targetScale: number;    // 目标缩放（计算得出）
  boundingBox: BoundingBox; // 边界框信息
}
```

### 9.2 配置接口

```typescript
interface CameraConfig {
  padding: number;
  minScale: number;
  maxScale: number;
  lerpFactor: number;
  distanceForMinScale?: number;
  distanceForMaxScale?: number;
}
```

---

## 10. 已知问题与限制（Known Issues & Limitations）

### 10.1 已知问题

1. **缩放时的视觉跳跃**
   - 当缩放快速变化时，可能有轻微的视觉跳跃
   - 可以通过更平滑的插值缓解

2. **极端距离的处理**
   - 当距离非常大时，即使最小缩放也可能不够
   - 可能需要额外的边界检查

### 10.2 限制

1. **性能限制**
   - 每帧计算，在低端设备上可能有性能问题
   - 可以通过降低更新频率优化

2. **屏幕尺寸限制**
   - 在非常小的屏幕上，边距可能不够
   - 需要根据屏幕尺寸动态调整

---

## 11. 未来改进（Future Improvements）

1. **预测性跟随**
   - 根据玩家速度预测位置
   - 提前移动摄像机

2. **区域锁定**
   - 在某些区域锁定摄像机
   - 用于特殊关卡

3. **摄像机震动**
   - 碰撞时添加震动效果
   - 增强反馈

4. **视锥剔除**
   - 只渲染视野内的元素
   - 提升性能

