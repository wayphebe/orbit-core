/**
 * 摄像机系统 Hook
 * Camera System Hook
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Vector2 } from '@/types/game';
import { getDistance } from '@/types/game';
import { CAMERA_CONFIG, CAMERA_CONFIG_MOBILE, CameraConfig } from '@/config/camera';
import {
  getBoundingBox,
  calculateScale,
  lerp,
  lerpVector2,
  BoundingBox,
} from '@/utils/camera';

export interface CameraState {
  /** 当前偏移（插值后） */
  offset: Vector2;
  /** 当前缩放（插值后） */
  scale: number;
  /** 目标偏移（计算得出） */
  targetOffset: Vector2;
  /** 目标缩放（计算得出） */
  targetScale: number;
  /** 边界框信息 */
  boundingBox: BoundingBox;
}

/**
 * 检测是否为移动设备
 */
function isMobile(): boolean {
  return window.innerWidth < 768;
}

/**
 * 摄像机 Hook
 * @param celuPos Celu 的位置
 * @param akPos Ak 的位置
 * @param config 可选的配置覆盖
 */
export function useCamera(
  celuPos: Vector2,
  akPos: Vector2,
  config?: Partial<CameraConfig>
): CameraState {
  // 选择配置（移动端或桌面端）
  const baseConfig = useMemo(
    () => isMobile() ? CAMERA_CONFIG_MOBILE : CAMERA_CONFIG,
    []
  );
  // Memoize finalConfig to prevent recreation on every render
  const finalConfig: CameraConfig = useMemo(
    () => ({ ...baseConfig, ...config }),
    [baseConfig, config]
  );
  
  // Store config values in refs for stable access in animation loop
  const configRef = useRef(finalConfig);
  useEffect(() => {
    configRef.current = finalConfig;
  }, [finalConfig]);

  // 窗口大小状态
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // 计算目标摄像机状态
  const calculateTarget = useCallback(
    (celu: Vector2, ak: Vector2, screenWidth: number, screenHeight: number) => {
      const cfg = configRef.current;
      // 1. 计算边界框
      const boundingBox = getBoundingBox(celu, ak);

      // 2. 计算距离
      const distance = getDistance(celu, ak);

      // 3. 计算缩放
      const targetScale = calculateScale(
        distance,
        screenWidth,
        screenHeight,
        cfg.padding,
        cfg.minScale,
        cfg.maxScale
      );

      // 4. 计算目标偏移（将边界框中心移到屏幕中心）
      const targetOffsetX =
        -boundingBox.centerX * targetScale + screenWidth / 2;
      const targetOffsetY =
        -boundingBox.centerY * targetScale + screenHeight / 2;

      return {
        offset: { x: targetOffsetX, y: targetOffsetY },
        scale: targetScale,
        boundingBox,
      };
    },
    []
  );

  // 当前摄像机状态（使用 state 触发重新渲染）
  const [cameraState, setCameraState] = useState<{
    offset: Vector2;
    scale: number;
  }>(() => {
    // 初始化状态
    const cfg = baseConfig;
    const boundingBox = getBoundingBox(celuPos, akPos);
    const distance = getDistance(celuPos, akPos);
    const targetScale = calculateScale(
      distance,
      window.innerWidth,
      window.innerHeight,
      cfg.padding,
      cfg.minScale,
      cfg.maxScale
    );
    const targetOffsetX = -boundingBox.centerX * targetScale + window.innerWidth / 2;
    const targetOffsetY = -boundingBox.centerY * targetScale + window.innerHeight / 2;
    
    return {
      offset: { x: targetOffsetX, y: targetOffsetY },
      scale: targetScale,
    };
  });

  const animationFrameRef = useRef<number>();

  // 处理窗口大小变化（防抖）
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

  // Store lerpFactor in a ref to avoid dependency issues
  const lerpFactorRef = useRef(finalConfig.lerpFactor);
  useEffect(() => {
    lerpFactorRef.current = finalConfig.lerpFactor;
  }, [finalConfig.lerpFactor]);

  // 平滑插值更新
  useEffect(() => {
    const animate = () => {
      const target = calculateTarget(
        celuPos,
        akPos,
        windowSize.width,
        windowSize.height
      );

      // 平滑插值并更新状态
      setCameraState((prev) => ({
        offset: lerpVector2(prev.offset, target.offset, lerpFactorRef.current),
        scale: lerp(prev.scale, target.scale, lerpFactorRef.current),
      }));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // 初始化：立即设置到目标位置（避免初始延迟）
    const initialTarget = calculateTarget(
      celuPos,
      akPos,
      windowSize.width,
      windowSize.height
    );
    setCameraState({
      offset: initialTarget.offset,
      scale: initialTarget.scale,
    });

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [celuPos, akPos, windowSize, calculateTarget]);

  // 计算当前目标状态（用于返回）
  const target = calculateTarget(
    celuPos,
    akPos,
    windowSize.width,
    windowSize.height
  );

  return {
    offset: cameraState.offset,
    scale: cameraState.scale,
    targetOffset: target.offset,
    targetScale: target.scale,
    boundingBox: target.boundingBox,
  };
}

