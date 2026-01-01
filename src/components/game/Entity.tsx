import { memo } from 'react';
import { Entity as EntityType, LinkTier } from '@/types/game';

// Import character textures
import akTexture from '@/assets/ak-texture.png';
import celuTexture from '@/assets/celu-texture.png';

interface EntityProps {
  entity: EntityType;
  type: 'celu' | 'ak';
  linkTier: LinkTier;
  isActive: boolean;
}

const Entity = memo(function Entity({ entity, type, linkTier, isActive }: EntityProps) {
  const isCelu = type === 'celu';
  const texture = isCelu ? celuTexture : akTexture;
  
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
  const primaryHue = isCelu ? 185 : 15;
  const glowColor = `hsl(${primaryHue} 70% ${55 * intensity}%)`;
  
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
            width: 200,
            height: 200,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            borderColor: `${glowColor}30`,
            borderWidth: 1,
            opacity: isActive ? 0.5 : 0.2,
          }}
        />
      )}
      
      {/* Core glow behind texture */}
      <div
        className="absolute rounded-full"
        style={{
          width: entity.size * 1.4,
          height: entity.size * 1.4,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: `
            0 0 ${15 * intensity}px ${glowColor}80,
            0 0 ${30 * intensity}px ${glowColor}40,
            0 0 ${45 * intensity}px ${glowColor}20
          `,
        }}
      />
      
      {/* Character texture */}
      <div
        className="absolute rounded-full overflow-hidden"
        style={{
          width: entity.size * 1.6,
          height: entity.size * 1.6,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <img
          src={texture}
          alt={type}
          className="w-full h-full object-cover"
          style={{
            filter: `brightness(${0.7 + intensity * 0.5}) saturate(${0.8 + intensity * 0.4})`,
          }}
        />
      </div>
      
      {/* Center highlight */}
      <div
        className="absolute rounded-full"
        style={{
          width: entity.size * 0.4,
          height: entity.size * 0.4,
          left: '50%',
          top: '50%',
          transform: 'translate(-35%, -35%)',
          background: `radial-gradient(circle, hsl(0 0% 100% / 0.4) 0%, transparent 70%)`,
          opacity: intensity * 0.6,
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
          color: glowColor,
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
