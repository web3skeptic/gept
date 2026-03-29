<script>
  import { articleColor, formatUnlockKey } from './gameLogic.js';

  let { visible, ruleGroup, onContinue } = $props();

  let keyDisplay = $derived(ruleGroup ? formatUnlockKey(ruleGroup) : '');
  let examples = $derived(ruleGroup ? ruleGroup.nouns.slice(0, 3) : []);
</script>

{#if visible && ruleGroup}
  <div class="overlay show">
    <div class="unlock-card">
      <div class="unlock-emoji">&#127881;</div>
      <div class="unlock-title">New Rule Unlocked!</div>
      <div class="unlock-desc">
        <strong>{keyDisplay}</strong> &rarr;
        <span style="color:{articleColor(ruleGroup.article)}">{ruleGroup.article}</span>
        <br>{ruleGroup.notes}
      </div>
      <div class="unlock-examples">
        {#each examples as noun}
          <span class="unlock-example">{noun.article} {noun.word}</span>
        {/each}
      </div>
      <button class="btn-continue" onclick={onContinue}>Let's go!</button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(30, 27, 75, 0.6);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .unlock-card {
    background: var(--card);
    border-radius: 20px;
    padding: 32px 24px;
    max-width: 380px;
    width: 100%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: popIn 0.35s ease-out;
  }
  @keyframes popIn {
    from { transform: scale(0.85); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .unlock-emoji {
    font-size: 3rem;
    margin-bottom: 12px;
  }
  .unlock-title {
    font-size: 1.2rem;
    font-weight: 800;
    margin-bottom: 8px;
    color: var(--text);
  }
  .unlock-desc {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: 16px;
  }
  .unlock-examples {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .unlock-example {
    background: var(--bg);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text);
  }
  .btn-continue {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white;
    border: none;
    padding: 14px 32px;
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .btn-continue:hover { transform: scale(1.03); }
  .btn-continue:active { transform: scale(0.97); }
</style>
