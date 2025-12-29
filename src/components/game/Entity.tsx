import { memo } from 'react';
import { Entity as EntityType, LinkTier } from '@/types/game';

interface EntityProps {
  entity: EntityType;
  type: 'celu' | 'ak';
  linkTier: LinkTier;
  isActive: boolean;
}

const Entity = memo(function Entity({ entity, type, linkTier, isActive }: EntityProps) {
  const isCelu = type === 'celu';
  
  // Determine glow intensity based on tier
  const getGlowIntensity = () => {
    switch (linkTier) {
      case 'SEVERED': return 0.3;
      case 'NASCENT': return 0.5;
      case 'STABLE': return 0.7;
      case 'DEEP': return 0.85;
      case 'ASCENSION': return 1;
      default: return 0.5;
    }
  };
  
  const intensity = getGlowIntensity();
  const isAscension = linkTier === 'ASCENSION';
  
  // Entity colors
  const primaryHue = isCelu ? 185 : 38;
  const primaryColor = `hsl(${primaryHue} 85% ${55 * intensity}%)`;
  const glowColor = `hsl(${primaryHue} 100% ${65 * intensity}%)`;
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: entity.position.x,
        top: entity.position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
      }}
    >
      {/* Outer aura */}
      <div
        className={`absolute rounded-full transition-all duration-300 ${isAscension ? 'animate-divine-aura' : 'animate-breathe'}`}
        style={{
          width: entity.size * 3,
          height: entity.size * 3,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${glowColor}40 0%, ${glowColor}10 40%, transparent 70%)`,
          opacity: isActive ? 1 : 0.4,
        }}
      />
      
      {/* Detection radius indicator (Celu only) */}
      {isCelu && (
        <div
          className="absolute rounded-full border transition-opacity duration-300"
          style={{
            width: 200, // Detection radius * 2
            height: 200,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            borderColor: `${primaryColor}30`,
            borderWidth: 1,
            opacity: isActive ? 0.5 : 0.2,
          }}
        />
      )}
      
      {/* Core glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: entity.size * 1.5,
          height: entity.size * 1.5,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${primaryColor} 0%, ${primaryColor}80 50%, transparent 100%)`,
          boxShadow: `
            0 0 ${15 * intensity}px ${glowColor}80,
            0 0 ${30 * intensity}px ${glowColor}40,
            0 0 ${45 * intensity}px ${glowColor}20
          `,
        }}
      />
      
      {/* Inner core */}
      <div
        className="absolute rounded-full"
        style={{
          width: entity.size,
          height: entity.size,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle at 30% 30%, 
            hsl(${primaryHue} 90% ${80 * intensity}%) 0%, 
            ${primaryColor} 50%, 
            hsl(${primaryHue} 80% ${40 * intensity}%) 100%
          )`,
          boxShadow: `inset 0 0 ${entity.size / 3}px hsl(${primaryHue} 100% 90% / 0.5)`,
        }}
      />
      
      {/* Center highlight */}
      <div
        className="absolute rounded-full"
        style={{
          width: entity.size * 0.3,
          height: entity.size * 0.3,
          left: '50%',
          top: '50%',
          transform: 'translate(-40%, -40%)',
          background: `radial-gradient(circle, hsl(${primaryHue} 100% 95%) 0%, transparent 70%)`,
          opacity: intensity,
        }}
      />
      
      {/* Ascension particles */}
      {isAscension && (
        <>
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: 4,
                height: 4,
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-${entity.size * 1.2}px)`,
                backgroundColor: `hsl(50 100% 70%)`,
                boxShadow: '0 0 6px hsl(50 100% 70%)',
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </>
      )}
      
      {/* Label */}
      <div
        className="absolute font-orbitron text-xs uppercase tracking-widest whitespace-nowrap"
        style={{
          left: '50%',
          top: entity.size * 1.8,
          transform: 'translateX(-50%)',
          color: primaryColor,
          textShadow: `0 0 10px ${glowColor}`,
          opacity: 0.8,
        }}
      >
        {type}
      </div>
    </div>
  );
});

export default Entity;
