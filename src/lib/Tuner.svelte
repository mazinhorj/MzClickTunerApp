<script lang="ts">
  import { onDestroy } from 'svelte';
  import { TunerEngine, type TunerResult } from './audio/tunerEngine';

  let tuner = new TunerEngine();
  let listening = false;
  let result: TunerResult | null = null;
  let animFrameId: number;

  async function toggleListening() {
    if (!listening) {
      try {
        await tuner.start();
        listening = true;
        loop();
      } catch (err: unknown) {
        alert('Erro no microfone: ' + (err.message || err.name));
      }
    } else {
      tuner.stop();
      cancelAnimationFrame(animFrameId);
      listening = false;
      result = null;
    }
  }

  function loop() {
    result = tuner.detect();
    animFrameId = requestAnimationFrame(loop);
  }

  onDestroy(() => {
    if (listening) {
      tuner.stop();
      cancelAnimationFrame(animFrameId);
    }
  });

  // Mapeia -50 a +50 cents para rotação da agulha de -50deg a +50deg
  $: needleAngle = result ? Math.max(-50, Math.min(50, (result.cents / 50) * 50)) : 0;

  // Lógica de cálculo dinâmico de cor
  function getColor(cents: number): string {
    const abs = Math.abs(cents);
    if (abs <= 3) return '#22c55e'; // Verde perfeito
    if (abs <= 12) return '#eab308'; // Amarelo
    if (abs <= 25) return '#f97316'; // Laranja
    return '#ef4444'; // Vermelho
  }

  $: currentColor = result ? getColor(result.cents) : '#334155';

  // Lógica de determinação do Emoji de feedback
  $: feedbackEmoji = (() => {
    if (!result) return '';
    if (result.inTune) return '👍';
    if (result.cents < -3) return '⬆️'; // Abaixo -> sobe/aperta
    return '⬇️'; // Acima -> desce/afrouxa
  })();
</script>

<div class="card">
  <!-- LED / Dot Indicador Central no Topo -->
  <div class="top-status-indicator">
    <div
      class="status-dot {result?.inTune ? 'locked' : ''}"
      style="
        background-color: {result ? currentColor : '#1f242e'}; 
        box-shadow: {result ? `0 0 18px ${currentColor}` : 'none'};
        border-color: {result ? currentColor : '#2e3440'};
      "
    ></div>
  </div>

  <!-- Mostrador Analógico -->
  <div class="meter-wrapper">
    <div class="meter">
      <div
        class="gauge-arc"
        style="border-color: {result ? currentColor : '#2e3440'}; opacity: {result
          ? '0.75'
          : '0.4'};"
      ></div>

      <!-- Apenas os limites laterais (-50 e +50), sem o 0 escondido no meio -->
      <div class="gauge-ticks">
        <span class="tick flat">-50</span>
        <span class="tick sharp">+50</span>
      </div>

      <!-- Agulha reativa -->
      <div
        class="needle"
        style="
          transform: rotate({needleAngle}deg); 
          background: {currentColor};
          box-shadow: 0 0 16px {currentColor};
        "
      ></div>

      <div class="needle-base" style="background: {currentColor};"></div>
    </div>
  </div>

  <!-- Identificação da Nota + Emoji -->
  <div class="note-container" style="color: {result ? currentColor : '#e2e8f0'};">
    <span class="note-name">{result ? result.note : '--'}</span>
    {#if result?.octave !== undefined}
      <span class="octave">{result.octave}</span>
    {/if}

    {#if feedbackEmoji}
      <div class="feedback-badge" class:in-tune={result?.inTune}>
        {feedbackEmoji}
      </div>
    {/if}
  </div>

  <!-- Régua de espectro contínuo -->
  <div class="scale-bar-wrapper">
    <div class="scale-bar">
      <div class="zone zone-far-flat"></div>
      <div class="zone zone-mid-flat"></div>
      <div class="zone zone-center"></div>
      <div class="zone zone-mid-sharp"></div>
      <div class="zone zone-far-sharp"></div>
      <div
        class="scale-cursor"
        style="
          left: calc(50% + {(needleAngle / 50) * 45}%); 
          background: {currentColor};
          opacity: {result ? 1 : 0};
        "
      ></div>
    </div>
  </div>

  <!-- Caixa de Leituras Numéricas -->
  <div class="readouts">
    <div class="readout-item">
      <span class="label">FREQUÊNCIA</span>
      <span class="val">{result ? result.frequency.toFixed(1) : '---'} Hz</span>
    </div>
    <div class="readout-item">
      <span class="label">DESVIO</span>
      <span class="val" style="color: {result ? currentColor : '#f1f5f9'};">
        {result ? `${result.cents > 0 ? '+' : ''}${result.cents}` : '0'} cents
      </span>
    </div>
  </div>

  <!-- Botão de Ação -->
  <div class="footer-action">
    <button class="action-btn {listening ? 'active' : ''}" on:click={toggleListening}>
      {listening ? 'Desativar Microfone' : 'Ligar Microfone'}
    </button>
  </div>
</div>

<style>
  .card {
    background: #14171d;
    border: 1px solid #1f242e;
    border-radius: 24px;
    padding: 16px 12px 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    width: 100%;
    box-sizing: border-box;
  }

  /* LED Indicador no Topo */
  .top-status-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 4px;
    margin-bottom: 2px;
  }

  .status-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid;
    transition: all 0.12s ease;
  }

  .status-dot.locked {
    transform: scale(1.3);
    animation: dot-pulse 1.2s infinite alternate ease-in-out;
  }

  @keyframes dot-pulse {
    0% {
      transform: scale(1.2);
      box-shadow: 0 0 14px #22c55e;
    }
    100% {
      transform: scale(1.45);
      box-shadow: 0 0 24px #22c55e;
    }
  }

  /* Mostrador */
  .meter-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    padding-top: 4px;
  }

  .meter {
    position: relative;
    width: 320px;
    max-width: 90vw;
    height: 155px;
    overflow: hidden;
  }

  .gauge-arc {
    width: 320px;
    max-width: 90vw;
    height: 320px;
    border-radius: 50%;
    border: 5px dashed;
    box-sizing: border-box;
    transition:
      border-color 0.15s ease,
      opacity 0.15s ease;
  }

  .gauge-ticks {
    position: absolute;
    width: 100%;
    top: 24px;
    left: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
    box-sizing: border-box;
    font-size: 0.85rem;
    font-weight: 700;
    color: #64748b;
  }

  .needle {
    position: absolute;
    bottom: 0;
    left: calc(50% - 2.5px);
    width: 5px;
    height: 135px;
    border-radius: 4px;
    transform-origin: bottom center;
    transition:
      transform 0.06s cubic-bezier(0.1, 0.7, 0.1, 1),
      background-color 0.12s ease;
  }

  .needle-base {
    position: absolute;
    bottom: -12px;
    left: calc(50% - 16px);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    transition: background-color 0.12s ease;
  }

  /* Nota e Emoji */
  .note-container {
    position: relative;
    display: flex;
    align-items: baseline;
    justify-content: center;
    margin: 4px 0;
    transition: color 0.12s ease;
  }

  .note-name {
    font-size: 7.2rem;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -2px;
    font-family: system-ui, sans-serif;
  }

  .octave {
    font-size: 2.2rem;
    font-weight: 700;
    margin-left: 6px;
    opacity: 0.8;
  }

  .feedback-badge {
    position: absolute;
    right: -58px;
    top: 10px;
    font-size: 2.5rem;
    filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
    animation: pop 0.15s ease-out;
  }

  .feedback-badge.in-tune {
    animation: thumbs 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  @keyframes pop {
    0% {
      transform: scale(0.6);
      opacity: 0.4;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes thumbs {
    0% {
      transform: scale(0.5) rotate(-20deg);
    }
    100% {
      transform: scale(1.15) rotate(0deg);
    }
  }

  /* Régua Horizontal */
  .scale-bar-wrapper {
    width: calc(100% - 32px);
    max-width: 380px;
    margin-bottom: 12px;
  }

  .scale-bar {
    position: relative;
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: #0b0d10;
    display: flex;
    overflow: hidden;
    border: 1px solid #1f242e;
  }

  .zone {
    flex: 1;
    height: 100%;
  }
  .zone-far-flat {
    background: #ef4444;
    opacity: 0.4;
  }
  .zone-mid-flat {
    background: #f97316;
    opacity: 0.4;
  }
  .zone-center {
    background: #22c55e;
    opacity: 0.8;
    flex: 0.6;
  }
  .zone-mid-sharp {
    background: #f97316;
    opacity: 0.4;
  }
  .zone-far-sharp {
    background: #ef4444;
    opacity: 0.4;
  }

  .scale-cursor {
    position: absolute;
    top: 0;
    width: 6px;
    height: 100%;
    border-radius: 999px;
    transform: translateX(-50%);
    transition:
      left 0.06s ease,
      background 0.12s ease;
    box-shadow: 0 0 8px currentColor;
  }

  /* Dados */
  .readouts {
    width: calc(100% - 32px);
    max-width: 380px;
    margin: 4px 16px 12px;
    display: flex;
    justify-content: space-around;
    background: #0b0d10;
    padding: 14px 20px;
    border-radius: 18px;
    border: 1px solid #1f242e;
    box-sizing: border-box;
  }

  .readout-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .readout-item .label {
    font-size: 0.72rem;
    letter-spacing: 1.5px;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .readout-item .val {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 1.25rem;
    font-weight: 700;
    transition: color 0.12s ease;
  }

  /* Botão Inferior */
  .footer-action {
    width: 100%;
    padding: 0 16px 8px;
    box-sizing: border-box;
  }

  .action-btn {
    width: 100%;
    background: #00d2d3;
    color: #0b1016;
    border: none;
    font-weight: 800;
    font-size: 1.1rem;
    padding: 18px;
    border-radius: 16px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 210, 211, 0.35);
    transition:
      transform 0.1s ease,
      background-color 0.2s ease;
  }

  .action-btn:active {
    transform: scale(0.98);
  }

  .action-btn.active {
    background: #ef4444;
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35);
  }
</style>
