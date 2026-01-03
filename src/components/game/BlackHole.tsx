import { memo } from 'react';
import { BlackHoleState, BLACK_HOLE_CONFIG } from '@/types/game';
import blackHoleTexture from '@/assets/black_hole.png';

interface BlackHoleProps {
  blackHole: BlackHoleState;
}

const BlackHole = memo(function BlackHole({ blackHole }: BlackHoleProps) {
  if (!blackHole || blackHole.phase === 'INACTIVE') {
    return null;
  }

  const config = BLACK_HOLE_CONFIG;
  const { position, phase, tension } = blackHole;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 3,
      }}
    >
      {/* Influence ring (outer boundary) */}
      <div
        className="absolute rounded-full border border-opacity-20"
        style={{
          width: config.influenceRadius * 2,
          height: config.influenceRadius * 2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderColor: 'hsl(280 60% 40%)',
          borderWidth: 1,
          opacity: 0.3,
        }}
      />

      {/* Capture ring (inner boundary) */}
      <div
        className="absolute rounded-full border border-opacity-40"
        style={{
          width: config.captureRadius * 2,
          height: config.captureRadius * 2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderColor: 'hsl(0 70% 50%)',
          borderWidth: 2,
          opacity: phase === 'CAPTURED' ? 0.8 : 0.4,
        }}
      />

      {/* Accretion disk (rotating ring) */}
      <div
        className="absolute rounded-full"
        style={{
          width: config.diskOuterRadius * 2,
          height: config.diskOuterRadius * 2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(
            circle,
            transparent ${config.diskInnerRadius}px,
            hsl(280 60% 30% / 0.3) ${config.diskInnerRadius}px,
            hsl(280 60% 40% / 0.5) ${config.diskOuterRadius * 0.7}px,
            transparent ${config.diskOuterRadius}px
          )`,
          animation: phase === 'CAPTURED' ? 'spin 3s linear infinite' : 'none',
        }}
      />

      {/* Core (black hole texture) */}
      <div
        className="absolute rounded-full overflow-hidden"
        style={{
          width: 80,
          height: 80,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundImage: `url(${blackHoleTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6)',
        }}
      />

      {/* Tension indicator (when captured) */}
      {phase === 'CAPTURED' && (
        <div
          className="absolute"
          style={{
            left: '50%',
            top: config.diskOuterRadius + 20,
            transform: 'translateX(-50%)',
            width: 120,
            height: 4,
            background: 'hsl(0 0% 30%)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            className="h-full transition-all duration-100"
            style={{
              width: `${tension * 100}%`,
              background: `linear-gradient(90deg, hsl(200 60% 45%), hsl(50 100% 70%))`,
              boxShadow: `0 0 8px hsl(50 100% 70% / 0.6)`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

export default BlackHole;

