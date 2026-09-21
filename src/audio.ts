// Web Audio API sound generator and manager with singleton context

class SoundManager {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Read persisted sound preference if available
    try {
      const saved = localStorage.getItem('color-sort-sound');
      if (saved !== null) {
        this.soundEnabled = JSON.parse(saved);
      }
    } catch {
      this.soundEnabled = true;
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('color-sort-sound', JSON.stringify(enabled));
    } catch {
      // Ignore storage errors
    }
  }

  public toggleSound(): boolean {
    const next = !this.soundEnabled;
    this.setSoundEnabled(next);
    return next;
  }

  private getContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      return this.audioContext;
    } catch {
      return null;
    }
  }

  public playPourSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(420, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch {
      // Ignore audio errors
    }
  }

  public playCompleteSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 chord
      notes.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'triangle';
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const startTime = ctx.currentTime + index * 0.06;
        oscillator.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0.18, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.45);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playWinSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const melody = [
        { freq: 523.25, time: 0 },    // C5
        { freq: 659.25, time: 0.12 }, // E5
        { freq: 783.99, time: 0.24 }, // G5
        { freq: 1046.5, time: 0.38 }, // C6
      ];

      melody.forEach(note => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const startTime = ctx.currentTime + note.time;
        oscillator.frequency.setValueAtTime(note.freq, startTime);
        gainNode.gain.setValueAtTime(0.25, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.35);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playInvalidSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sawtooth';
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(150, ctx.currentTime);
      oscillator.frequency.setValueAtTime(110, ctx.currentTime + 0.08);

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.18);
    } catch {
      // Ignore audio errors
    }
  }

  public triggerHaptic(type: 'light' | 'medium' | 'success' = 'light'): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(15);
        else if (type === 'medium') navigator.vibrate(30);
        else if (type === 'success') navigator.vibrate([30, 40, 60]);
      } catch {
        // Ignore haptics errors
      }
    }
  }
}

export const soundManager = new SoundManager();
