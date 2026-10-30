/**
 * Web Audio API synthesized audio alerts for workout intervals and zone transitions.
 * Fully client-side, zero external assets or tracking.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check saved audio preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pulse_sound_muted');
      this.isMuted = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pulse_sound_muted', String(this.isMuted));
    }
    return this.isMuted;
  }

  public playTone(freq: number, durationSeconds: number, type: OscillatorType = 'sine', gainVal = 0.1) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationSeconds);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + durationSeconds);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  public playZoneAlert() {
    this.playTone(587.33, 0.15, 'sine', 0.12); // D5
    setTimeout(() => this.playTone(880, 0.25, 'sine', 0.12), 140); // A5
  }

  public playCountdown() {
    this.playTone(440, 0.1, 'sine', 0.1); // A4
  }

  public playComplete() {
    this.playTone(523.25, 0.15, 'triangle', 0.15); // C5
    setTimeout(() => this.playTone(659.25, 0.15, 'triangle', 0.15), 150); // E5
    setTimeout(() => this.playTone(783.99, 0.35, 'triangle', 0.15), 300); // G5
  }
}

export const soundManager = new SoundManager();
