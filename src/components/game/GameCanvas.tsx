import { useMemo, useCallback, useEffect } from 'react';
import { useGameLoop, GameEvent } from '@/hooks/useGameLoop';
import { getDistance } from '@/types/game';
import { useGameAudio } from '@/contexts/AudioContext';
import { useCamera } from '@/hooks/useCamera';
import orbitsMusic from '@/assets/audio/OrbitsMusic.wav';
import StarField from './StarField';
import Entity from './Entity';
import GravityLink from './GravityLink';
import Fragment from './Fragment';
import GameUI from './GameUI';

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
  
  const gameState = useGameLoop({ onEvent: handleGameEvent });
  
  const distance = useMemo(
    () => getDistance(gameState.celu.position, gameState.ak.position),
    [gameState.celu.position, gameState.ak.position]
  );
  
  // Use new camera system with bounding box following and dynamic scaling
  const camera = useCamera(
    gameState.celu.position,
    gameState.ak.position
  );
  
  return (
    <div className="relative w-full h-full overflow-hidden cosmic-void">
      {/* Star field background */}
      <StarField 
        centerOfMass={gameState.centerOfMass}
        linkTier={gameState.linkTier}
        energy={gameState.energy}
      />
      
      {/* Game world container - follows bounding box with dynamic scaling */}
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
      />
    </div>
  );
}
