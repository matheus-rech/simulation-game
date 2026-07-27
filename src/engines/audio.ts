import * as THREE from 'three';
import { ICA_PATH } from '../anatomy';

/**
 * AudioEngine with lazy AudioContext initialization.
 * Context is created on first user interaction to comply with browser autoplay policies.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private alarmOsc: OscillatorNode | null = null;
  private alarmGain: GainNode | null = null;

  /**
   * Lazy-initialize AudioContext on first user interaction.
   * This avoids SSR issues and browser autoplay policy violations.
   */
  private getContext(): AudioContext {
    if (!this.ctx) {
      if (typeof window === 'undefined') {
        throw new Error('AudioEngine requires a browser environment');
      }
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }
      this.ctx = new AudioContextClass();
    }
    // Resume context if suspended (autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  updateDoppler(toolPos: THREE.Vector3, active: boolean): number {
    if (!active) {
      this.silence();
      return 0;
    }

    const points = ICA_PATH.getPoints(30);
    let minDist = Infinity;
    for (const p of points) {
      const d = toolPos.distanceTo(p);
      if (d < minDist) minDist = d;
    }

    if (minDist < 2.0) {
      const intensity = 1.0 - minDist / 2.0;
      this.sound(intensity);
      return intensity;
    }
    this.silence();
    return 0;
  }

  triggerAlarm(): void {
    const ctx = this.getContext();

    // Clean up any existing alarm
    this.cleanupAlarm();

    this.alarmGain = ctx.createGain();
    this.alarmOsc = ctx.createOscillator();
    this.alarmOsc.type = 'square';
    this.alarmOsc.frequency.setValueAtTime(880, ctx.currentTime);
    this.alarmOsc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5);
    this.alarmGain.gain.setValueAtTime(0.3, ctx.currentTime);
    this.alarmGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    this.alarmOsc.connect(this.alarmGain);
    this.alarmGain.connect(ctx.destination);
    this.alarmOsc.start();
    this.alarmOsc.stop(ctx.currentTime + 0.5);

    // Schedule cleanup after alarm completes
    this.alarmOsc.onended = () => this.cleanupAlarm();
  }

  private cleanupAlarm(): void {
    if (this.alarmOsc) {
      try {
        this.alarmOsc.disconnect();
      } catch {
        // Already disconnected
      }
      this.alarmOsc = null;
    }
    if (this.alarmGain) {
      try {
        this.alarmGain.disconnect();
      } catch {
        // Already disconnected
      }
      this.alarmGain = null;
    }
  }

  private sound(intensity: number): void {
    const ctx = this.getContext();

    if (!this.osc) {
      this.osc = ctx.createOscillator();
      this.gain = ctx.createGain();
      this.osc.type = 'sawtooth';
      this.osc.connect(this.gain);
      this.gain.connect(ctx.destination);
      this.osc.start();
    }

    const t = ctx.currentTime;
    this.osc.frequency.setTargetAtTime(400 + intensity * 1200, t, 0.1);
    const pulse = 0.6 + 0.4 * Math.sin(t * 2 * Math.PI * (70 / 60));
    this.gain?.gain.setTargetAtTime(intensity * pulse * 0.5, t, 0.1);
  }

  private silence(): void {
    if (this.osc) {
      try {
        this.osc.stop();
        this.osc.disconnect();
      } catch {
        // Already stopped/disconnected
      }
      this.osc = null;
    }
    if (this.gain) {
      try {
        this.gain.disconnect();
      } catch {
        // Already disconnected
      }
      this.gain = null;
    }
  }

  /**
   * Clean up all audio resources.
   * Call this when the component unmounts.
   */
  dispose(): void {
    this.silence();
    this.cleanupAlarm();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
