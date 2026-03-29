<script>
  import { articleColor } from './gameLogic.js';

  let { visible, noun, onTryAgain, onSkip } = $props();
</script>

{#if visible && noun}
  <div class="feedback wrong-feedback">
    <div class="feedback-title wrong">&#10007; Incorrect</div>
    <div class="feedback-explanation">
      The correct answer is
      <strong style="color:{articleColor(noun.article)}">{noun.article} {noun.word}</strong>
      <br><br>
      {noun.explanation}<br>
      <em>{noun.rule.notes}</em>
    </div>
    <div class="feedback-actions">
      <button class="btn-try-again" onclick={onTryAgain}>Try Again</button>
      <button class="btn-skip" onclick={onSkip}>Skip &rarr;</button>
    </div>
  </div>
{/if}

<style>
  .feedback {
    background: var(--card);
    border-radius: var(--radius);
    padding: 18px;
    margin-bottom: 16px;
    box-shadow: var(--shadow);
    animation: slideUp 0.25s ease-out;
  }
  @keyframes slideUp {
    from { transform: translateY(8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .feedback.wrong-feedback {
    border-left: 4px solid var(--error);
  }
  .feedback-title {
    font-weight: 700;
    font-size: 0.95rem;
    margin-bottom: 6px;
  }
  .feedback-title.wrong { color: var(--error); }
  .feedback-explanation {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: 12px;
  }
  .feedback-actions {
    display: flex;
    gap: 8px;
  }
  .btn-try-again, .btn-skip {
    padding: 10px 20px;
    border-radius: var(--radius-sm);
    border: none;
    font-family: inherit;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-try-again {
    background: var(--primary);
    color: white;
  }
  .btn-try-again:hover { background: var(--primary-dark); }
  .btn-skip {
    background: var(--bg);
    color: var(--text-secondary);
  }
  .btn-skip:hover { background: var(--border); }
</style>
