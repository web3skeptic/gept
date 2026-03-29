<script>
  let { history, totalCorrect, totalAnswered, historySize } = $props();

  let correctCount = $derived(history.filter(h => h.correct).length);
  let pct = $derived(history.length > 0 ? Math.round((correctCount / history.length) * 100) : 0);
</script>

<div class="accuracy-strip">
  <div class="dots-row">
    {#each Array(historySize) as _, i}
      <div
        class="dot"
        class:correct={i < history.length && history[i].correct}
        class:wrong={i < history.length && !history[i].correct}
        class:latest={i === history.length - 1 && history.length > 0}
      ></div>
    {/each}
  </div>
  <div class="accuracy-text">
    {#if history.length === 0}
      Answer to start tracking
    {:else}
      <strong>{correctCount} / {history.length}</strong> correct ({pct}%) &nbsp;&middot;&nbsp; Total: {totalCorrect}/{totalAnswered}
    {/if}
  </div>
</div>

<style>
  .accuracy-strip {
    background: var(--card);
    border-radius: var(--radius);
    padding: 14px 16px;
    margin-bottom: 16px;
    box-shadow: var(--shadow);
  }
  .dots-row {
    display: flex;
    gap: 4px;
    justify-content: center;
    margin-bottom: 8px;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #e2e8f0;
    transition: background 0.3s, transform 0.3s;
    flex-shrink: 0;
  }
  .dot.correct { background: var(--success); }
  .dot.wrong { background: var(--error); }
  .dot.latest { transform: scale(1.3); }
  .accuracy-text {
    text-align: center;
    font-size: 0.82rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .accuracy-text :global(strong) {
    color: var(--text);
    font-weight: 700;
  }
</style>
