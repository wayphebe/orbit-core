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
  const unlockListenersAttachedRef = useRef(false);

  // Initialize audio context and preload sounds
  useEffect(() => {
    const initAudio = async () => {
      // Some browsers (notably older Safari) still use webkitAudioContext.
      const Ctx =
        (window.AudioContext as typeof AudioContext | undefined) ||
        ((window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      audioContextRef.current = Ctx ? new Ctx() : null;
      
      // Preload all sound effects
      for (const [key, url] of Object.entries(SOUND_MAP)) {
        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const ctx = audioContextRef.current;
          if (ctx) {
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            soundBuffersRef.current.set(key as SoundEffect, audioBuffer);
          }
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

  const ensureUnlockedOnUserGesture = useCallback(() => {
    if (unlockListenersAttachedRef.current) return;
    unlockListenersAttachedRef.current = true;

    const tryUnlock = async () => {
      // Resume WebAudio (SFX) if needed.
      const ctx = audioContextRef.current;
      if (ctx?.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {
          // ignore
        }
      }

      // Start BGM if present.
      const bgm = bgmRef.current;
      if (!bgm) return;
      try {
        await bgm.play();
        // Only remove listeners once we actually started playing.
        for (const evt of ['pointerdown', 'touchstart', 'click', 'keydown'] as const) {
          document.removeEventListener(evt, tryUnlock);
        }
        unlockListenersAttachedRef.current = false;
      } catch {
        // Keep listeners; some browsers still reject until specific gesture.
      }
    };

    for (const evt of ['pointerdown', 'touchstart', 'click', 'keydown'] as const) {
      document.addEventListener(evt, tryUnlock);
    }
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
    audio.preload = 'auto';
    bgmRef.current = audio;

    audio.addEventListener('error', () => {
      // This is the only reliable signal for 404 / decode failure on HTMLAudioElement.
      console.warn('BGM failed to load/play', { url, error: audio.error });
    });
    
    // Try to play (may fail due to autoplay policy)
    audio.play().catch(() => {
      // Will (re)try on first user interaction (mobile-friendly: pointer/touch).
      ensureUnlockedOnUserGesture();
    });
  }, [ensureUnlockedOnUserGesture]);

  const stopBgm = useCallback(() => {
    bgmRef.current?.pause();
    bgmRef.current = null;
  }, []);

  return { playSfx, startBgm, stopBgm };
}
