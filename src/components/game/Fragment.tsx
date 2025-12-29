import { memo } from 'react';
import { Fragment as FragmentType } from '@/types/game';

interface FragmentProps {
  fragment: FragmentType;
}

const Fragment = memo(function Fragment({ fragment }: FragmentProps) {
  if (fragment.isCollected) return null;
  
  const baseSize = 16;
  const activeScale = fragment.isActive ? 1.3 : 1;
  
  return (
    <div
      className="absolute pointer-events-none transition-all duration-500"
      style={{
        left: fragment.position.x,
        top: fragment.position.y,
        transform: `translate(-50%, -50%) scale(${activeScale})`,
        zIndex: 3,
      }}
    >
      {/* Outer pulse ring - only when active */}
      {fragment.isActive && (
        <div
          className="absolute rounded-full animate-pulse-glow"
          style={{
            width: baseSize * 4,
            height: baseSize * 4,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, hsl(280 80% 65% / 0.3) 0%, transparent 70%)',
          }}
        />
      )}
      
      {/* Outer glow */}
      <div
        className={`absolute rounded-full transition-all duration-500 ${fragment.isActive ? 'animate-breathe' : ''}`}
        style={{
          width: baseSize * 2.5,
          height: baseSize * 2.5,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: fragment.isActive
            ? 'radial-gradient(circle, hsl(280 80% 65% / 0.6) 0%, hsl(280 70% 55% / 0.2) 50%, transparent 70%)'
            : 'radial-gradient(circle, hsl(260 20% 35% / 0.4) 0%, transparent 70%)',
        }}
      />
      
      {/* Core */}
      <div
        className="absolute rounded-full transition-all duration-500"
        style={{
          width: baseSize,
          height: baseSize,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: fragment.isActive
            ? 'radial-gradient(circle at 30% 30%, hsl(280 90% 80%) 0%, hsl(280 80% 55%) 50%, hsl(280 70% 40%) 100%)'
            : 'radial-gradient(circle at 30% 30%, hsl(260 30% 50%) 0%, hsl(260 20% 35%) 50%, hsl(260 15% 25%) 100%)',
          boxShadow: fragment.isActive
            ? '0 0 15px hsl(280 80% 65%), 0 0 30px hsl(280 80% 65% / 0.5)'
            : '0 0 5px hsl(260 20% 40% / 0.3)',
        }}
      />
      
      {/* Inner highlight */}
      <div
        className="absolute rounded-full transition-opacity duration-500"
        style={{
          width: baseSize * 0.4,
          height: baseSize * 0.4,
          left: '50%',
          top: '50%',
          transform: 'translate(-35%, -35%)',
          background: 'radial-gradient(circle, hsl(280 100% 95%) 0%, transparent 70%)',
          opacity: fragment.isActive ? 1 : 0.3,
        }}
      />
      
      {/* Sparkle particles when active */}
      {fragment.isActive && (
        <>
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: 3,
                height: 3,
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 90 + 45}deg) translateY(-${baseSize}px)`,
                backgroundColor: 'hsl(280 100% 80%)',
                boxShadow: '0 0 4px hsl(280 100% 80%)',
                animationDelay: `${i * 0.25}s`,
                animationDuration: '2s',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
});

export default Fragment;
