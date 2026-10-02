export type BeatStrength = 'strong' | 'medium' | 'weak';

export class MetronomeEngine {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private bpm = 120;
  private beatsPerBar = 4;
  private currentBeat = 0;
  private nextNoteTime = 0.0;
  private timerId: number | null = null;
  private onBeatCallback?: (beat: number, strength: BeatStrength) => void;

  constructor(onBeat?: (beat: number, strength: BeatStrength) => void) {
    this.onBeatCallback = onBeat;
  }

  start(bpm: number, beatsPerBar = 4) {
    this.bpm = bpm;
    this.beatsPerBar = beatsPerBar;
    this.currentBeat = 0;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    this.isPlaying = true;
    this.nextNoteTime = this.audioCtx.currentTime + 0.05;
    this.schedule();
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  private getBeatStrength(beat: number): BeatStrength {
    if (beat === 0) return 'strong';
    // No compasso 6/8, o quarto tempo (índice 3) é semiforte
    if (this.beatsPerBar === 6 && beat === 3) return 'medium';
    return 'weak';
  }

  private schedule = () => {
    if (!this.isPlaying || !this.audioCtx) return;

    while (this.nextNoteTime < this.audioCtx.currentTime + 0.1) {
      const strength = this.getBeatStrength(this.currentBeat);
      this.playClick(this.nextNoteTime, strength);

      if (this.onBeatCallback) {
        this.onBeatCallback(this.currentBeat, strength);
      }

      this.nextNoteTime += 60.0 / this.bpm;
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar;
    }

    this.timerId = window.setTimeout(this.schedule, 25);
  };

  private playClick(time: number, strength: BeatStrength) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    let freq = 800;
    let volume = 0.5;

    if (strength === 'strong') {
      freq = 1760;
      volume = 1.0;
    } else if (strength === 'medium') {
      freq = 1250;
      volume = 0.75;
    }

    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.start(time);
    osc.stop(time + 0.04);
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) clearTimeout(this.timerId);
    this.audioCtx?.close();
    this.audioCtx = null;
  }
}
