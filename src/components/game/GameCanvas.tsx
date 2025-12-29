import { useMemo } from 'react';
import { useGameLoop } from '@/hooks/useGameLoop';
import { getDistance } from '@/types/game';
import StarField from './StarField';
import Entity from './Entity';
import GravityLink from './GravityLink';
import Fragment from './Fragment';
import GameUI from './GameUI';

export default function GameCanvas() {
  const gameState = useGameLoop();
  
  const distance = useMemo(
    () => getDistance(gameState.celu.position, gameState.ak.position),
    [gameState.celu.position, gameState.ak.position]
  );
  
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
      />
    </div>
  );
}
