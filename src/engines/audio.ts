import * as THREE from 'three';
import { ICA_PATH } from '../anatomy';

export class AudioEngine {
  ctx: AudioContext;
  osc: OscillatorNode | null = null;
  gain: GainNode | null = null;

  constructor() {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    this.ctx = new AudioContextClass();
  }

  updateDoppler(toolPos: THREE.Vector3, active: boolean) {
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

  triggerAlarm() {
    const o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(880, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.5);
    o.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + 0.5);
  }

  private sound(intensity: number) {
    if (!this.osc) {
      this.osc = this.ctx.createOscillator();
      this.gain = this.ctx.createGain();
      this.osc.type = 'sawtooth';
      this.osc.connect(this.gain).connect(this.ctx.destination);
      this.osc.start();
    }

    const t = this.ctx.currentTime;
    this.osc.frequency.setTargetAtTime(400 + intensity * 1200, t, 0.1);
    const pulse = 0.6 + 0.4 * Math.sin(t * 2 * Math.PI * (70 / 60));
    this.gain?.gain.setTargetAtTime(intensity * pulse * 0.5, t, 0.1);
  }

  private silence() {
    if (this.osc) {
      this.osc.stop();
      this.osc = null;
    }
  }
}
