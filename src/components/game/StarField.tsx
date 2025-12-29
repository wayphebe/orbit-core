import { memo, useMemo } from 'react';
import { Vector2, LinkTier } from '@/types/game';

interface StarFieldProps {
  centerOfMass: Vector2;
  linkTier: LinkTier;
  energy: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  layer: number; // For parallax
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 0.5 + Math.random() * 2,
    opacity: 0.1 + Math.random() * 0.5,
    delay: Math.random() * 5,
    layer: Math.floor(Math.random() * 3), // 0, 1, 2 for different depths
  }));
}

const StarField = memo(function StarField({ centerOfMass, linkTier, energy }: StarFieldProps) {
  const stars = useMemo(() => generateStars(150), []);
  
  // Calculate brightness based on link tier
  const baseBrightness = useMemo(() => {
    switch (linkTier) {
      case 'SEVERED': return 0.15;
      case 'NASCENT': return 0.3;
      case 'STABLE': return 0.5;
      case 'DEEP': return 0.7;
      case 'ASCENSION': return 1;
      default: return 0.2;
    }
  }, [linkTier]);

  // Parallax offset based on center of mass
  const getParallaxOffset = (layer: number) => {
    const factor = (layer + 1) * 0.02;
    return {
      x: (centerOfMass.x - 450) * factor,
      y: (centerOfMass.y - 300) * factor,
    };
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Nebula background layers */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: baseBrightness * 0.6,
          background: `
            radial-gradient(ellipse 80% 60% at 20% 80%, hsl(280 40% 12% / 0.8) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 20%, hsl(200 50% 10% / 0.6) 0%, transparent 50%),
            radial-gradient(ellipse 100% 50% at 50% 50%, hsl(260 30% 8% / 0.4) 0%, transparent 70%)
          `,
          transform: `translate(${getParallaxOffset(2).x}px, ${getParallaxOffset(2).y}px)`,
        }}
      />

      {/* Star layers */}
      {[0, 1, 2].map((layer) => {
        const offset = getParallaxOffset(layer);
        const layerStars = stars.filter((s) => s.layer === layer);
        
        return (
          <div
            key={layer}
            className="absolute inset-0 transition-transform duration-100"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
          >
            {layerStars.map((star, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size,
                  height: star.size,
                  backgroundColor: linkTier === 'ASCENSION' 
                    ? `hsl(50 80% ${60 + star.opacity * 40}%)`
                    : `hsl(220 20% ${70 + star.opacity * 30}%)`,
                  opacity: star.opacity * baseBrightness,
                  boxShadow: linkTier === 'ASCENSION'
                    ? `0 0 ${star.size * 3}px hsl(50 100% 70% / 0.5)`
                    : `0 0 ${star.size * 2}px hsl(220 50% 80% / 0.3)`,
                  animation: `star-twinkle ${3 + star.delay}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                }}
              />
            ))}
          </div>
        );
      })}

      {/* Ascension light trails */}
      {linkTier === 'ASCENSION' && (
        <div 
          className="absolute inset-0 animate-pulse-glow"
          style={{
            background: `
              radial-gradient(circle at ${(centerOfMass.x / 900) * 100}% ${(centerOfMass.y / 600) * 100}%, 
                hsl(50 100% 70% / 0.15) 0%, 
                transparent 30%
              )
            `,
          }}
        />
      )}

      {/* Energy collection indicators */}
      <div className="absolute bottom-4 left-4 flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-500"
            style={{
              backgroundColor: i < energy 
                ? `hsl(${50 - i * 3} ${80 + i * 2}% 60%)`
                : 'hsl(240 10% 20%)',
              boxShadow: i < energy 
                ? `0 0 8px hsl(${50 - i * 3} 100% 60% / 0.6)`
                : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
});

export default StarField;
