// Web Audio API Procedural Synthesizer for EV Motor Whine, ICE Engine Roar, Regen Sound, and UI SFX

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private motorOsc: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;

  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  private regenOsc: OscillatorNode | null = null;
  private regenGain: GainNode | null = null;

  private isRunning: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public startEngine(vehicleType: 'EV' | 'PHEV' | 'ICE') {
    if (this.isRunning) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. EV Inverter / Motor Whine (Sine + Modulator)
      const motorOsc = this.ctx.createOscillator();
      const motorGain = this.ctx.createGain();
      motorOsc.type = 'sine';
      motorOsc.frequency.setValueAtTime(140, now);
      motorGain.gain.setValueAtTime(0, now);
      motorOsc.connect(motorGain);
      motorGain.connect(this.ctx.destination);
      motorOsc.start(now);
      this.motorOsc = motorOsc;
      this.motorGain = motorGain;

      // 2. ICE Engine Rpm Sound (Sawtooth + Lowpass)
      const engineOsc = this.ctx.createOscillator();
      const engineGain = this.ctx.createGain();
      const engineFilter = this.ctx.createBiquadFilter();

      engineOsc.type = 'sawtooth';
      engineOsc.frequency.setValueAtTime(60, now);

      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(320, now);

      engineGain.gain.setValueAtTime(0, now);

      engineOsc.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(this.ctx.destination);
      engineOsc.start(now);

      this.engineOsc = engineOsc;
      this.engineGain = engineGain;

      // 3. Regen Charging High-pitch Harmonic
      const regenOsc = this.ctx.createOscillator();
      const regenGain = this.ctx.createGain();
      regenOsc.type = 'triangle';
      regenOsc.frequency.setValueAtTime(450, now);
      regenGain.gain.setValueAtTime(0, now);

      regenOsc.connect(regenGain);
      regenGain.connect(this.ctx.destination);
      regenOsc.start(now);

      this.regenOsc = regenOsc;
      this.regenGain = regenGain;

      this.isRunning = true;
    } catch {
      // Audio context might fail before user interaction
    }
  }

  public updateEngineSound(
    vehicleType: 'EV' | 'PHEV' | 'ICE',
    speedKmh: number,
    throttle: number,
    regenKw: number,
    rpm: number
  ) {
    if (!this.ctx || this.isMuted || !this.isRunning) return;

    try {
      const now = this.ctx.currentTime;

      if (vehicleType === 'EV') {
        if (this.motorOsc && this.motorGain) {
          const freq = 120 + speedKmh * 8.5 + throttle * 60;
          this.motorOsc.frequency.setTargetAtTime(freq, now, 0.08);
          const targetGain = Math.min(0.08, 0.005 + (speedKmh / 140) * 0.04 + throttle * 0.04);
          this.motorGain.gain.setTargetAtTime(targetGain, now, 0.08);
        }
        if (this.engineGain) {
          this.engineGain.gain.setTargetAtTime(0, now, 0.05);
        }
      } else if (vehicleType === 'ICE') {
        if (this.engineOsc && this.engineGain) {
          const freq = Math.max(35, (rpm / 60) * 1.5);
          this.engineOsc.frequency.setTargetAtTime(freq, now, 0.05);
          const targetGain = Math.min(0.12, 0.02 + throttle * 0.08 + (rpm / 6000) * 0.04);
          this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
        }
        if (this.motorGain) {
          this.motorGain.gain.setTargetAtTime(0, now, 0.05);
        }
      } else {
        // PHEV (Blend)
        if (this.motorOsc && this.motorGain && this.engineOsc && this.engineGain) {
          const mFreq = 120 + speedKmh * 7;
          this.motorOsc.frequency.setTargetAtTime(mFreq, now, 0.08);
          this.motorGain.gain.setTargetAtTime(0.03, now, 0.08);

          if (throttle > 0.6 || speedKmh > 70) {
            const eFreq = Math.max(40, (rpm / 60) * 1.2);
            this.engineOsc.frequency.setTargetAtTime(eFreq, now, 0.05);
            this.engineGain.gain.setTargetAtTime(0.06 * throttle, now, 0.05);
          } else {
            this.engineGain.gain.setTargetAtTime(0, now, 0.05);
          }
        }
      }

      // Regen hum
      if (this.regenOsc && this.regenGain) {
        if (regenKw > 1.0) {
          const rFreq = 300 + Math.min(800, regenKw * 20);
          this.regenOsc.frequency.setTargetAtTime(rFreq, now, 0.05);
          const rGain = Math.min(0.06, (regenKw / 60) * 0.05);
          this.regenGain.gain.setTargetAtTime(rGain, now, 0.05);
        } else {
          this.regenGain.gain.setTargetAtTime(0, now, 0.05);
        }
      }
    } catch {
      // ignore audio glitches
    }
  }

  public playPaddleClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // ignore
    }
  }

  public playBrakeHiss() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // ignore
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.motorGain) this.motorGain.gain.value = 0;
      if (this.engineGain) this.engineGain.gain.value = 0;
      if (this.regenGain) this.regenGain.gain.value = 0;
    }
    return this.isMuted;
  }

  public stopAll() {
    try {
      if (this.motorOsc) {
        this.motorOsc.stop();
        this.motorOsc.disconnect();
      }
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      }
      if (this.regenOsc) {
        this.regenOsc.stop();
        this.regenOsc.disconnect();
      }
      this.isRunning = false;
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
