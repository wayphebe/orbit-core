import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GameState,
  KeyState,
  Fragment,
  getLinkTier,
  getDistance,
  getCenterOfMass,
  LINK_TIER_CONFIG,
  Vector2,
  BlackHoleState,
  BlackHoleConfig,
  BLACK_HOLE_CONFIG,
  CapturedWho,
  GameOverrides,
} from '@/types/game';

const GAME_CONFIG = {
  entitySpeed: 4,
  friction: 0.92,
  celuDetectionRadius: 100,
  akCollectionRadius: 25,
  fragmentSpawnInterval: 3000,
  maxFragments: 12,
  worldWidth: 1920,
  worldHeight: 1080,
};

// UX: give players a brief moment to react before SEVERED can fail
const SEVERED_FAIL_GRACE_MS = 1500;

// Black hole system helpers
function updateBlackHole(
  prev: GameState,
  newState: GameState,
  dt: number,
  config: BlackHoleConfig,
  deepEntryTimeMs: number | null,
  canSpawn: boolean
): BlackHoleState | null {
  const isDeep = prev.linkTier === 'DEEP';

  // Only enable in DEEP
  if (!isDeep) {
    return null;
  }

  // Spawn after delay (Milestone 5: only once per DEEP entry)
  const timeSinceDeep = deepEntryTimeMs !== null ? prev.runTimeMs - deepEntryTimeMs : prev.runTimeMs;
  const shouldSpawn = timeSinceDeep >= config.spawnDelayMs && canSpawn;
  if (!shouldSpawn && !prev.blackHole) {
    return null;
  }

  // Initialize black hole
  let bh: BlackHoleState;
  if (!prev.blackHole) {
    const angle = Math.random() * Math.PI * 2;
    const jitter = config.spawnJitterRadius.min + Math.random() * (config.spawnJitterRadius.max - config.spawnJitterRadius.min);
    bh = {
      phase: 'ACTIVE',
      position: {
        x: prev.centerOfMass.x + Math.cos(angle) * jitter,
        y: prev.centerOfMass.y + Math.sin(angle) * jitter,
      },
      captured: null,
      tension: 0,
      cooldownMs: 0,
      rescues: 0,
      capturedAngle: undefined,
    };
  } else {
    bh = { ...prev.blackHole };
  }

  // Update cooldown
  if (bh.cooldownMs > 0) {
    bh.cooldownMs = Math.max(0, bh.cooldownMs - dt);
    if (bh.cooldownMs === 0 && bh.phase === 'COOLDOWN') {
      bh.phase = 'ACTIVE';
    }
  }

  const dtSeconds = dt / 1000;

  // Calculate distances
  const distCelu = getDistance(newState.celu.position, bh.position);
  const distAk = getDistance(newState.ak.position, bh.position);

  // Apply influence (pull force)
  const applyInfluence = (entity: typeof newState.celu, dist: number) => {
    if (dist < config.influenceRadius && bh.phase !== 'COOLDOWN') {
      const dir = {
        x: (bh.position.x - entity.position.x) / dist,
        y: (bh.position.y - entity.position.y) / dist,
      };
      const falloff = 1 - (dist / config.influenceRadius);
      const strength = config.pullStrength * falloff;
      const accel = Math.min(strength, config.pullClamp);
      entity.velocity.x += dir.x * accel * dtSeconds * 60; // normalize to 60fps
      entity.velocity.y += dir.y * accel * dtSeconds * 60;
    }
  };

  // Prevent dual capture: if one is captured, push the other away from capture radius
  if (bh.captured !== null) {
    const other = bh.captured === 'celu' ? newState.ak : newState.celu;
    const otherDist = bh.captured === 'celu' ? distAk : distCelu;
    if (otherDist < config.captureRadius) {
      const dir = {
        x: (other.position.x - bh.position.x) / otherDist,
        y: (other.position.y - bh.position.y) / otherDist,
      };
      const pushStrength = (config.captureRadius - otherDist) * 0.2;
      other.velocity.x += dir.x * pushStrength;
      other.velocity.y += dir.y * pushStrength;
    }
  }

  // Capture logic
  if (bh.phase === 'ACTIVE' && bh.cooldownMs === 0 && bh.captured === null) {
    if (distCelu < config.captureRadius) {
      bh.phase = 'CAPTURED';
      bh.captured = 'celu';
      bh.capturedAngle = Math.atan2(newState.celu.position.y - bh.position.y, newState.celu.position.x - bh.position.x);
    } else if (distAk < config.captureRadius) {
      bh.phase = 'CAPTURED';
      bh.captured = 'ak';
      bh.capturedAngle = Math.atan2(newState.ak.position.y - bh.position.y, newState.ak.position.x - bh.position.x);
    }
  }

  // Lock to accretion disk (if captured)
  if (bh.phase === 'CAPTURED' && bh.captured !== null && bh.capturedAngle !== undefined) {
    const captured = bh.captured === 'celu' ? newState.celu : newState.ak;
    const dist = bh.captured === 'celu' ? distCelu : distAk;
    
    // Project to disk ring
    const targetRadius = (config.diskInnerRadius + config.diskOuterRadius) / 2;
    const clampedRadius = Math.max(config.diskInnerRadius, Math.min(config.diskOuterRadius, dist));
    
    // Allow slight radial struggle (captureControlScale)
    const radialInput = config.captureControlScale;
    const finalRadius = clampedRadius + (dist - clampedRadius) * radialInput;
    
    // Angular motion (accumulate angle from stored state)
    const angularSpeed = config.captureAngularSpeed;
    bh.capturedAngle = bh.capturedAngle + angularSpeed * dtSeconds;
    
    // Update position to orbit
    captured.position.x = bh.position.x + Math.cos(bh.capturedAngle) * finalRadius;
    captured.position.y = bh.position.y + Math.sin(bh.capturedAngle) * finalRadius;
    
    // Update velocity to match orbital motion (tangential)
    const tangent = { x: -Math.sin(bh.capturedAngle), y: Math.cos(bh.capturedAngle) };
    const speed = finalRadius * angularSpeed;
    captured.velocity.x = tangent.x * speed;
    captured.velocity.y = tangent.y * speed;
  }

  // Tension accumulation (Milestone 3)
  if (bh.phase === 'CAPTURED' && bh.captured !== null) {
    const outer = bh.captured === 'celu' ? newState.ak : newState.celu;
    const outerSpeed = Math.sqrt(outer.velocity.x ** 2 + outer.velocity.y ** 2);
    const linkDist = getDistance(newState.celu.position, newState.ak.position);
    
    if (outerSpeed >= config.speedThreshold && linkDist >= config.distanceThreshold) {
      bh.tension = Math.min(1.0, bh.tension + config.tensionRate * dtSeconds);
    }
    
    // Release (tension full)
    if (bh.tension >= 1.0) {
      const captured = bh.captured === 'celu' ? newState.celu : newState.ak;
      const ejectAngle = Math.atan2(captured.position.y - bh.position.y, captured.position.x - bh.position.x);
      captured.velocity.x += Math.cos(ejectAngle) * config.ejectImpulse;
      captured.velocity.y += Math.sin(ejectAngle) * config.ejectImpulse;
      
      bh.phase = 'COOLDOWN';
      bh.captured = null;
      bh.capturedAngle = undefined;
      bh.tension = 0;
      bh.cooldownMs = config.cooldownMs;
      bh.rescues += 1;
    }
  }

  // Apply influence to both (if not captured)
  if (bh.phase === 'ACTIVE' || (bh.phase === 'CAPTURED' && bh.captured === 'celu')) {
    applyInfluence(newState.ak, distAk);
  }
  if (bh.phase === 'ACTIVE' || (bh.phase === 'CAPTURED' && bh.captured === 'ak')) {
    applyInfluence(newState.celu, distCelu);
  }

  return bh;
}

function createFragment(worldCenter: Vector2): Fragment {
  const angle = Math.random() * Math.PI * 2;
  const distance = 200 + Math.random() * 400;
  return {
    id: `fragment-${Date.now()}-${Math.random()}`,
    position: {
      x: worldCenter.x + Math.cos(angle) * distance,
      y: worldCenter.y + Math.sin(angle) * distance,
    },
    isActive: false,
    isCollected: false,
  };
}

export type GameEvent = 'collect' | 'clash' | 'broke';

interface UseGameLoopOptions {
  onEvent?: (event: GameEvent) => void;
}

export function useGameLoop(options?: UseGameLoopOptions) {
  const { onEvent } = options || {};

  const createInitialState = useCallback((): GameState => {
    // Spawn players within SEVERED failure threshold (and within grace window).
    // Keep them slightly separated so players can immediately see "two entities".
    const celu = {
      position: { x: 400, y: 300 },
      velocity: { x: 0, y: 0 },
      size: 30,
    };

    const ak = {
      // Was x: 500 (distance 100) which can exceed SEVERED.severedFailureDistance (95) and fail instantly.
      position: { x: 485, y: 300 }, // distance 85
      velocity: { x: 0, y: 0 },
      size: 30,
    };

    const base: GameState = {
      celu,
      ak,
      fragments: [],
      energy: 0,
      linkTier: 'SEVERED',
      coherenceTimer: null,
      isPlaying: true,
      runStatus: 'playing',
      runTimeMs: 0,
      linkedTimeMs: 0,
      brokenTimeMs: 0,
      clashCount: 0,
      brokeCount: 0,
      hasOverlappedOnce: false,
      centerOfMass: getCenterOfMass(celu.position, ak.position),
      blackHole: null,
      overrides: {},
    };

    return {
      ...base,
      fragments: Array.from({ length: 5 }, () => createFragment(base.centerOfMass)),
    };
  }, []);

  const [gameState, setGameState] = useState<GameState>(() => createInitialState());

  const keysRef = useRef<KeyState>({
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
  });

  const lastSpawnTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number>();
  const lastClashTimeRef = useRef(0);
  const lastBrokeTimeRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const deepEntryTimeRef = useRef<number | null>(null);
  const blackHoleSpawnedThisDeepRef = useRef(false);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key as keyof KeyState;
      if (key in keysRef.current) {
        keysRef.current[key] = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key as keyof KeyState;
      if (key in keysRef.current) {
        keysRef.current[key] = false;
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main game loop
  const updateGame = useCallback(() => {
    setGameState((prev) => {
      if (!prev.isPlaying) return prev;

      const keys = keysRef.current;
      const newState = { ...prev };

      // Update Celu velocity (WASD)
      let celuAccel = { x: 0, y: 0 };
      if (keys.w) celuAccel.y -= 1;
      if (keys.s) celuAccel.y += 1;
      if (keys.a) celuAccel.x -= 1;
      if (keys.d) celuAccel.x += 1;

      // Update Ak velocity (Arrow keys)
      let akAccel = { x: 0, y: 0 };
      if (keys.ArrowUp) akAccel.y -= 1;
      if (keys.ArrowDown) akAccel.y += 1;
      if (keys.ArrowLeft) akAccel.x -= 1;
      if (keys.ArrowRight) akAccel.x += 1;

      // Normalize and apply acceleration
      const celuMag = Math.sqrt(celuAccel.x ** 2 + celuAccel.y ** 2);
      if (celuMag > 0) {
        celuAccel.x = (celuAccel.x / celuMag) * GAME_CONFIG.entitySpeed;
        celuAccel.y = (celuAccel.y / celuMag) * GAME_CONFIG.entitySpeed;
      }

      const akMag = Math.sqrt(akAccel.x ** 2 + akAccel.y ** 2);
      if (akMag > 0) {
        akAccel.x = (akAccel.x / akMag) * GAME_CONFIG.entitySpeed;
        akAccel.y = (akAccel.y / akMag) * GAME_CONFIG.entitySpeed;
      }

      // Apply velocity
      newState.celu = {
        ...prev.celu,
        velocity: {
          x: (prev.celu.velocity.x + celuAccel.x) * GAME_CONFIG.friction,
          y: (prev.celu.velocity.y + celuAccel.y) * GAME_CONFIG.friction,
        },
        position: {
          x: prev.celu.position.x + prev.celu.velocity.x,
          y: prev.celu.position.y + prev.celu.velocity.y,
        },
      };

      newState.ak = {
        ...prev.ak,
        velocity: {
          x: (prev.ak.velocity.x + akAccel.x) * GAME_CONFIG.friction,
          y: (prev.ak.velocity.y + akAccel.y) * GAME_CONFIG.friction,
        },
        position: {
          x: prev.ak.position.x + prev.ak.velocity.x,
          y: prev.ak.position.y + prev.ak.velocity.y,
        },
      };

      // Calculate distance and link status
      const now = Date.now();
      const dtRaw = now - lastUpdateTimeRef.current;
      const dt = Math.max(0, Math.min(100, dtRaw)); // clamp for tab switching
      lastUpdateTimeRef.current = now;

      const distance = getDistance(newState.celu.position, newState.ak.position);
      const tierConfig = LINK_TIER_CONFIG[prev.linkTier];
      
      // Apply overrides for link break distance (Milestone 4)
      const effectiveLinkBreakDistance = 
        newState.overrides.linkBreakDistance !== undefined && newState.overrides.linkBreakDistance !== null
          ? newState.overrides.linkBreakDistance
          : tierConfig.linkBreakDistance;
      const isBroken = effectiveLinkBreakDistance !== Infinity && distance > effectiveLinkBreakDistance;

      // Run stats (v1)
      newState.runTimeMs = prev.runTimeMs + dt;
      if (isBroken) newState.brokenTimeMs = prev.brokenTimeMs + dt;
      else newState.linkedTimeMs = prev.linkedTimeMs + dt;

      // Track overlap (used for win condition)
      if (tierConfig.overlapDistance !== null && distance <= tierConfig.overlapDistance) {
        newState.hasOverlappedOnce = true;
      }

      // SEVERED: failure threshold (soft, for best UX)
      if (
        prev.linkTier === 'SEVERED' &&
        newState.runTimeMs > SEVERED_FAIL_GRACE_MS &&
        tierConfig.severedFailureDistance !== null &&
        distance > tierConfig.severedFailureDistance
      ) {
        newState.isPlaying = false;
        newState.runStatus = 'failed';
        return newState;
      }

      // Check for collision (entities too close) - play clash sound
      if (distance < tierConfig.minDistance && now - lastClashTimeRef.current > 500) {
        lastClashTimeRef.current = now;
        newState.clashCount = prev.clashCount + 1;
        onEvent?.('clash');
      }

      // Check for link strain (entities at max distance) - play broke sound
      if (distance > tierConfig.maxDistance * 0.9 && tierConfig.maxDistance !== Infinity && now - lastBrokeTimeRef.current > 1000) {
        lastBrokeTimeRef.current = now;
        newState.brokeCount = prev.brokeCount + 1;
        onEvent?.('broke');
      }

      // Gravitational constraint - pull entities together if too far (Milestone 4: respect overrides)
      const pullScale = newState.overrides.maxDistancePullScale !== undefined 
        ? newState.overrides.maxDistancePullScale 
        : 1.0;
      if (pullScale > 0 && distance > tierConfig.maxDistance && tierConfig.maxDistance !== Infinity) {
        const angle = Math.atan2(
          newState.ak.position.y - newState.celu.position.y,
          newState.ak.position.x - newState.celu.position.x
        );
        const pullStrength = (distance - tierConfig.maxDistance) * 0.05 * pullScale;
        
        newState.celu.velocity.x += Math.cos(angle) * pullStrength;
        newState.celu.velocity.y += Math.sin(angle) * pullStrength;
        newState.ak.velocity.x -= Math.cos(angle) * pullStrength;
        newState.ak.velocity.y -= Math.sin(angle) * pullStrength;
      }

      // Prevent collapse - push apart if too close
      if (distance < tierConfig.minDistance) {
        const angle = Math.atan2(
          newState.ak.position.y - newState.celu.position.y,
          newState.ak.position.x - newState.celu.position.x
        );
        const pushStrength = (tierConfig.minDistance - distance) * 0.1;
        
        newState.celu.velocity.x -= Math.cos(angle) * pushStrength;
        newState.celu.velocity.y -= Math.sin(angle) * pushStrength;
        newState.ak.velocity.x += Math.cos(angle) * pushStrength;
        newState.ak.velocity.y += Math.sin(angle) * pushStrength;
      }

      // Update center of mass
      newState.centerOfMass = getCenterOfMass(newState.celu.position, newState.ak.position);

      // Track DEEP entry time (Milestone 5: ensure event only spawns once per DEEP entry)
      if (prev.linkTier !== 'DEEP' && newState.linkTier === 'DEEP') {
        deepEntryTimeRef.current = prev.runTimeMs;
        blackHoleSpawnedThisDeepRef.current = false; // Reset spawn flag on new DEEP entry
      } else if (newState.linkTier !== 'DEEP') {
        deepEntryTimeRef.current = null;
        blackHoleSpawnedThisDeepRef.current = false;
        // Clear overrides when leaving DEEP
        newState.overrides = {};
      }

      // Black hole system (Milestone 1-3)
      const canSpawn = !blackHoleSpawnedThisDeepRef.current;
      newState.blackHole = updateBlackHole(prev, newState, dt, BLACK_HOLE_CONFIG, deepEntryTimeRef.current, canSpawn);
      if (newState.blackHole && !blackHoleSpawnedThisDeepRef.current) {
        blackHoleSpawnedThisDeepRef.current = true;
      }

      // Milestone 4: Apply overrides during black hole event window
      // Milestone 4 & 5: Apply overrides during event, despawn when complete
      if (newState.blackHole) {
        if (newState.blackHole.rescues >= 2) {
          // Milestone 5: Event complete - despawn black hole
          newState.blackHole = null;
          newState.overrides = {};
        } else if (newState.blackHole.phase !== 'INACTIVE') {
          // Milestone 4: Event active - apply overrides
          newState.overrides = {
            linkBreakDistance: Infinity, // Link always visible during rescue
            maxDistancePullScale: 0, // Disable maxDistance pull to avoid force conflicts
          };
        } else {
          // Event inactive: clear overrides
          newState.overrides = {};
        }
      } else {
        // No black hole: clear overrides
        newState.overrides = {};
      }

      // Functional availability (v1)
      let coherenceTimer = prev.coherenceTimer;
      if (prev.linkTier === 'STABLE' && tierConfig.hasCoherence) {
        if (!isBroken) {
          coherenceTimer = null;
        } else if (coherenceTimer === null) {
          coherenceTimer = tierConfig.coherenceDuration ?? 10000;
        } else {
          coherenceTimer = Math.max(0, coherenceTimer - dt);
        }
      } else {
        coherenceTimer = null;
      }
      newState.coherenceTimer = coherenceTimer;

      const hasCoherence = coherenceTimer !== null && coherenceTimer > 0;
      const functionalActive =
        prev.linkTier === 'DEEP' ||
        prev.linkTier === 'ASCENSION' ||
        (prev.linkTier === 'STABLE' ? (!isBroken || hasCoherence) : !isBroken);

      // Update fragments
      let fragmentCollected = false;
      newState.fragments = prev.fragments.map((fragment) => {
        if (fragment.isCollected) return fragment;

        const distToCelu = getDistance(fragment.position, newState.celu.position);
        const distToAk = getDistance(fragment.position, newState.ak.position);

        const sharedAbility = prev.linkTier === 'DEEP' || prev.linkTier === 'ASCENSION';

        // Detection (activation)
        let isActive = fragment.isActive;
        if (functionalActive) {
          const canDetect =
            distToCelu < GAME_CONFIG.celuDetectionRadius ||
            (sharedAbility && distToAk < GAME_CONFIG.celuDetectionRadius);
          if (canDetect) isActive = true;
        }

        // Collection (A方案：失能时不可收集)
        let isCollected = fragment.isCollected;
        if (functionalActive && isActive) {
          const canCollect =
            distToAk < GAME_CONFIG.akCollectionRadius ||
            (sharedAbility && distToCelu < GAME_CONFIG.akCollectionRadius);
          if (canCollect) {
            isCollected = true;
            fragmentCollected = true;
          }
        }

        // ASCENSION auto-collect
        if (prev.linkTier === 'ASCENSION') {
          const isOverlapped =
            tierConfig.overlapDistance !== null && distance <= tierConfig.overlapDistance;

          if (!isOverlapped) {
            return { ...fragment, isActive, isCollected };
          }

          const distToCenter = getDistance(fragment.position, newState.centerOfMass);
          const collectRadius =
            'collectRadius' in tierConfig ? tierConfig.collectRadius : 200;

          if (distToCenter < collectRadius) {
            // Pull towards center
            const angle = Math.atan2(
              newState.centerOfMass.y - fragment.position.y,
              newState.centerOfMass.x - fragment.position.x
            );
            fragment.position.x += Math.cos(angle) * 3;
            fragment.position.y += Math.sin(angle) * 3;
            isActive = true;
            if (distToCenter < 30 && !fragment.isCollected) {
              isCollected = true;
              fragmentCollected = true;
            }
          }
        }

        return { ...fragment, isActive, isCollected };
      });

      // Play collect sound
      if (fragmentCollected) {
        onEvent?.('collect');
      }

      // Count collected energy
      const collectedCount = newState.fragments.filter((f) => f.isCollected).length;
      if (collectedCount !== prev.energy) {
        newState.energy = collectedCount;
        newState.linkTier = getLinkTier(collectedCount);
      }

      // Win condition (v1): Energy >= 10 AND has overlapped at least once
      if (newState.energy >= 10 && newState.hasOverlappedOnce) {
        newState.isPlaying = false;
        newState.runStatus = 'won';
        return newState;
      }

      // Spawn new fragments
      if (
        now - lastSpawnTimeRef.current > GAME_CONFIG.fragmentSpawnInterval &&
        newState.fragments.filter((f) => !f.isCollected).length < GAME_CONFIG.maxFragments
      ) {
        newState.fragments = [
          ...newState.fragments,
          createFragment(newState.centerOfMass),
        ];
        lastSpawnTimeRef.current = now;
      }

      return newState;
    });

    animationFrameRef.current = requestAnimationFrame(updateGame);
  }, [onEvent]);

  // Start game loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateGame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateGame]);

  const restart = useCallback(() => {
    lastUpdateTimeRef.current = Date.now();
    lastSpawnTimeRef.current = Date.now();
    lastClashTimeRef.current = 0;
    lastBrokeTimeRef.current = 0;
    setGameState(createInitialState());
  }, [createInitialState]);

  return { gameState, restart };
}
