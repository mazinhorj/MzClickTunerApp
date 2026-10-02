<script lang="ts">
  import { onMount } from 'svelte';
  import Tuner from './lib/Tuner.svelte';
  import Metronome from './lib/Metronome.svelte';

  let showTuner = true;
  let showMetronome = false;
  let isDesktopOrTablet = false;

  let lastOrientation = '';

  function handleOrientationAndResize() {
    const width = window.innerWidth;
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    const currentOrientation = isPortrait ? 'portrait' : 'landscape';

    // Considera desktop ou tablet grande (telas de verdade com >= 1024px ou tablet landscape)
    isDesktopOrTablet = width >= 900;

    // Detectou mudança para modo retrato em dispositivo móvel
    if (isPortrait && !isDesktopOrTablet) {
      if (lastOrientation === 'landscape' || (showTuner && showMetronome)) {
        // Ao voltar pro modo retrato, isola no afinador para não empilhar verticalmente
        showTuner = true;
        showMetronome = false;
      }
    } else if (isDesktopOrTablet && lastOrientation === 'portrait') {
      // Se abriu no PC ou tablet em paisagem larga, liga ambos
      showTuner = true;
      showMetronome = true;
    }

    lastOrientation = currentOrientation;
  }

  // Controle de gestos (Swipe) exclusivo para quando apenas 1 módulo estiver visível
  let touchStartX = 0;
  let touchStartY = 0;
  let isScrolling = false;

  function handleTouchStart(e: TouchEvent) {
    // Se ambos estiverem na tela (tablet/desktop), desativa o swipe
    if (showTuner && showMetronome) return;

    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    isScrolling = false;
  }

  function handleTouchMove(e: TouchEvent) {
    if (showTuner && showMetronome) return;

    const diffY = Math.abs(e.changedTouches[0].screenY - touchStartY);
    const diffX = Math.abs(e.changedTouches[0].screenX - touchStartX);

    // Se o movimento for vertical, é intenção de scroll
    if (diffY > 15 && diffY > diffX) {
      isScrolling = true;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if ((showTuner && showMetronome) || isScrolling) return;

    const diffX = e.changedTouches[0].screenX - touchStartX;
    const diffY = e.changedTouches[0].screenY - touchStartY;

    // Movimento horizontal definido
    if (Math.abs(diffX) > Math.abs(diffY) * 1.6 && Math.abs(diffX) > 60) {
      if (diffX < 0 && showTuner) {
        // Arrasta para a esquerda -> Metrônomo
        showTuner = false;
        showMetronome = true;
      } else if (diffX > 0 && showMetronome) {
        // Arrasta para a direita -> Afinador
        showTuner = true;
        showMetronome = false;
      }
    }
  }

  function toggleView(view: 'tuner' | 'metronome') {
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;

    // Em telas grandes em paisagem (desktop/tablet), opera como toggle independente
    if (isDesktopOrTablet && !isPortrait) {
      if (view === 'tuner') {
        if (showTuner && !showMetronome) return;
        showTuner = !showTuner;
      } else {
        if (showMetronome && !showTuner) return;
        showMetronome = !showMetronome;
      }
    } else {
      // No celular (tanto retrato quanto tela compacta), atua como aba exclusiva
      if (view === 'tuner') {
        showTuner = true;
        showMetronome = false;
      } else {
        showTuner = false;
        showMetronome = true;
      }
    }
  }

  onMount(() => {
    lastOrientation = window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
    handleOrientationAndResize();

    window.addEventListener('resize', handleOrientationAndResize);
    window.matchMedia('(orientation: portrait)').addEventListener('change', handleOrientationAndResize);

    return () => {
      window.removeEventListener('resize', handleOrientationAndResize);
      window.matchMedia('(orientation: portrait)').removeEventListener('change', handleOrientationAndResize);
    };
  });
</script>

<main 
  class="app-container"
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
>
  <header>
    <h1>MzClickTuner</h1>
    <div class="tabs">
      <button 
        class="tab-btn {showTuner ? 'active' : ''}" 
        on:click={() => toggleView('tuner')}
      >
        Afinador
      </button>
      <button 
        class="tab-btn {showMetronome ? 'active' : ''}" 
        on:click={() => toggleView('metronome')}
      >
        Metrônomo
      </button>
    </div>
  </header>

  <!-- Grade adaptativa -->
  <section class="grid-layout {showTuner && showMetronome ? 'dual-view' : 'single-view'}">
    {#if showTuner}
      <div class="module-wrapper">
        <Tuner />
      </div>
    {/if}

    {#if showMetronome}
      <div class="module-wrapper">
        <Metronome />
      </div>
    {/if}
  </section>

  <!-- Rodapé OM SOFTWARE -->
  <footer>
    <p>Desenvolvido por <strong>OM SOFTWARE</strong> <span class="om-tag">&lt;ॐ/&gt;</span></p>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #0d0f12;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #f4f4f5;
  }

  .app-container {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 12px 14px 8px;
  }

  header {
    flex-shrink: 0;
    text-align: center;
    margin-bottom: 12px;
  }

  h1 {
    font-size: 1.55rem;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
    font-weight: 800;
  }

  .tabs {
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .tab-btn {
    background: #181b20;
    border: 1px solid #2e3440;
    color: #94a3b8;
    padding: 7px 20px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.92rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .tab-btn.active {
    background: #00d2d3;
    color: #0b1016;
    border-color: #00d2d3;
    font-weight: 700;
    box-shadow: 0 0 12px rgba(0, 210, 211, 0.4);
  }

  /* Grid dos módulos */
  .grid-layout {
    flex: 1;
    display: grid;
    gap: 16px;
    width: 100%;
    align-items: stretch;
  }

  .grid-layout.single-view {
    grid-template-columns: 1fr;
    max-width: 500px;
    margin: 0 auto;
  }

  .grid-layout.dual-view {
    grid-template-columns: repeat(2, 1fr);
  }

  /* No celular em pé (Portrait), trava sem empilhamento */
  @media (orientation: portrait) {
    .grid-layout {
      grid-template-columns: 1fr !important;
      max-width: 500px;
      margin: 0 auto;
    }
  }

  .module-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 0;
  }

  footer {
    flex-shrink: 0;
    text-align: center;
    padding: 10px 0 4px;
  }

  footer p {
    margin: 0;
    font-size: 0.76rem;
    color: #475569;
    letter-spacing: 0.5px;
  }

  footer strong {
    color: #94a3b8;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .om-tag {
    color: #00d2d3;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 800;
    font-size: 0.85rem;
    margin-left: 2px;
    filter: drop-shadow(0 0 6px rgba(0, 210, 211, 0.4));
  }

  /* Celular deitado (Landscape com pouca altura vertical) */
  @media (max-height: 540px) and (orientation: landscape) {
    .app-container {
      min-height: auto;
      overflow-y: auto; /* Permite rolagem suave em vez de decepar os botões */
    }

    header {
      margin-bottom: 6px;
    }

    h1 {
      font-size: 1.2rem;
      margin-bottom: 4px;
    }
  }

  /* Mobile em pé: mantém centralizado e sem vazar tela */
  @media (max-width: 767px) {
    .grid-layout.dual-view {
      grid-template-columns: 1fr;
    }
  }
</style>