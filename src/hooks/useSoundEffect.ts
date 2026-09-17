import { useState, useEffect, useCallback } from 'react';
import { soundManager, SoundEffectKey } from '@/lib/soundManager';

export interface UseSoundEffectReturn {
  play: (key: SoundEffectKey) => void;
  playTap: () => void;
  playCorrect: () => void;
  playWrong: () => void;
  playPop: () => void;
  playBalloonPop: () => void;
  playVictory: () => void;
  isMuted: boolean;
  volume: number;
  toggleMute: () => boolean;
  setVolume: (volume: number) => void;
}

/**
 * Hook for playing tactile & gamified Duolingo sound effects with reactive mute/volume states
 */
export function useSoundEffect(): UseSoundEffectReturn {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.isMuted());
  const [volume, setVolumeState] = useState<number>(() => soundManager.getVolume());

  useEffect(() => {
    // Subscribe to soundManager state changes (e.g. global mute toggled from header)
    const unsubscribe = soundManager.subscribe((muted, vol) => {
      setIsMuted(muted);
      setVolumeState(vol);
    });
    return unsubscribe;
  }, []);

  const play = useCallback((key: SoundEffectKey) => {
    soundManager.play(key);
  }, []);

  const playTap = useCallback(() => {
    soundManager.play('tap');
  }, []);

  const playCorrect = useCallback(() => {
    soundManager.play('correct');
  }, []);

  const playWrong = useCallback(() => {
    soundManager.play('wrong');
  }, []);

  const playPop = useCallback(() => {
    soundManager.play('pop');
  }, []);

  const playBalloonPop = useCallback(() => {
    soundManager.play('balloon_pop');
  }, []);

  const playVictory = useCallback(() => {
    soundManager.play('victory');
  }, []);

  const toggleMute = useCallback(() => {
    return soundManager.toggleMute();
  }, []);

  const setVolume = useCallback((vol: number) => {
    soundManager.setVolume(vol);
  }, []);

  return {
    play,
    playTap,
    playCorrect,
    playWrong,
    playPop,
    playBalloonPop,
    playVictory,
    isMuted,
    volume,
    toggleMute,
    setVolume,
  };
}

export default useSoundEffect;

