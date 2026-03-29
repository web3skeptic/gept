<script>
  import { DEFAULT_UNLOCK_WINDOW, DEFAULT_UNLOCK_THRESHOLD } from './gameLogic.js';

  let { visible, settings, ruleGroups, onClose, onChange, onClearCache } = $props();

  const CATEGORY_LABELS = {
    suffix: 'Suffix rules',
    semantic: 'Semantic categories',
    exception: 'Exceptions',
  };

  let categoryCounts = $derived.by(() => {
    const counts = { suffix: 0, semantic: 0, exception: 0 };
    Object.values(ruleGroups).forEach(g => { if (counts[g.type] !== undefined) counts[g.type]++; });
    return counts;
  });

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function updateWindow(e) {
    const v = Math.max(5, Math.min(100, Number(e.target.value)));
    onChange({ ...settings, unlockWindow: v });
  }

  function updateThreshold(e) {
    const v = Math.max(50, Math.min(100, Number(e.target.value)));
    onChange({ ...settings, unlockThreshold: v / 100 });
  }

  function toggleShowRule() {
    onChange({ ...settings, showRule: !settings.showRule });
  }

  function toggleDarkMode() {
    onChange({ ...settings, darkMode: !settings.darkMode });
  }

  function toggleType(type) {
    const next = { ...settings.enabledTypes, [type]: !settings.enabledTypes[type] };
    // prevent disabling all categories
    if (!Object.values(next).some(Boolean)) return;
    onChange({ ...settings, enabledTypes: next });
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="settings-overlay" onclick={handleBackdropClick}>
    <div class="settings-panel">
      <div class="settings-header">
        <div class="settings-title">&#9881; Settings</div>
        <button class="btn-close" onclick={onClose}>&#10005;</button>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <span class="setting-name">Streak to unlock new rule</span>
          <span class="setting-desc">Consecutive correct answers needed</span>
        </div>
        <div class="setting-control">
          <input
            type="number"
            class="num-input"
            min="5"
            max="100"
            value={settings.unlockWindow}
            onchange={updateWindow}
            oninput={updateWindow}
          />
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <span class="setting-name">Accuracy threshold</span>
          <span class="setting-desc">Minimum accuracy % over the streak</span>
        </div>
        <div class="setting-control">
          <input
            type="range"
            class="range-input"
            min="50"
            max="100"
            step="5"
            value={Math.round(settings.unlockThreshold * 100)}
            oninput={updateThreshold}
          />
          <span class="range-value">{Math.round(settings.unlockThreshold * 100)}%</span>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <span class="setting-name">Show rule hint</span>
          <span class="setting-desc">Display the rule/suffix below each word</span>
        </div>
        <div class="setting-control">
          <button
            class="toggle"
            class:on={settings.showRule}
            onclick={toggleShowRule}
            aria-label="Toggle rule display"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <span class="setting-name">Dark mode</span>
          <span class="setting-desc">Switch to a dark colour scheme</span>
        </div>
        <div class="setting-control">
          <button
            class="toggle"
            class:on={settings.darkMode}
            onclick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>

      <div class="section-title">Practice categories</div>
      {#each Object.keys(CATEGORY_LABELS) as type}
        <div class="setting-row">
          <div class="setting-label">
            <span class="setting-name">{CATEGORY_LABELS[type]}</span>
            <span class="setting-desc">{categoryCounts[type]} rules</span>
          </div>
          <div class="setting-control">
            <button
              class="toggle"
              class:on={settings.enabledTypes[type]}
              onclick={() => toggleType(type)}
              aria-label="Toggle {CATEGORY_LABELS[type]}"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>
      {/each}

      <div class="defaults-row">
        <button
          class="btn-defaults"
          onclick={() => onChange({ unlockWindow: DEFAULT_UNLOCK_WINDOW, unlockThreshold: DEFAULT_UNLOCK_THRESHOLD })}
        >Reset to defaults</button>
        <button class="btn-clear" onclick={onClearCache}>Clear progress</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .settings-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(30, 27, 75, 0.5);
    backdrop-filter: blur(3px);
    z-index: 200;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    animation: fadeIn 0.25s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .settings-panel {
    background: var(--card);
    border-radius: 20px;
    padding: 28px 24px;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: popIn 0.3s ease-out;
  }
  @keyframes popIn {
    from { transform: scale(0.88); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  .settings-title {
    font-size: 1.2rem;
    font-weight: 800;
  }
  .btn-close {
    background: var(--bg);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 1.1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: all 0.15s;
  }
  .btn-close:hover { background: var(--border); color: var(--text); }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
  }
  .setting-row:last-of-type { border-bottom: none; }
  .setting-label {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .setting-name {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text);
  }
  .setting-desc {
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }
  .setting-control {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .num-input {
    width: 64px;
    padding: 8px 10px;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
    text-align: center;
    background: var(--bg);
    transition: border-color 0.15s;
  }
  .num-input:focus {
    outline: none;
    border-color: var(--primary);
  }
  .range-input {
    width: 100px;
    accent-color: var(--primary);
    cursor: pointer;
  }
  .range-value {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--primary);
    min-width: 38px;
    text-align: right;
  }
  .defaults-row {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .btn-defaults {
    background: none;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-defaults:hover { border-color: var(--primary); color: var(--primary); }
  .btn-clear {
    background: none;
    border: 2px solid var(--error);
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--error);
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-clear:hover { background: var(--error-bg); }
  .section-title {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
    padding-top: 16px;
    padding-bottom: 4px;
    border-top: 2px solid var(--border);
    margin-top: 4px;
  }

  .toggle {
    width: 48px;
    height: 26px;
    border-radius: 13px;
    border: none;
    background: var(--border);
    cursor: pointer;
    position: relative;
    transition: background 0.2s;
    padding: 0;
    flex-shrink: 0;
  }
  .toggle.on { background: var(--primary); }
  .toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: transform 0.2s;
    display: block;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  .toggle.on .toggle-knob { transform: translateX(22px); }
</style>
