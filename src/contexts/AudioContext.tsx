import { createContext, useContext, ReactNode } from 'react';
import { useAudio, SoundEffect } from '@/hooks/useAudio';

interface AudioContextType {
  playSfx: (effect: SoundEffect, volume?: number) => void;
  startBgm: (url: string, volume?: number) => void;
  stopBgm: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audio = useAudio();
  
  return (
    <AudioContext.Provider value={audio}>
      {children}
    </AudioContext.Provider>
  );
}

export function useGameAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useGameAudio must be used within AudioProvider');
  }
  return context;
}
