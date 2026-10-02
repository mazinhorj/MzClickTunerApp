<script lang="ts">
  import { onDestroy } from 'svelte';
  import { MetronomeEngine, type BeatStrength } from './audio/metronomeEngine';

  let bpm = 100;
  let beatsPerBar = 4;
  let isPlaying = false;
  let activeBeat = -1;
  let currentStrength: BeatStrength = 'weak';

  const engine = new MetronomeEngine((beat, strength) => {
    activeBeat = beat;
    currentStrength = strength;
  });

  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      engine.start(bpm, beatsPerBar);
    } else {
      engine.stop();
      activeBeat = -1;
    }
  }

  function handleBpmChange() {
    if (isPlaying) engine.setBpm(bpm);
  }

  function adjustBpm(delta: number) {
    bpm = Math.min(480, Math.max(20, bpm + delta));
    handleBpmChange();
  }

  function halveBpm() {
    // Mínimo em 20 BPM
    bpm = Math.max(20, Math.round(bpm / 2));
    handleBpmChange();
  }

  function doubleBpm() {
    // Máximo em 480 BPM
    bpm = Math.min(480, bpm * 2);
    handleBpmChange();
  }

  function setBeats(b: number) {
    beatsPerBar = b;
    if (isPlaying) {
      engine.stop();
      engine.start(bpm, beatsPerBar);
    }
  }

  onDestroy(() => engine.stop());
</script>

<div class="card">
  <!-- Seletor de Compasso com 6/8 incluído -->
  <div class="time-signatures">
    {#each [{ label: '2/4', val: 2 }, { label: '3/4', val: 3 }, { label: '4/4', val: 4 }, { label: '6/8', val: 6 }] as sig (sig.val)}
      <button
        class="sig-btn {beatsPerBar === sig.val ? 'active' : ''}"
        on:click={() => setBeats(sig.val)}
      >
        {sig.label}
      </button>
    {/each}
  </div>

  <!-- Indicadores Visuais de Pulso -->
  <div class="beat-indicators {beatsPerBar === 6 ? 'six-eight' : ''}">
    {#each Array(beatsPerBar) as _, i (i)}
      <div
        class="dot
          {activeBeat === i
          ? currentStrength === 'strong'
            ? 'accent-strong'
            : currentStrength === 'medium'
              ? 'accent-medium'
              : 'active'
          : ''}"
      >
        <span class="dot-num">{i + 1}</span>
      </div>
    {/each}
  </div>

  <!-- Display Principal de BPM -->
  <div class="bpm-display-container">
    <span class="bpm-value">{bpm}</span>
    <span class="bpm-label">BPM</span>
  </div>

  <!-- Painel de Controles -->
  <div class="controls-panel">
    <div class="slider-wrapper">
      <input
        type="range"
        min="20"
        max="480"
        bind:value={bpm}
        on:input={handleBpmChange}
        class="slider"
      />
    </div>

    <!-- Botões de ajuste fino -->
    <div class="bpm-buttons">
      <button on:click={() => adjustBpm(-5)}>-5</button>
      <button on:click={() => adjustBpm(-1)}>-1</button>
      <button on:click={() => adjustBpm(+1)}>+1</button>
      <button on:click={() => adjustBpm(+5)}>+5</button>
    </div>

    <!-- Botões de metade e dobro -->
    <div class="multiplier-buttons">
      <button on:click={halveBpm}>
        <span class="mult-symbol">½</span> Metade
      </button>
      <button on:click={doubleBpm}>
        <span class="mult-symbol">2×</span> Dobro
      </button>
    </div>
  </div>

  <!-- Botão Inferior de Play/Stop -->
  <div class="footer-action">
    <button class="action-btn {isPlaying ? 'stop' : 'start'}" on:click={togglePlay}>
      {isPlaying ? 'Parar Metrônomo' : 'Ligar Metrônomo'}
    </button>
  </div>
</div>

<style>
  .card {
    background: #14171d;
    border: 1px solid #1f242e;
    border-radius: 24px;
    padding: 20px 12px 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    width: 100%;
    box-sizing: border-box;
  }

  .time-signatures {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .sig-btn {
    background: #0b0d10;
    border: 1px solid #1f242e;
    color: #64748b;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sig-btn.active {
    background: #00d2d3;
    color: #0b1016;
    border-color: #00d2d3;
  }

  .beat-indicators {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin: 10px 0;
    flex-wrap: nowrap;
  }

  /* Em 6/8 reduz ligeiramente o raio para caber perfeitamente na horizontal */
  .beat-indicators.six-eight .dot {
    width: 38px;
    height: 38px;
    gap: 8px;
  }

  .dot {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #0b0d10;
    border: 2px solid #1f242e;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.08s ease;
  }

  .dot-num {
    font-size: 0.85rem;
    font-weight: 800;
    color: #334155;
  }

  .dot.active {
    background: #00d2d3;
    border-color: #00d2d3;
    transform: scale(1.12);
    box-shadow: 0 0 14px rgba(0, 210, 211, 0.7);
  }

  .dot.active .dot-num {
    color: #0b1016;
  }

  /* Forte (Tempo 1) - Verde Intenso */
  .dot.accent-strong {
    background: #10b981;
    border-color: #10b981;
    transform: scale(1.22);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.85);
  }

  .dot.accent-strong .dot-num {
    color: #0b1016;
  }

  /* Semiforte (Tempo 4) - Âmbar / Dourado */
  .dot.accent-medium {
    background: #f59e0b;
    border-color: #f59e0b;
    transform: scale(1.16);
    box-shadow: 0 0 18px rgba(245, 158, 11, 0.85);
  }

  .dot.accent-medium .dot-num {
    color: #0b1016;
  }

  .bpm-display-container {
    display: flex;
    align-items: baseline;
    justify-content: center;
    margin: 8px 0;
  }

  .bpm-value {
    font-size: 7.5rem;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -3px;
    color: #f1f5f9;
  }

  .bpm-label {
    font-size: 1.6rem;
    font-weight: 800;
    color: #64748b;
    margin-left: 10px;
  }

  .controls-panel {
    width: calc(100% - 32px);
    max-width: 380px;
    background: #0b0d10;
    padding: 16px 20px;
    border-radius: 18px;
    border: 1px solid #1f242e;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .slider-wrapper {
    width: 100%;
  }

  .slider {
    width: 100%;
    accent-color: #00d2d3;
    cursor: pointer;
    height: 6px;
  }

  .bpm-buttons {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .bpm-buttons button {
    flex: 1;
    background: #14171d;
    border: 1px solid #27272a;
    color: #f1f5f9;
    font-weight: 800;
    font-size: 1rem;
    padding: 12px 0;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .bpm-buttons button:active {
    background: #27272a;
  }

  .footer-action {
    width: 100%;
    padding: 0 16px 8px;
    box-sizing: border-box;
  }

  .action-btn {
    width: 100%;
    border: none;
    font-weight: 800;
    font-size: 1.1rem;
    padding: 18px;
    border-radius: 16px;
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.2s ease;
  }

  .action-btn:active {
    transform: scale(0.98);
  }

  .action-btn.start {
    background: #00d2d3;
    color: #0b1016;
    box-shadow: 0 4px 16px rgba(0, 210, 211, 0.35);
  }

  .action-btn.stop {
    background: #ef4444;
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35);
  }

  /* Linha dos botões de metade e dobro */
  .multiplier-buttons {
    display: flex;
    gap: 10px;
    width: 100%;
  }

  .multiplier-buttons button {
    flex: 1;
    background: #14171d;
    border: 1px solid #2e3440;
    color: #94a3b8;
    font-weight: 700;
    font-size: 0.95rem;
    padding: 10px 0;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.15s ease;
  }

  .multiplier-buttons button .mult-symbol {
    color: #00d2d3;
    font-weight: 900;
    font-size: 1.1rem;
  }

  .multiplier-buttons button:active {
    background: #1f242e;
    color: #f1f5f9;
    border-color: #00d2d3;
    transform: scale(0.98);
  }
</style>
