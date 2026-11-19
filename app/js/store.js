// Leonida Trophy Guide — progress store.
// Progress lives in the browser (localStorage), never on a server.
// Export/import moves it as a plain JSON file, so a player can back it up
// or carry it to another browser.
export const STORAGE_KEY = "leonida-trophy-guide-v1";

function defaultState() {
  return {
    earned: {},
    progress: {},
    notes: {},
    settings: { spoiler: true, hideEarned: false, theme: "dark" },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      earned: parsed.earned || base.earned,
      progress: parsed.progress || base.progress,
      notes: parsed.notes || base.notes,
      settings: { ...base.settings, ...(parsed.settings || {}) },
    };
  } catch (e) {
    return defaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportState(state) {
  return JSON.stringify({ app: "leonida-trophy-guide", version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function importState(text) {
  const parsed = JSON.parse(text);
  if (parsed.app !== "leonida-trophy-guide") throw new Error("not a Leonida Trophy Guide export");
  const base = defaultState();
  return {
    earned: parsed.earned || base.earned,
    progress: parsed.progress || base.progress,
    notes: parsed.notes || base.notes,
    settings: { ...base.settings, ...(parsed.settings || {}) },
  };
}

export function isEarned(state, id) {
  return !!state.earned[id];
}

export function setEarned(state, id, earned) {
  if (earned) state.earned[id] = true;
  else delete state.earned[id];
  saveState(state);
}

export function getProgress(state, id) {
  return state.progress[id] || 0;
}

export function setProgress(state, id, value, target) {
  const n = Math.max(0, Math.min(target || 0, Math.floor(Number(value) || 0)));
  if (n <= 0) delete state.progress[id];
  else state.progress[id] = n;
  saveState(state);
  return n;
}

export function setNote(state, id, text) {
  if (text.trim()) state.notes[id] = text;
  else delete state.notes[id];
  saveState(state);
}

export function earnedCount(state, trophies) {
  return trophies.filter((t) => isEarned(state, t.id)).length;
}

// Demo seed for screenshots: 13 trophies earned, a few counters part way.
// Only used when the page is opened with ?demo=1 — never persisted.
export function demoState(trophies) {
  const state = defaultState();
  state.settings.spoiler = false;
  const earnedIds = [2, 3, 8, 15, 20, 21, 33, 35, 44, 46, 53, 16, 32];
  for (const id of earnedIds) state.earned[id] = true;
  state.progress[15] = 250; // Cunning Stunts done
  state.progress[17] = 31; // The Shootist part way
  state.progress[31] = 57; // WAiNK It part way
  state.progress[35] = 64; // Whip It Good part way
  state.progress[42] = 38; // The Goodtime State part way
  state.progress[52] = 112400; // Dime on the Dollar part way
  state.notes[17] = "Gold on 31 of 42 so far — the long-range ones are the hard part.";
  return state;
}
