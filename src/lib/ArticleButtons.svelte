<script>
  let { onAnswer, wrongGuesses, disabled } = $props();

  let flashState = $state({ der: '', die: '', das: '' });

  export function flashCorrect(article) {
    flashState[article] = 'correct-flash';
    setTimeout(() => { flashState[article] = ''; }, 350);
  }

  export function flashWrong(article) {
    flashState[article] = 'wrong-flash';
    setTimeout(() => { flashState[article] = ''; }, 400);
  }

  function isDisabled(article) {
    return disabled || wrongGuesses.includes(article);
  }
</script>

<div class="buttons">
  <button
    class="btn-article btn-der {flashState.der}"
    class:disabled={isDisabled('der')}
    onclick={() => onAnswer('der')}
  >der</button>
  <button
    class="btn-article btn-die {flashState.die}"
    class:disabled={isDisabled('die')}
    onclick={() => onAnswer('die')}
  >die</button>
  <button
    class="btn-article btn-das {flashState.das}"
    class:disabled={isDisabled('das')}
    onclick={() => onAnswer('das')}
  >das</button>
</div>

<div class="keyboard-hint">
  Keyboard: <span class="key-badge">1</span> der &nbsp; <span class="key-badge">2</span> die &nbsp; <span class="key-badge">3</span> das
</div>

<style>
  .buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 16px;
  }
  .btn-article {
    flex: 1;
    padding: 18px 8px;
    border: 3px solid transparent;
    border-radius: var(--radius);
    font-size: 1.4rem;
    font-weight: 800;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    position: relative;
    overflow: hidden;
  }
  .btn-article:active {
    transform: scale(0.96);
  }
  .btn-der {
    background: var(--der-bg);
    color: var(--der-dark);
    border-color: var(--der-bg);
  }
  .btn-der:hover { border-color: var(--der); box-shadow: 0 4px 20px rgba(59,130,246,0.25); }
  .btn-die {
    background: var(--die-bg);
    color: var(--die-dark);
    border-color: var(--die-bg);
  }
  .btn-die:hover { border-color: var(--die); box-shadow: 0 4px 20px rgba(236,72,153,0.25); }
  .btn-das {
    background: var(--das-bg);
    color: var(--das-dark);
    border-color: var(--das-bg);
  }
  .btn-das:hover { border-color: var(--das); box-shadow: 0 4px 20px rgba(245,158,11,0.25); }

  :global(.btn-article.correct-flash) {
    animation: correctPulse 0.35s ease-out;
  }
  @keyframes correctPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.06); }
    100% { transform: scale(1); }
  }
  :global(.btn-article.wrong-flash) {
    animation: wrongShake 0.4s ease-out;
  }
  @keyframes wrongShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
  .btn-article.disabled {
    opacity: 0.35;
    pointer-events: none;
  }

  .keyboard-hint {
    text-align: center;
    font-size: 0.72rem;
    color: var(--text-tertiary);
    margin-top: -8px;
    margin-bottom: 12px;
  }
  .key-badge {
    display: inline-block;
    background: var(--border);
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.68rem;
    margin: 0 2px;
  }
</style>
