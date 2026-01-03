export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  position: Vector2;
  velocity: Vector2;
  size: number;
}

export interface Fragment {
  id: string;
  position: Vector2;
  isActive: boolean;
  isCollected: boolean;
}

export type LinkTier = 'SEVERED' | 'NASCENT' | 'STABLE' | 'DEEP' | 'ASCENSION';

export type RunStatus = 'playing' | 'failed' | 'won';

export type BlackHolePhase = 'INACTIVE' | 'ACTIVE' | 'CAPTURED' | 'COOLDOWN';

export type CapturedWho = 'celu' | 'ak' | null;

export interface BlackHoleState {
  phase: BlackHolePhase;
  position: Vector2;
  captured: CapturedWho;
  tension: number; // 0..1
  cooldownMs: number;
  rescues: number;
  capturedAngle?: number; // For orbital motion accumulation
}

export interface BlackHoleConfig {
  influenceRadius: number;
  captureRadius: number;
  safeRadius: number;
  pullStrength: number;
  pullClamp: number;
  diskInnerRadius: number;
  diskOuterRadius: number;
  captureAngularSpeed: number;
  captureControlScale: number;
  speedThreshold: number;
  distanceThreshold: number;
  tensionRate: number; // per second
  ejectImpulse: number;
  cooldownMs: number;
  spawnDelayMs: number;
  spawnJitterRadius: { min: number; max: number };
}

export interface GameOverrides {
  linkBreakDistance?: number | null; // null = use tier default, number = override, Infinity = never break
  maxDistancePullScale?: number; // 0 = disable pull, 1 = normal, >1 = stronger
}

export interface GameState {
  celu: Entity;
  ak: Entity;
  fragments: Fragment[];
  energy: number;
  linkTier: LinkTier;
  coherenceTimer: number | null; // For STABLE tier's 10s buffer
  isPlaying: boolean;
  runStatus: RunStatus;
  runTimeMs: number;
  linkedTimeMs: number;
  brokenTimeMs: number;
  clashCount: number;
  brokeCount: number;
  hasOverlappedOnce: boolean;
  centerOfMass: Vector2;
  blackHole: BlackHoleState | null;
  overrides: GameOverrides; // Runtime overrides (e.g., black hole event window)
}

export interface KeyState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  ArrowUp: boolean;
  ArrowDown: boolean;
  ArrowLeft: boolean;
  ArrowRight: boolean;
}

export const LINK_TIER_CONFIG = {
  SEVERED: {
    maxDistance: 80,
    minDistance: 20,
    // UX defaults (see docs/systems/link_tiers.md)
    linkBreakDistance: 70,
    severedFailureDistance: 95,
    overlapDistance: null,
    hasCoherence: false,
    autoCollect: false,
  },
  NASCENT: {
    maxDistance: 150,
    minDistance: 30,
    linkBreakDistance: 120,
    severedFailureDistance: null,
    overlapDistance: null,
    hasCoherence: false,
    autoCollect: false,
  },
  STABLE: {
    maxDistance: 250,
    minDistance: 30,
    linkBreakDistance: 200,
    severedFailureDistance: null,
    overlapDistance: null,
    hasCoherence: true,
    coherenceDuration: 10000, // 10 seconds
    autoCollect: false,
  },
  DEEP: {
    maxDistance: Infinity,
    minDistance: 30,
    linkBreakDistance: 240,
    severedFailureDistance: null,
    overlapDistance: null,
    hasCoherence: false,
    autoCollect: false,
  },
  ASCENSION: {
    maxDistance: Infinity,
    minDistance: 30,
    linkBreakDistance: 240,
    severedFailureDistance: null,
    overlapDistance: 40,
    hasCoherence: false,
    autoCollect: true,
    collectRadius: 200,
  },
} as const;

export function getLinkTier(energy: number): LinkTier {
  if (energy >= 10) return 'ASCENSION';
  if (energy >= 7) return 'DEEP';
  if (energy >= 4) return 'STABLE';
  if (energy >= 1) return 'NASCENT';
  return 'SEVERED';
}

export function getDistance(a: Vector2, b: Vector2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function getCenterOfMass(a: Vector2, b: Vector2): Vector2 {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

// Black hole default config (tuned for 30-60s rescue experience)
export const BLACK_HOLE_CONFIG: BlackHoleConfig = {
  influenceRadius: 300,
  captureRadius: 120,
  safeRadius: 200,
  pullStrength: 0.15,
  pullClamp: 2.0,
  diskInnerRadius: 80,
  diskOuterRadius: 150,
  captureAngularSpeed: 0.08,
  captureControlScale: 0.3,
  speedThreshold: 2.5,
  distanceThreshold: 180,
  tensionRate: 0.4, // per second (2.5s to fill)
  ejectImpulse: 8.0,
  cooldownMs: 2000,
  spawnDelayMs: 10000,
  spawnJitterRadius: { min: 120, max: 220 },
};
