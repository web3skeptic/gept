<script>
  import AccuracyStrip from './AccuracyStrip.svelte';
  import WordCard from './WordCard.svelte';
  import ArticleButtons from './ArticleButtons.svelte';
  import FeedbackPanel from './FeedbackPanel.svelte';
  import UnlockOverlay from './UnlockOverlay.svelte';
  import RulesPanel from './RulesPanel.svelte';
  import SettingsPanel from './SettingsPanel.svelte';
  import { onMount } from 'svelte';
  import {
    NOUNS, HISTORY_SIZE, DOTS_SIZE, DEFAULT_UNLOCK_WINDOW, DEFAULT_UNLOCK_THRESHOLD,
    buildRuleGroups, buildUnlockOrder, getActivePool,
    pickNextWord, getInitialUnlockedKeys, checkUnlock,
    saveState, loadState,
  } from './gameLogic.js';

  const DEFAULT_SETTINGS = {
    unlockWindow: DEFAULT_UNLOCK_WINDOW,
    unlockThreshold: DEFAULT_UNLOCK_THRESHOLD,
    showRule: true,
    enabledTypes: { suffix: true, semantic: true, exception: true },
  };

  // ─── Build rule catalog ──────────────────────────────────────────
  const ruleGroups = buildRuleGroups(NOUNS);
  const unlockOrder = buildUnlockOrder(ruleGroups);

  // ─── Reactive state ──────────────────────────────────────────────
  let unlockedRuleKeys = $state([]);
  let history = $state([]);
  let totalCorrect = $state(0);
  let totalAnswered = $state(0);
  let stakeCount = $state(0);
  let ruleStats = $state({});
  let currentNoun = $state(null);
  let wrongGuesses = $state([]);
  let isTransitioning = $state(false);

  let settings = $state({ ...DEFAULT_SETTINGS });

  // UI state
  let showFeedback = $state(false);
  let showUnlock = $state(false);
  let unlockRuleKey = $state(null);
  let showRules = $state(false);
  let showSettings = $state(false);
  let buttonsDisabled = $state(false);

  // ─── Derived ─────────────────────────────────────────────────────
  let unlockRuleGroup = $derived(unlockRuleKey ? ruleGroups[unlockRuleKey] : null);
  let progressTotal = $derived(unlockOrder.length);
  let progressUnlocked = $derived(unlockedRuleKeys.length);
  let progressPct = $derived(progressTotal > 0 ? (progressUnlocked / progressTotal) * 100 : 0);
  let allUnlocked = $derived(progressUnlocked >= progressTotal);

  // ─── ArticleButtons ref ──────────────────────────────────────────
  let buttonsRef;

  // ─── Initialization ──────────────────────────────────────────────
  function init() {
    const saved = loadState(ruleGroups);
    if (saved) {
      unlockedRuleKeys = saved.unlockedRuleKeys;
      history = saved.history;
      totalCorrect = saved.totalCorrect;
      totalAnswered = saved.totalAnswered;
      stakeCount = saved.stakeCount;
      ruleStats = saved.ruleStats;
      if (saved.settings) settings = { ...DEFAULT_SETTINGS, ...saved.settings, enabledTypes: { ...DEFAULT_SETTINGS.enabledTypes, ...(saved.settings.enabledTypes ?? {}) } };
    } else {
      unlockedRuleKeys = getInitialUnlockedKeys(unlockOrder, ruleGroups);
    }
    nextWord();
  }

  // ─── Word selection ──────────────────────────────────────────────
  function nextWord() {
    const pool = getActivePool(ruleGroups, unlockedRuleKeys, settings.enabledTypes);
    const noun = pickNextWord(pool, currentNoun?.word, ruleStats);
    currentNoun = noun;
    wrongGuesses = [];
    showFeedback = false;
    buttonsDisabled = false;
  }

  // ─── Persistence ─────────────────────────────────────────────────
  function persist() {
    saveState({
      unlockedRuleKeys,
      history,
      totalCorrect,
      totalAnswered,
      stakeCount,
      ruleStats,
      settings,
    });
  }

  // ─── Answer logic ────────────────────────────────────────────────
  function handleAnswer(article) {
    if (isTransitioning || !currentNoun) return;
    if (buttonsDisabled) return;
    if (wrongGuesses.includes(article)) return;

    const noun = currentNoun;
    const correct = article === noun.article;

    if (correct) {
      isTransitioning = true;
      buttonsDisabled = true;

      // Flash the correct button
      buttonsRef?.flashCorrect(article);

      // Only count as clean correct if no wrong guesses on this word
      const wasClean = wrongGuesses.length === 0;
      history = [...history, { correct: wasClean }].slice(-HISTORY_SIZE);
      if (wasClean) totalCorrect++;
      totalAnswered++;
      stakeCount++;

      // Record per-rule stats
      const rk = noun.rule.type + '::' + noun.rule.key;
      const prev = ruleStats[rk] ?? { correct: 0, total: 0 };
      ruleStats = { ...ruleStats, [rk]: { correct: prev.correct + (wasClean ? 1 : 0), total: prev.total + 1 } };

      persist();

      // Check for unlock at unlockWindow boundary
      let newUnlockKey = null;
      if (stakeCount > 0 && stakeCount % settings.unlockWindow === 0) {
        newUnlockKey = checkUnlock(history, unlockedRuleKeys, unlockOrder, settings.unlockWindow, settings.unlockThreshold);
        if (newUnlockKey) {
          unlockedRuleKeys = [...unlockedRuleKeys, newUnlockKey];
          stakeCount = 0;
          history = [];
          persist();
        }
      }

      setTimeout(() => {
        isTransitioning = false;
        if (newUnlockKey) {
          unlockRuleKey = newUnlockKey;
          showUnlock = true;
        } else {
          nextWord();
        }
      }, newUnlockKey ? 200 : 180);
    } else {
      stakeCount = 0;
      wrongGuesses = [...wrongGuesses, article];
      buttonsRef?.flashWrong(article);
      showFeedback = true;
    }
  }

  function handleTryAgain() {
    showFeedback = false;
  }

  function handleSkip() {
    if (currentNoun) {
      const rk = currentNoun.rule.type + '::' + currentNoun.rule.key;
      const prev = ruleStats[rk] ?? { correct: 0, total: 0 };
      ruleStats = { ...ruleStats, [rk]: { correct: prev.correct, total: prev.total + 1 } };
    }
    history = [...history, { correct: false }].slice(-HISTORY_SIZE);
    totalAnswered++;
    persist();
    nextWord();
  }

  function handleDismissUnlock() {
    showUnlock = false;
    unlockRuleKey = null;
    nextWord();
  }

  function handleOpenRules() { showRules = true; }
  function handleCloseRules() { showRules = false; }
  function handleOpenSettings() { showSettings = true; }
  function handleCloseSettings() { showSettings = false; }
  function handleSettingsChange(newSettings) {
    settings = newSettings;
    persist();
  }

  // ─── Keyboard shortcuts ──────────────────────────────────────────
  $effect(() => {
    function onKeydown(e) {
      // Unlock overlay active
      if (showUnlock) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDismissUnlock();
        }
        return;
      }

      // Rules / settings panel active
      if (showRules) { if (e.key === 'Escape') handleCloseRules(); return; }
      if (showSettings) { if (e.key === 'Escape') handleCloseSettings(); return; }

      // Feedback visible — Enter dismisses, s skips, 1/2/3 still answer
      if (showFeedback) {
        if (e.key === 'Enter') { handleTryAgain(); return; }
        if (e.key === 's') { handleSkip(); return; }
      }

      // Normal play (also reachable while feedback is open)
      if (e.key === '1') handleAnswer('der');
      else if (e.key === '2') handleAnswer('die');
      else if (e.key === '3') handleAnswer('das');
      else if (e.key === 'r') handleOpenRules();
      else if (e.key === 'Escape') handleCloseRules();
    }

    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  });

  // ─── Run init on mount ───────────────────────────────────────────
  onMount(init);
</script>

<div class="app">
  <div class="header">
    <h1>der / die / das</h1>
    <div class="header-btns">
      <button class="rules-btn" onclick={handleOpenRules}>&#128218; Rules</button>
      <button class="rules-btn" onclick={handleOpenSettings}>&#9881;</button>
    </div>
  </div>

  <AccuracyStrip
    history={history.slice(-settings.unlockWindow)}
    {totalCorrect}
    {totalAnswered}
    historySize={settings.unlockWindow}
  />

  <div class="progress-section">
    <div class="progress-label">
      <span>{allUnlocked ? '&#127942; All rules unlocked!' : 'Rules unlocked'}</span>
      <span>{progressUnlocked} / {progressTotal}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width:{progressPct}%"></div>
    </div>
  </div>

  {#key currentNoun?.word}
    <WordCard noun={currentNoun} {ruleGroups} showRule={settings.showRule} />
  {/key}

  <ArticleButtons
    bind:this={buttonsRef}
    onAnswer={handleAnswer}
    {wrongGuesses}
    disabled={buttonsDisabled}
  />

  <FeedbackPanel
    visible={showFeedback}
    noun={currentNoun}
    onTryAgain={handleTryAgain}
    onSkip={handleSkip}
  />
</div>

<UnlockOverlay
  visible={showUnlock}
  ruleGroup={unlockRuleGroup}
  onContinue={handleDismissUnlock}
/>

<RulesPanel
  visible={showRules}
  {ruleGroups}
  {unlockOrder}
  {unlockedRuleKeys}
  onClose={handleCloseRules}
/>

<SettingsPanel
  visible={showSettings}
  {settings}
  {ruleGroups}
  onClose={handleCloseSettings}
  onChange={handleSettingsChange}
/>

<style>
  :global(:root) {
    --bg: #f0f2f8;
    --card: #ffffff;
    --primary: #6366f1;
    --primary-light: #a5b4fc;
    --primary-dark: #4338ca;
    --accent: #8b5cf6;
    --success: #22c55e;
    --success-bg: #dcfce7;
    --error: #ef4444;
    --error-bg: #fee2e2;
    --text: #1e1b4b;
    --text-secondary: #64748b;
    --text-tertiary: #94a3b8;
    --border: #e2e8f0;
    --shadow: 0 4px 24px rgba(99,102,241,.10);
    --shadow-lg: 0 8px 40px rgba(99,102,241,.15);
    --radius: 16px;
    --radius-sm: 10px;
    --der: #3b82f6;
    --die: #ec4899;
    --das: #f59e0b;
    --der-bg: #dbeafe;
    --die-bg: #fce7f3;
    --das-bg: #fef3c7;
    --der-dark: #1d4ed8;
    --die-dark: #db2777;
    --das-dark: #d97706;
  }

  :global(*) { margin: 0; padding: 0; box-sizing: border-box; }

  :global(body) {
    font-family: 'Inter', -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    line-height: 1.5;
    -webkit-tap-highlight-color: transparent;
  }

  .app {
    max-width: 520px;
    margin: 0 auto;
    padding: 16px;
    min-height: 100vh;
    position: relative;
  }

  .header {
    text-align: center;
    padding: 20px 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .header h1 {
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .header-btns {
    display: flex;
    gap: 8px;
  }
  .rules-btn {
    background: var(--card);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 14px;
    font-size: 1rem;
    cursor: pointer;
    font-family: inherit;
    font-weight: 600;
    color: var(--text);
    transition: all 0.2s;
    white-space: nowrap;
  }
  .rules-btn:hover {
    border-color: var(--primary);
    color: var(--primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }

  .progress-section {
    background: var(--card);
    border-radius: var(--radius);
    padding: 12px 16px;
    margin-bottom: 16px;
    box-shadow: var(--shadow);
  }
  .progress-label {
    font-size: 0.78rem;
    color: var(--text-secondary);
    font-weight: 600;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
  }
  .progress-bar {
    height: 6px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    border-radius: 3px;
    transition: width 0.5s ease;
  }
</style>
