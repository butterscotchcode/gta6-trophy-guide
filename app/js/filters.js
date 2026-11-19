// Leonida Trophy Guide — filtering and the spoiler mask.
// A trophy is spoiler-hidden when the spoiler setting is on, it is a story
// trophy, and it has not been earned yet: its name and description stay
// hidden until the player earns it.
import { isEarned } from "./store.js";

export const KINDS = [
  ["all", "All"],
  ["story", "Story"],
  ["side", "Side strands"],
  ["activities", "Activities"],
  ["collectibles", "Collectibles"],
  ["exploration", "Exploration"],
  ["combat", "Combat"],
  ["money", "Money"],
  ["misc", "Other"],
  ["completion", "Completion"],
  ["platinum", "Platinum"],
];

export const GRADES = [
  ["all", "All grades"],
  ["platinum", "Platinum"],
  ["gold", "Gold"],
  ["silver", "Silver"],
  ["bronze", "Bronze"],
];

export function isSpoilerHidden(state, trophy) {
  return state.settings.spoiler && trophy.kind === "story" && !isEarned(state, trophy.id);
}

export function filterTrophies(state, trophies, opts) {
  const q = (opts.query || "").trim().toLowerCase();
  return trophies.filter((t) => {
    if (opts.kind && opts.kind !== "all" && t.kind !== opts.kind) return false;
    if (opts.grade && opts.grade !== "all" && t.grade !== opts.grade) return false;
    if (opts.hideEarned && isEarned(state, t.id)) return false;
    if (q) {
      const hay = (t.name + " " + t.description + " " + t.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function kindLabel(kind) {
  const found = KINDS.find((k) => k[0] === kind);
  return found ? found[1] : kind;
}
