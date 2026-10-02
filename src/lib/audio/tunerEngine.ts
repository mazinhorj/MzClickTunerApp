// src/lib/audio/tunerEngine.ts
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export interface TunerResult {
    frequency: number;
    note: string;
    octave: number;
    cents: number;
    inTune: boolean;
}

export class TunerEngine {
    private audioCtx: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private stream: MediaStream | null = null;
    private buffer: Float32Array = new Float32Array(2048);

    async start(): Promise<void> {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        const source = this.audioCtx.createMediaStreamSource(this.stream);

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048;

        source.connect(filter);
        filter.connect(this.analyser);
    }

    detect(): TunerResult | null {
        if (!this.analyser || !this.audioCtx) return null;

        this.analyser.getFloatTimeDomainData(this.buffer);
        const freq = this.autoCorrelate(this.buffer, this.audioCtx.sampleRate);

        if (freq === -1 || freq < 30 || freq > 1000) return null;

        const midi = Math.round(12 * Math.log2(freq / 440) + 69);
        const note = NOTE_NAMES[midi % 12];
        const octave = Math.floor(midi / 12) - 1;
        const standardFreq = 440 * Math.pow(2, (midi - 69) / 12);
        const cents = Math.round(1200 * Math.log2(freq / standardFreq));

        return {
            frequency: freq,
            note,
            octave,
            cents,
            inTune: Math.abs(cents) <= 3
        };
    }

    private autoCorrelate(buf: Float32Array, sampleRate: number): number {
        let size = buf.length;
        let sumSquares = 0;
        for (let i = 0; i < size; i++) sumSquares += buf[i] * buf[i];
        const rms = Math.sqrt(sumSquares / size);
        if (rms < 0.015) return -1;

        let r1 = 0, r2 = size - 1, threshold = 0.2;
        for (let i = 0; i < size / 2; i++) {
            if (Math.abs(buf[i]) < threshold) { r1 = i; break; }
        }
        for (let i = 1; i < size / 2; i++) {
            if (Math.abs(buf[size - i]) < threshold) { r2 = size - i; break; }
        }

        const trimmed = buf.slice(r1, r2);
        size = trimmed.length;

        const correlations = new Float32Array(size);
        for (let lag = 0; lag < size; lag++) {
            let sum = 0;
            for (let i = 0; i < size - lag; i++) {
                sum += trimmed[i] * trimmed[i + lag];
            }
            correlations[lag] = sum;
        }

        let d = 0;
        while (correlations[d] > correlations[d + 1]) d++;
        let maxVal = -1, maxLag = -1;
        for (let i = d; i < size; i++) {
            if (correlations[i] > maxVal) {
                maxVal = correlations[i];
                maxLag = i;
            }
        }

        if (maxLag === -1) return -1;

        // --- INTERPOLAÇÃO PARABÓLICA (Sub-sample accuracy) ---
        let refinedLag = maxLag;
        if (maxLag > 0 && maxLag < size - 1) {
            const alpha = correlations[maxLag - 1];
            const beta = correlations[maxLag];
            const gamma = correlations[maxLag + 1];

            const denominator = 2 * (2 * beta - alpha - gamma);
            if (denominator !== 0) {
                const delta = (gamma - alpha) / denominator;
                refinedLag = maxLag + delta;
            }
        }

        return sampleRate / refinedLag;
    }

    stop(): void {
        this.stream?.getTracks().forEach(t => t.stop());
        this.audioCtx?.close();
    }
}