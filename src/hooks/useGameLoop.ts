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

export function useGameLoop() {
  const [gameState, setGameState] = useState<GameState>(() => ({
    celu: {
      position: { x: 400, y: 300 },
      velocity: { x: 0, y: 0 },
      size: 30,
    },
    ak: {
      position: { x: 500, y: 300 },
      velocity: { x: 0, y: 0 },
      size: 25,
    },
    fragments: [],
    energy: 0,
    linkTier: 'SEVERED',
    coherenceTimer: null,
    isPlaying: true,
    centerOfMass: { x: 450, y: 300 },
  }));

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
      const distance = getDistance(newState.celu.position, newState.ak.position);
      const tierConfig = LINK_TIER_CONFIG[prev.linkTier];

      // Gravitational constraint - pull entities together if too far
      if (distance > tierConfig.maxDistance && tierConfig.maxDistance !== Infinity) {
        const angle = Math.atan2(
          newState.ak.position.y - newState.celu.position.y,
          newState.ak.position.x - newState.celu.position.x
        );
        const pullStrength = (distance - tierConfig.maxDistance) * 0.05;
        
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

      // Check if within functional range
      const isWithinLimit = distance <= tierConfig.maxDistance || tierConfig.maxDistance === Infinity;

      // Update fragments
      newState.fragments = prev.fragments.map((fragment) => {
        if (fragment.isCollected) return fragment;

        const distToCelu = getDistance(fragment.position, newState.celu.position);
        const distToAk = getDistance(fragment.position, newState.ak.position);

        // Celu detection - only works if within link limit or has coherence
        let isActive = fragment.isActive;
        if (isWithinLimit || prev.linkTier === 'DEEP' || prev.linkTier === 'ASCENSION') {
          if (distToCelu < GAME_CONFIG.celuDetectionRadius) {
            isActive = true;
          }
        }

        // Ak collection - only collects activated fragments
        let isCollected = fragment.isCollected;
        if (isActive && distToAk < GAME_CONFIG.akCollectionRadius) {
          isCollected = true;
        }

        // ASCENSION auto-collect
        if (prev.linkTier === 'ASCENSION') {
          const distToCenter = getDistance(fragment.position, newState.centerOfMass);
          if (distToCenter < 200) {
            // Pull towards center
            const angle = Math.atan2(
              newState.centerOfMass.y - fragment.position.y,
              newState.centerOfMass.x - fragment.position.x
            );
            fragment.position.x += Math.cos(angle) * 3;
            fragment.position.y += Math.sin(angle) * 3;
            isActive = true;
            if (distToCenter < 30) {
              isCollected = true;
            }
          }
        }

        return { ...fragment, isActive, isCollected };
      });

      // Count collected energy
      const collectedCount = newState.fragments.filter((f) => f.isCollected).length;
      if (collectedCount !== prev.energy) {
        newState.energy = collectedCount;
        newState.linkTier = getLinkTier(collectedCount);
      }

      // Spawn new fragments
      const now = Date.now();
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
  }, []);

  // Start game loop
  useEffect(() => {
    // Spawn initial fragments
    setGameState((prev) => ({
      ...prev,
      fragments: Array.from({ length: 5 }, () =>
        createFragment(prev.centerOfMass)
      ),
    }));

    animationFrameRef.current = requestAnimationFrame(updateGame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateGame]);

  return gameState;
}
