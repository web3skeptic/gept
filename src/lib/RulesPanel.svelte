<script>
  let { visible, ruleGroups, unlockOrder, unlockedRuleKeys, onClose } = $props();

  const types = [
    { type: 'suffix', label: 'Suffix Rules' },
    { type: 'semantic', label: 'Semantic Categories' },
    { type: 'exception', label: 'Exceptions' },
  ];

  let groupedRules = $derived.by(() => {
    return types.map(({ type, label }) => {
      const rules = unlockOrder
        .map(rk => ruleGroups[rk])
        .filter(g => g && g.type === type)
        .map(g => ({
          ...g,
          unlocked: unlockedRuleKeys.includes(g.ruleKey),
        }));
      return { type, label, rules };
    }).filter(g => g.rules.length > 0);
  });

  function formatKey(g) {
    if (g.type === 'suffix') return g.key;
    if (g.type === 'exception') return g.key.replace(/_/g, ' ');
    return g.key.replace(/_/g, ' ');
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="rules-overlay show" onclick={handleBackdropClick}>
    <div class="rules-panel">
      <div class="rules-panel-header">
        <div class="rules-panel-title">&#128218; Gender Rules</div>
        <button class="btn-close-rules" onclick={onClose}>&#10005;</button>
      </div>
      <div class="rules-list">
        {#each groupedRules as group}
          <div class="rules-group">
            <div class="rules-group-title">{group.label}</div>
            {#each group.rules as rule}
              <div class="rule-item" class:unlocked={rule.unlocked} class:locked={!rule.unlocked}>
                <div class="rule-key">
                  {#if !rule.unlocked}
                    <span class="lock-icon">&#128274;</span>
                  {/if}
                  {rule.unlocked ? formatKey(rule) : '???'}
                  <span class="rule-article {rule.article}">{rule.article}</span>
                </div>
                <div class="rule-notes">
                  {rule.unlocked ? rule.notes : 'Unlock to reveal'}
                </div>
                <div class="rule-count">
                  {rule.nouns.length} word{rule.nouns.length !== 1 ? 's' : ''}
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .rules-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(30, 27, 75, 0.5);
    backdrop-filter: blur(3px);
    z-index: 200;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 20px;
    overflow-y: auto;
    animation: fadeIn 0.25s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .rules-panel {
    background: var(--card);
    border-radius: 20px;
    padding: 28px 20px;
    max-width: 460px;
    width: 100%;
    margin: 20px auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: popIn 0.3s ease-out;
    max-height: 80vh;
    overflow-y: auto;
  }
  @keyframes popIn {
    from { transform: scale(0.85); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .rules-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .rules-panel-title {
    font-size: 1.2rem;
    font-weight: 800;
  }
  .btn-close-rules {
    background: var(--bg);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: all 0.15s;
  }
  .btn-close-rules:hover { background: var(--border); color: var(--text); }
  .rules-group {
    margin-bottom: 20px;
  }
  .rules-group-title {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--border);
  }
  .rule-item {
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    margin-bottom: 6px;
    transition: all 0.2s;
  }
  .rule-item.unlocked {
    background: var(--bg);
  }
  .rule-item.locked {
    background: var(--bg);
    opacity: 0.45;
    filter: blur(0.5px);
    position: relative;
  }
  .rule-key {
    font-weight: 700;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .rule-key .lock-icon { font-size: 0.75rem; }
  .rule-article {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 1px 8px;
    border-radius: 10px;
    margin-left: 6px;
  }
  .rule-article.der { background: var(--der-bg); color: var(--der-dark); }
  .rule-article.die { background: var(--die-bg); color: var(--die-dark); }
  .rule-article.das { background: var(--das-bg); color: var(--das-dark); }
  .rule-notes {
    font-size: 0.78rem;
    color: var(--text-secondary);
    margin-top: 3px;
  }
  .rule-count {
    font-size: 0.72rem;
    color: var(--text-tertiary);
    font-weight: 600;
    margin-top: 2px;
  }
</style>
