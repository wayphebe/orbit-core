/**
 * 摄像机系统配置参数
 * Camera System Configuration
 */

export interface CameraConfig {
  /** 边界框边距（像素），确保玩家不靠近屏幕边缘 */
  padding: number;
  
  /** 最小缩放比例（0-1） */
  minScale: number;
  
  /** 最大缩放比例（0-1） */
  maxScale: number;
  
  /** 插值系数（0-1），越大响应越快 */
  lerpFactor: number;
  
  /** 缩放阈值：距离超过此值时使用最小缩放（可选） */
  distanceForMinScale?: number;
  
  /** 缩放阈值：距离小于此值时使用最大缩放（可选） */
  distanceForMaxScale?: number;
}

export const CAMERA_CONFIG: CameraConfig = {
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

/**
 * 移动端摄像机配置（响应式设计）
 */
export const CAMERA_CONFIG_MOBILE: CameraConfig = {
  ...CAMERA_CONFIG,
  padding: 100,        // 移动端边距更小
  minScale: 0.4,       // 移动端可以更小
  lerpFactor: 0.3,     // 移动端响应更快
};

