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
