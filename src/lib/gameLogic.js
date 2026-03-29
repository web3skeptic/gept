import nounsData from './nouns.json';

export const NOUNS = nounsData.nouns;
export const HISTORY_SIZE = 100;
export const DOTS_SIZE = 30;
export const DEFAULT_UNLOCK_WINDOW = 15;
export const DEFAULT_UNLOCK_THRESHOLD = 0.80;
export const STORAGE_KEY = 'german-gender-trainer-v2';

/**
 * Build rule groups from NOUNS array.
 * Groups nouns by `rule.type + '::' + rule.key`.
 */
export function buildRuleGroups(nouns) {
  const groups = {};
  nouns.forEach(n => {
    const rk = n.rule.type + '::' + n.rule.key;
    if (!groups[rk]) {
      groups[rk] = {
        type: n.rule.type,
        key: n.rule.key,
        ruleKey: rk,
        article: n.article,
        notes: n.rule.notes,
        nouns: [],
      };
    }
    groups[rk].nouns.push(n);
  });
  return groups;
}

/**
 * Interleave rules by gender (der → die → das → der → …) to avoid
 * unlocking the same gender twice in a row. Within each gender bucket
 * the rules are already sorted by noun count descending.
 */
function interleaveByGender(rules) {
  const buckets = { der: [], die: [], das: [] };
  rules.forEach(g => buckets[g.article]?.push(g));
  const result = [];
  while (true) {
    let added = false;
    for (const article of ['der', 'die', 'das']) {
      if (buckets[article].length > 0) {
        result.push(buckets[article].shift());
        added = true;
      }
    }
    if (!added) break;
  }
  return result;
}

/**
 * Build unlock order: suffix first, semantic second, exception last.
 * Within each tier, sort by noun count descending then interleave
 * by gender so consecutive unlocks alternate der / die / das.
 */
export function buildUnlockOrder(ruleGroups) {
  const suffixRules = [];
  const semanticRules = [];
  const exceptionRules = [];

  Object.values(ruleGroups).forEach(g => {
    if (g.type === 'suffix') suffixRules.push(g);
    else if (g.type === 'semantic') semanticRules.push(g);
    else exceptionRules.push(g);
  });

  suffixRules.sort((a, b) => b.nouns.length - a.nouns.length);
  semanticRules.sort((a, b) => b.nouns.length - a.nouns.length);
  exceptionRules.sort((a, b) => b.nouns.length - a.nouns.length);

  return [
    ...interleaveByGender(suffixRules),
    ...interleaveByGender(semanticRules),
    ...interleaveByGender(exceptionRules),
  ].map(g => g.ruleKey);
}

/**
 * Get the active noun pool from unlocked rule keys.
 */
export function getActivePool(ruleGroups, unlockedRuleKeys, enabledTypes = null) {
  const pool = [];
  unlockedRuleKeys.forEach(rk => {
    const group = ruleGroups[rk];
    if (group && (!enabledTypes || enabledTypes[group.type])) {
      group.nouns.forEach(n => pool.push(n));
    }
  });
  return pool;
}

/**
 * Pick a noun from the pool, weighted toward rules with worse accuracy.
 * Rules with no records are treated as 0% error (lowest priority).
 * Avoids repeating the current word when possible.
 */
export function pickNextWord(pool, currentWord, ruleStats = {}) {
  if (pool.length === 0) return null;

  // Group nouns by rule key
  const byRule = {};
  pool.forEach(n => {
    const rk = n.rule.type + '::' + n.rule.key;
    if (!byRule[rk]) byRule[rk] = [];
    byRule[rk].push(n);
  });

  const ruleKeys = Object.keys(byRule);

  // Weight = 1 (baseline) + errorRate * 2 (boost for struggling rules)
  // No records → errorRate = 0 → weight = 1
  const weights = ruleKeys.map(rk => {
    const s = ruleStats[rk];
    if (!s || s.total === 0) return 1.0;
    const errorRate = 1 - s.correct / s.total;
    return 1.0 + errorRate * 2;
  });

  // Weighted random pick of rule
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  let selectedRk = ruleKeys[ruleKeys.length - 1];
  for (let i = 0; i < ruleKeys.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { selectedRk = ruleKeys[i]; break; }
  }

  // Random noun from the selected rule, avoiding current word
  const candidates = byRule[selectedRk];
  let noun;
  let attempts = 0;
  do {
    noun = candidates[Math.floor(Math.random() * candidates.length)];
    attempts++;
  } while (currentWord && noun.word === currentWord && candidates.length > 1 && attempts < 20);
  return noun;
}

/**
 * Get initial unlocked keys for a new game.
 */
export function getInitialUnlockedKeys(unlockOrder, ruleGroups) {
  const suffixKeys = unlockOrder.filter(rk => ruleGroups[rk].type === 'suffix');
  const firstFem = suffixKeys.find(rk => ruleGroups[rk].article === 'die');
  const firstMasc = suffixKeys.find(rk => ruleGroups[rk].article === 'der');
  const initial = [firstFem, firstMasc].filter(Boolean);
  if (initial.length < 2) {
    return unlockOrder.slice(0, 2);
  }
  return initial;
}

/**
 * Check if we should unlock a new rule.
 * Returns the ruleKey to unlock, or null.
 */
export function checkUnlock(history, unlockedRuleKeys, unlockOrder, unlockWindow = DEFAULT_UNLOCK_WINDOW, unlockThreshold = DEFAULT_UNLOCK_THRESHOLD) {
  if (unlockedRuleKeys.length >= unlockOrder.length) return null;
  if (history.length < unlockWindow) return null;

  const recent = history.slice(-unlockWindow);
  const correctCount = recent.filter(h => h.correct).length;
  const accuracy = correctCount / unlockWindow;

  if (accuracy >= unlockThreshold) {
    for (const rk of unlockOrder) {
      if (!unlockedRuleKeys.includes(rk)) {
        return rk;
      }
    }
  }
  return null;
}

/**
 * Save state to localStorage.
 */
export function saveState(state) {
  try {
    const s = {
      unlockedRuleKeys: state.unlockedRuleKeys,
      history: state.history,
      totalCorrect: state.totalCorrect,
      totalAnswered: state.totalAnswered,
      stakeCount: state.stakeCount,
      ruleStats: state.ruleStats,
      settings: state.settings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    // localStorage may be unavailable
  }
}

/**
 * Clear all saved state from localStorage.
 */
export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // localStorage may be unavailable
  }
}

/**
 * Load state from localStorage.
 * Returns the saved state object or null.
 */
export function loadState(ruleGroups) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const unlockedRuleKeys = (s.unlockedRuleKeys || []).filter(k => ruleGroups[k]);
    if (unlockedRuleKeys.length === 0) return null;
    return {
      unlockedRuleKeys,
      history: (s.history || []).slice(-HISTORY_SIZE),
      totalCorrect: s.totalCorrect || 0,
      totalAnswered: s.totalAnswered || 0,
      stakeCount: s.stakeCount || 0,
      ruleStats: s.ruleStats || {},
      settings: s.settings || null,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Format a rule key for display.
 */
export function formatRuleKey(group) {
  if (group.type === 'suffix') return 'Suffix: ' + group.key;
  if (group.type === 'exception') return group.key.replace(/_/g, ' ');
  return group.key.replace(/_/g, ' ');
}

/**
 * Format a rule key for the unlock overlay.
 */
export function formatUnlockKey(group) {
  if (group.type === 'suffix') return `Words ending in ${group.key}`;
  if (group.type === 'exception') return `Exception: ${group.key.replace(/_/g, ' ')}`;
  return group.key.replace(/_/g, ' ');
}

/**
 * Get CSS color variable for an article.
 */
export function articleColor(article) {
  return article === 'der' ? 'var(--der-dark)' : article === 'die' ? 'var(--die-dark)' : 'var(--das-dark)';
}
