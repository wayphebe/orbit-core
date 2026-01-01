import { useCallback, useEffect, useRef } from 'react';

// Import audio files
import collectSound from '@/assets/audio/collect.wav';
import orbitsMusic from '@/assets/audio/OrbitsMusic.wav';

export type SoundEffect = 'collect';

const SOUND_MAP: Record<SoundEffect, string> = {
  collect: collectSound,
};

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundBuffersRef = useRef<Map<SoundEffect, AudioBuffer>>(new Map());
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio context and preload sounds
  useEffect(() => {
    const initAudio = async () => {
      audioContextRef.current = new AudioContext();
      
      // Preload all sound effects
      for (const [key, url] of Object.entries(SOUND_MAP)) {
        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          soundBuffersRef.current.set(key as SoundEffect, audioBuffer);
        } catch (error) {
          console.warn(`Failed to load sound: ${key}`, error);
        }
      }
    };

    initAudio();

    return () => {
      audioContextRef.current?.close();
      bgmRef.current?.pause();
    };
  }, []);

  // Play sound effect
  const playSfx = useCallback((effect: SoundEffect, volume = 0.5) => {
    const ctx = audioContextRef.current;
    const buffer = soundBuffersRef.current.get(effect);
    
    if (!ctx || !buffer) return;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
  }, []);

  // Start BGM (will be called when music file is added)
  const startBgm = useCallback((url: string, volume = 0.3) => {
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
    
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volume;
    bgmRef.current = audio;
    
    // Try to play (may fail due to autoplay policy)
    audio.play().catch(() => {
      // Will play on first user interaction
      const playOnInteract = () => {
        audio.play();
        document.removeEventListener('click', playOnInteract);
        document.removeEventListener('keydown', playOnInteract);
      };
      document.addEventListener('click', playOnInteract);
      document.addEventListener('keydown', playOnInteract);
    });
  }, []);

  const stopBgm = useCallback(() => {
    bgmRef.current?.pause();
    bgmRef.current = null;
  }, []);

  return { playSfx, startBgm, stopBgm };
}
