import { useMemo, useCallback, useEffect, useState } from 'react';
import { useGameLoop, GameEvent } from '@/hooks/useGameLoop';
import { getDistance, LINK_TIER_CONFIG } from '@/types/game';
import { useGameAudio } from '@/contexts/AudioContext';
import orbitsMusic from '@/assets/audio/OrbitsMusic.wav';
import StarField from './StarField';
import Entity from './Entity';
import GravityLink from './GravityLink';
import Fragment from './Fragment';
import GameUI from './GameUI';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function GameCanvas() {
  const { playSfx, startBgm } = useGameAudio();
  
  // Start background music when component mounts
  useEffect(() => {
    startBgm(orbitsMusic, 0.3);
  }, [startBgm]);
  
  const handleGameEvent = useCallback((event: GameEvent) => {
    switch (event) {
      case 'collect':
        playSfx('collect', 0.6);
        break;
      case 'clash':
        // Sound effect disabled
        break;
      case 'broke':
        // Sound effect disabled
        break;
    }
  }, [playSfx]);
  
  const { gameState, restart } = useGameLoop({ onEvent: handleGameEvent });
  
  const distance = useMemo(
    () => getDistance(gameState.celu.position, gameState.ak.position),
    [gameState.celu.position, gameState.ak.position]
  );

  const tierConfig = LINK_TIER_CONFIG[gameState.linkTier];
  const isBroken = distance > tierConfig.linkBreakDistance;

  const [hint, setHint] = useState<string | null>(null);
  const [hasShownDeepHint, setHasShownDeepHint] = useState(false);

  useEffect(() => {
    if (!hasShownDeepHint && gameState.linkTier === 'DEEP') {
      setHasShownDeepHint(true);
      setHint('现在你们都可以探测和收集了。（线消失不等于失败）');
      const t = window.setTimeout(() => setHint(null), 3500);
      return () => window.clearTimeout(t);
    }
  }, [gameState.linkTier, hasShownDeepHint]);

  const computeStability = useCallback(() => {
    const total = Math.max(1, gameState.runTimeMs);
    const brokenRatio = gameState.brokenTimeMs / total;
    const base = 100 * (1 - brokenRatio);
    const penalty = gameState.clashCount * 6 + gameState.brokeCount * 3;
    return Math.max(0, Math.min(100, Math.round(base - penalty)));
  }, [gameState.brokeCount, gameState.brokenTimeMs, gameState.clashCount, gameState.runTimeMs]);

  const stability = computeStability();
  const durationSec = Math.round(gameState.runTimeMs / 1000);
  
  // Calculate viewport offset to follow center of mass
  const viewportOffset = useMemo(() => ({
    x: -gameState.centerOfMass.x + window.innerWidth / 2,
    y: -gameState.centerOfMass.y + window.innerHeight / 2,
  }), [gameState.centerOfMass]);
  
  return (
    <div className="relative w-full h-full overflow-hidden cosmic-void">
      {/* Star field background */}
      <StarField 
        centerOfMass={gameState.centerOfMass}
        linkTier={gameState.linkTier}
        energy={gameState.energy}
      />
      
      {/* Game world container - follows center of mass */}
      <div 
        className="absolute inset-0 transition-transform duration-100"
        style={{
          transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px)`,
        }}
      >
        {/* Gravity link between entities */}
        <GravityLink
          celuPos={gameState.celu.position}
          akPos={gameState.ak.position}
          linkTier={gameState.linkTier}
        />
        
        {/* Energy fragments */}
        {gameState.fragments.map((fragment) => (
          <Fragment key={fragment.id} fragment={fragment} />
        ))}
        
        {/* Entities */}
        <Entity
          entity={gameState.celu}
          type="celu"
          linkTier={gameState.linkTier}
          isActive={true}
        />
        <Entity
          entity={gameState.ak}
          type="ak"
          linkTier={gameState.linkTier}
          isActive={true}
        />
      </div>
      
      {/* UI overlay */}
      <GameUI
        energy={gameState.energy}
        linkTier={gameState.linkTier}
        distance={distance}
        isBroken={isBroken}
        coherenceTimer={gameState.coherenceTimer}
        hint={hint}
      />

      {/* Fail dialog (SEVERED only) */}
      <AlertDialog open={gameState.runStatus === 'failed'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>失联崩解</AlertDialogTitle>
            <AlertDialogDescription>
              你们被迫分离了。保持靠近，重新开始。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={restart}>重新开始</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Win / settlement dialog */}
      <AlertDialog open={gameState.runStatus === 'won'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>升华完成</AlertDialogTitle>
            <AlertDialogDescription>
              本局结算：Collect {gameState.energy}，协作稳定度 {stability}/100，用时 {durationSec}s。
              <div className="mt-2 text-sm text-muted-foreground">
                Broken {(gameState.brokenTimeMs / Math.max(1, gameState.runTimeMs) * 100).toFixed(0)}% · Clash {gameState.clashCount} · Broke {gameState.brokeCount}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => { setHint(null); setHasShownDeepHint(false); restart(); }}>
              再来一次
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
