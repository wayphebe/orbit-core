/**
 * 摄像机系统工具函数
 * Camera System Utility Functions
 */

import { Vector2 } from '@/types/game';

/**
 * 边界框信息
 */
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

/**
 * 计算两个点的边界框
 */
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

/**
 * 计算缩放比例
 * @param distance 两个玩家之间的距离
 * @param screenWidth 屏幕宽度
 * @param screenHeight 屏幕高度
 * @param padding 边距
 * @param minScale 最小缩放
 * @param maxScale 最大缩放
 */
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

/**
 * 线性插值
 */
export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

/**
 * 向量线性插值
 */
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

