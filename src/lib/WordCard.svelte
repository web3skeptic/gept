<script>
  let { noun, ruleGroups, showRule = true } = $props();

  let categoryLabel = $derived.by(() => {
    if (!noun) return '';
    if (noun.rule.type === 'suffix') return 'Suffix: ' + noun.rule.key;
    if (noun.rule.type === 'exception') return 'Exception';
    return noun.rule.key.replace(/_/g, ' ');
  });

  let entering = $state(true);

  $effect(() => {
    // On mount (which re-triggers via {#key}), start with entering=true then remove
    entering = true;
    // Use double rAF to allow the browser to paint the entering state first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        entering = false;
      });
    });
  });
</script>

<div class="card-container">
  <div class="word-card" class:entering>
    <div class="word-de">{noun?.word ?? 'Loading...'}</div>
    <div class="word-en">{noun?.en ?? ''}</div>
    {#if noun && showRule}
      <div class="word-category">{categoryLabel}</div>
    {/if}
  </div>
</div>

<style>
  .card-container {
    perspective: 800px;
    margin-bottom: 16px;
  }
  .word-card {
    background: var(--card);
    border-radius: var(--radius);
    padding: 36px 24px 28px;
    text-align: center;
    box-shadow: var(--shadow-lg);
    transition: transform 0.25s, opacity 0.25s;
    position: relative;
    overflow: hidden;
  }
  .word-card.entering {
    transform: translateY(12px);
    opacity: 0;
  }
  .word-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--der), var(--die), var(--das));
  }
  .word-de {
    font-size: 2.4rem;
    font-weight: 800;
    margin-bottom: 6px;
    letter-spacing: -0.5px;
  }
  .word-en {
    font-size: 1rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .word-category {
    display: inline-block;
    margin-top: 10px;
    font-size: 0.72rem;
    color: var(--text-tertiary);
    background: var(--bg);
    padding: 3px 10px;
    border-radius: 20px;
    font-weight: 600;
  }
</style>
