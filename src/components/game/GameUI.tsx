import { memo } from 'react';
import { LinkTier, getDistance, Vector2 } from '@/types/game';

interface GameUIProps {
  energy: number;
  linkTier: LinkTier;
  distance: number;
}

const TIER_LABELS: Record<LinkTier, { name: string; description: string }> = {
  SEVERED: { name: '失联', description: 'Stay close to survive' },
  NASCENT: { name: '初级', description: 'The bond awakens' },
  STABLE: { name: '中级', description: '10s coherence buffer' },
  DEEP: { name: '深度', description: 'Unbreakable connection' },
  ASCENSION: { name: '终极', description: 'Divine resonance' },
};

const TIER_COLORS: Record<LinkTier, string> = {
  SEVERED: 'hsl(0 70% 50%)',
  NASCENT: 'hsl(200 60% 45%)',
  STABLE: 'hsl(220 70% 55%)',
  DEEP: 'hsl(45 90% 55%)',
  ASCENSION: 'hsl(50 100% 70%)',
};

const GameUI = memo(function GameUI({ energy, linkTier, distance }: GameUIProps) {
  const tierInfo = TIER_LABELS[linkTier];
  const tierColor = TIER_COLORS[linkTier];
  
  return (
    <>
      {/* Title & Tier indicator */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
        <h1 
          className="font-orbitron text-3xl font-bold tracking-[0.3em] mb-2"
          style={{
            color: tierColor,
            textShadow: `0 0 20px ${tierColor}80, 0 0 40px ${tierColor}40`,
          }}
        >
          ORBIT!
        </h1>
        <div 
          className="font-orbitron text-sm tracking-widest uppercase opacity-80"
          style={{ color: tierColor }}
        >
          {tierInfo.name}
        </div>
      </div>
      
      {/* Link tier panel */}
      <div className="absolute top-6 right-6 ui-panel p-4 min-w-[180px]">
        <div className="tier-indicator mb-2" style={{ color: tierColor }}>
          Link Status
        </div>
        <div className="font-rajdhani text-lg text-foreground/90 mb-1">
          {tierInfo.description}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Distance:</span>
          <span className="font-mono">{Math.round(distance)}px</span>
        </div>
      </div>
      
      {/* Energy counter */}
      <div className="absolute top-6 left-6 ui-panel p-4">
        <div className="tier-indicator mb-2 text-fragment-active">
          Energy Collected
        </div>
        <div className="flex items-baseline gap-1">
          <span 
            className="font-orbitron text-4xl font-bold"
            style={{ 
              color: tierColor,
              textShadow: `0 0 15px ${tierColor}60`,
            }}
          >
            {energy}
          </span>
          <span className="text-muted-foreground text-sm">/ 10</span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min(100, energy * 10)}%`,
              background: `linear-gradient(90deg, hsl(200 60% 45%), ${tierColor})`,
              boxShadow: `0 0 10px ${tierColor}60`,
            }}
          />
        </div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 ui-panel px-6 py-3">
        <div className="flex gap-8 items-center text-sm">
          <div className="flex items-center gap-2">
            <span className="text-celu font-medium">Celu</span>
            <div className="flex gap-1">
              {['W', 'A', 'S', 'D'].map((key) => (
                <kbd key={key} className="px-2 py-1 bg-muted rounded text-xs font-mono">
                  {key}
                </kbd>
              ))}
            </div>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-ak font-medium">Ak</span>
            <div className="flex gap-1">
              {['↑', '←', '↓', '→'].map((key) => (
                <kbd key={key} className="px-2 py-1 bg-muted rounded text-xs font-mono">
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tier progression guide */}
      <div className="absolute bottom-6 right-6 ui-panel p-4 text-xs">
        <div className="tier-indicator mb-2 text-muted-foreground">Link Evolution</div>
        <div className="space-y-1">
          {Object.entries(TIER_LABELS).map(([tier, info], i) => (
            <div 
              key={tier}
              className="flex items-center gap-2"
              style={{ opacity: tier === linkTier ? 1 : 0.4 }}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: TIER_COLORS[tier as LinkTier] }}
              />
              <span className="font-mono">{i === 0 ? '0' : i === 1 ? '1-3' : i === 2 ? '4-6' : i === 3 ? '7-9' : '10+'}</span>
              <span className="text-muted-foreground">{info.name}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});

export default GameUI;
