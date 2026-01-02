import { memo, useMemo } from 'react';
import { Vector2, LinkTier, getDistance, LINK_TIER_CONFIG } from '@/types/game';

interface GravityLinkProps {
  celuPos: Vector2;
  akPos: Vector2;
  linkTier: LinkTier;
}

const GravityLink = memo(function GravityLink({ celuPos, akPos, linkTier }: GravityLinkProps) {
  const distance = getDistance(celuPos, akPos);
  const tierConfig = LINK_TIER_CONFIG[linkTier];
  const isBroken = distance > tierConfig.linkBreakDistance;
  
  // Calculate strain (how close to max distance)
  const strain = tierConfig.maxDistance === Infinity 
    ? 0 
    : Math.min(1, distance / tierConfig.maxDistance);
  
  // Calculate collapse warning (how close to min distance)
  const isNearCollapse = distance < tierConfig.minDistance * 1.5;
  
  // Link appearance based on tier
  const getLinkStyle = () => {
    switch (linkTier) {
      case 'SEVERED':
        return {
          color: 'hsl(0 70% 50%)',
          width: 2,
          dashArray: '4 8',
          opacity: 0.5 + Math.random() * 0.3, // Flickering
          glow: '0 0 5px hsl(0 70% 50%)',
        };
      case 'NASCENT':
        return {
          color: 'hsl(200 60% 45%)',
          width: 2,
          dashArray: '0',
          opacity: 0.6,
          glow: '0 0 8px hsl(200 60% 45%)',
        };
      case 'STABLE':
        return {
          color: 'hsl(220 70% 55%)',
          width: 3,
          dashArray: '0',
          opacity: 0.75,
          glow: '0 0 12px hsl(220 70% 55%)',
        };
      case 'DEEP':
        return {
          color: 'hsl(45 90% 55%)',
          width: 4,
          dashArray: '0',
          opacity: 0.9,
          glow: '0 0 20px hsl(45 90% 55% / 0.6)',
        };
      case 'ASCENSION':
        return {
          color: 'hsl(50 100% 70%)',
          width: 5,
          dashArray: '0',
          opacity: 1,
          glow: '0 0 30px hsl(50 100% 70% / 0.8)',
        };
      default:
        return {
          color: 'hsl(200 50% 50%)',
          width: 2,
          dashArray: '0',
          opacity: 0.5,
          glow: 'none',
        };
    }
  };
  
  const style = getLinkStyle();
  
  // Calculate control point for curved line (adds organic feel)
  const midX = (celuPos.x + akPos.x) / 2;
  const midY = (celuPos.y + akPos.y) / 2;
  const perpX = -(akPos.y - celuPos.y) * 0.1 * (1 - strain);
  const perpY = (akPos.x - celuPos.x) * 0.1 * (1 - strain);
  
  // Generate flowing particles along the link
  const particles = useMemo(() => {
    if (linkTier === 'SEVERED' || isBroken) return [];
    const count = linkTier === 'ASCENSION' ? 8 : linkTier === 'DEEP' ? 5 : 3;
    return Array.from({ length: count }, (_, i) => ({
      offset: i / count,
      size: 3 + (linkTier === 'ASCENSION' ? 2 : 0),
      delay: i * 0.2,
    }));
  }, [isBroken, linkTier]);
  
  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 5 }}
    >
      <defs>
        {/* Gradient for link color */}
        <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(185 85% 55%)" />
          <stop offset="50%" stopColor={style.color} />
          <stop offset="100%" stopColor="hsl(38 95% 55%)" />
        </linearGradient>
        
        {/* Glow filter */}
        <filter id="linkGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Strain warning filter */}
        <filter id="strainGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0.3
                    0 0.3 0 0 0
                    0 0 0.3 0 0
                    0 0 0 1 0"
          />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Main link line */}
      <path
        d={`M ${celuPos.x} ${celuPos.y} Q ${midX + perpX} ${midY + perpY} ${akPos.x} ${akPos.y}`}
        fill="none"
        stroke="url(#linkGradient)"
        strokeWidth={style.width * (1 - strain * 0.3)}
        strokeDasharray={style.dashArray}
        strokeLinecap="round"
        opacity={isBroken ? 0 : style.opacity * (1 - strain * 0.4)}
        filter={strain > 0.8 ? 'url(#strainGlow)' : 'url(#linkGlow)'}
        className={isNearCollapse ? 'animate-collapse-shake' : ''}
      />
      
      {/* Energy flow particles */}
      {particles.map((particle, i) => {
        const t = (particle.offset + Date.now() / 2000) % 1;
        const x = celuPos.x + (akPos.x - celuPos.x) * t;
        const y = celuPos.y + (akPos.y - celuPos.y) * t;
        
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={particle.size}
            fill={style.color}
            opacity={0.8}
            filter="url(#linkGlow)"
          >
            <animate
              attributeName="opacity"
              values="0.4;1;0.4"
              dur="1.5s"
              begin={`${particle.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}
      
      {/* Center of mass indicator */}
      <circle
        cx={midX}
        cy={midY}
        r={6}
        fill="none"
        stroke={style.color}
        strokeWidth={1}
        opacity={0.4}
      />
      
      {/* Strain warning pulse */}
      {strain > 0.7 && (
        <circle
          cx={midX}
          cy={midY}
          r={20}
          fill="none"
          stroke="hsl(0 80% 60%)"
          strokeWidth={2}
          opacity={(strain - 0.7) * 3}
        >
          <animate
            attributeName="r"
            values="10;30;10"
            dur="0.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0;0.8"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </svg>
  );
});

export default GravityLink;
