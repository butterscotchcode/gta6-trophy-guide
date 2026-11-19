// Leonida Trophy Guide — the five views and the trophy detail pane.
import { isEarned, getProgress, earnedCount } from "./store.js";
import { isSpoilerHidden, filterTrophies, gradeLabel, kindLabel, KINDS, GRADES } from "./filters.js";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function gradeBadge(t) {
  return `<span class="badge ${t.grade}">${gradeLabel(t.grade)}</span>`;
}

function flagBadges(t) {
  let out = "";
  if (t.missable) out += `<span class="badge missable">Missable</span>`;
  if (t.watch) out += `<span class="badge watch">Watch</span>`;
  return out;
}

function targetBar(state, t) {
  if (!t.target) return "";
  const got = getProgress(state, t.id);
  const pct = Math.min(100, Math.round((got / t.target) * 100));
  const label = t.target >= 1000 ? got.toLocaleString("en-US") + " / " + t.target.toLocaleString("en-US") : got + " / " + t.target;
  return `<div class="t-target">${esc(label)} ${esc(t.target_label || "")}<div class="bar"><div style="width:${pct}%"></div></div></div>`;
}

export function renderTracker(state, data, opts, selectedId) {
  const list = filterTrophies(state, data.trophies, opts);
  let html = `<div class="toolbar">
    <input type="search" id="q" placeholder="Search trophies, guides…" value="${esc(opts.query || "")}" aria-label="Search trophies">
    <select id="grade-filter" aria-label="Filter by grade">` +
    GRADES.map(([v, l]) => `<option value="${v}"${opts.grade === v ? " selected" : ""}>${l}</option>`).join("") +
    `</select>
    <label class="toggle"><input type="checkbox" id="hide-earned"${opts.hideEarned ? " checked" : ""}> Hide earned</label>
    <label class="toggle"><input type="checkbox" id="spoiler"${state.settings.spoiler ? " checked" : ""}> Hide story spoilers</label>
  </div>
  <div class="toolbar">` +
    KINDS.map(([v, l]) => `<button class="chip${opts.kind === v ? " active" : ""}" data-kind="${v}">${l}</button>`).join("") +
    `</div>
  <p style="color:var(--muted);font-size:13px;margin:0 0 10px">Showing ${list.length} of 55 trophies · ${earnedCount(state, data.trophies)} earned · click a trophy for its guide, sources and notes.</p>`;
  if (!list.length) return html + `<div class="empty">No trophies match these filters.</div>`;
  for (const t of list) {
    const hidden = isSpoilerHidden(state, t);
    const earned = isEarned(state, t.id);
    const name = hidden ? "Hidden trophy — earn it to reveal" : esc(t.name);
    const desc = hidden ? "A story trophy. Its name and description stay hidden until you earn it." : esc(t.description);
    html += `<article class="trophy${earned ? " earned" : ""}${selectedId === t.id ? " selected" : ""}" data-id="${t.id}" tabindex="0">
      <input type="checkbox" class="t-check" data-id="${t.id}"${earned ? " checked" : ""} aria-label="Mark ${esc(t.name)} earned">
      <div>
        <div class="t-name">${name}</div>
        <div class="t-desc">${desc}</div>
        <div class="t-meta">${gradeBadge(t)}${t.kind !== t.grade ? `<span class="badge kind">${kindLabel(t.kind)}</span>` : ""}${flagBadges(t)}<span class="badge rarity">Rarity ${t.rarity}%</span></div>
        ${targetBar(state, t)}
      </div>
      <div class="t-right">#${t.id}<br>Stage ${t.stage}</div>
    </article>`;
  }
  return html;
}

export function renderRoadmap(state, data) {
  let html = `<div class="callout"><h2>Road to the platinum</h2>
  <p>Seven stages, in the order that wastes the least time. Story first, side strands while they are open, then activities, collectibles and money — and the platinum last. Every trophy sits in exactly one stage.</p></div>`;
  for (const stage of data.stages) {
    const inStage = data.trophies.filter((t) => t.stage === stage.n);
    const done = inStage.filter((t) => isEarned(state, t.id)).length;
    const pct = Math.round((done / inStage.length) * 100);
    html += `<section class="stage"><h2>Stage ${stage.n} — ${esc(stage.title)} (${done}/${inStage.length})</h2>
    <p class="stage-note">${esc(stage.note)}</p>
    <div class="bar"><div style="width:${pct}%"></div></div>
    <ul>${inStage.map((t) => `<li class="${isEarned(state, t.id) ? "done" : ""}">${isSpoilerHidden(state, t) ? "Hidden story trophy" : esc(t.name)} ${t.missable ? "· missable" : ""}${t.watch ? " · watch" : ""}</li>`).join("")}</ul>
    </section>`;
  }
  return html;
}

export function renderMissables(state, data) {
  const missable = data.trophies.filter((t) => t.missable);
  const watch = data.trophies.filter((t) => t.watch);
  let html = `<div class="callout"><h2>Missables — read this first</h2>
  <p>Built from the official descriptions only. The game is a day old, so where a window is not yet confirmed in play, this page says so instead of guessing. Story mission trophies are <b>not</b> flagged: missions are replayable, so a missed story trophy can be earned again.</p></div>
  <section class="stage"><h2>Possibly missable — do them when the chance comes</h2>
  <ul>${missable.map((t) => `<li><b>${esc(t.name)}</b> — ${esc(t.guide)}</li>`).join("")}</ul></section>
  <section class="stage"><h2>Watch list — check early, do not leave to the end</h2>
  <ul>${watch.map((t) => `<li><b>${esc(t.name)}</b> — ${esc(t.guide)}</li>`).join("")}</ul></section>
  <section class="stage"><h2>Not missable</h2>
  <p class="stage-note">Everything else: story chapters and named missions (replayable), collectibles (free roam), activities and challenges (repeatable), money and combat feats (repeatable). If a first attempt fails, retry it.</p></section>`;
  return html;
}

export function renderPlanner(state, data) {
  const remaining = data.trophies.filter((t) => !isEarned(state, t.id));
  const nextUp = [...remaining].sort((a, b) => (a.stage - b.stage) || (b.rarity - a.rarity)).slice(0, 5);
  const counted = remaining.filter((t) => t.target);
  const closest = [...counted].sort((a, b) => (getProgress(state, b.id) / b.target) - (getProgress(state, a.id) / a.target)).slice(0, 5);
  let html = `<div class="callout"><h2>Next up</h2>
  <p>Five trophies to chase next: the earliest roadmap stage first, easiest (most common) first within it. Finish a stage before moving on.</p></div>
  <section class="stage"><h2>Chase these next</h2><ul>`;
  for (const t of nextUp) {
    html += `<li><b>${isSpoilerHidden(state, t) ? "Hidden story trophy" : esc(t.name)}</b> — stage ${t.stage}, ${gradeLabel(t.grade)}, rarity ${t.rarity}%${t.missable ? " · missable" : ""}${t.watch ? " · watch" : ""}<br><span style="color:var(--muted)">${esc(t.guide)}</span></li>`;
  }
  html += `</ul></section>`;
  if (closest.length) {
    html += `<section class="stage"><h2>Closest to done</h2><ul>`;
    for (const t of closest) {
      const got = getProgress(state, t.id);
      const fmt = (n) => n >= 1000 ? n.toLocaleString("en-US") : String(n);
      html += `<li><b>${esc(t.name)}</b> — ${fmt(got)}/${fmt(t.target)} ${esc(t.target_label || "")}</li>`;
    }
    html += `</ul></section>`;
  }
  return html;
}

export function renderSave(state, data) {
  const earned = earnedCount(state, data.trophies);
  return `<div class="callout"><h2>Save &amp; settings</h2>
  <p>Your progress lives in this browser only — nothing is sent anywhere. Export a backup file, or import one to move your progress to another browser.</p></div>
  <section class="stage"><h2>Progress</h2>
  <p class="stage-note">${earned} of 55 trophies earned (${Math.round((earned / 55) * 100)}%).</p>
  <div class="btn-row">
    <button class="btn" id="export-btn">Export progress (.json)</button>
    <button class="btn ghost" id="import-btn">Import progress…</button>
    <input type="file" id="import-file" accept="application/json" hidden>
    <button class="btn ghost" id="reset-btn">Reset all progress</button>
  </div>
  <p class="stage-note" id="save-msg"></p></section>
  <section class="stage"><h2>Settings</h2>
  <label class="toggle"><input type="checkbox" id="spoiler-save"${state.settings.spoiler ? " checked" : ""}> Hide story spoilers until earned</label>
  <div class="btn-row">
    <button class="btn ghost" id="theme-btn">Switch to ${state.settings.theme === "dark" ? "light (paper)" : "dark (dusk)"} theme</button>
  </div></section>
  <section class="stage"><h2>How this guide was made</h2>
  <p class="stage-note">${esc(data.sources_note)}</p>
  <p class="stage-note">List: ${esc(data.list)}. Unofficial fan guide. Not affiliated with Rockstar Games or PlayStation.</p></section>`;
}

export function renderDetail(state, data, trophyId) {
  const t = data.trophies.find((x) => x.id === trophyId) || data.trophies.find((x) => !isEarned(state, x.id)) || data.trophies[0];
  const hidden = isSpoilerHidden(state, t);
  const earned = isEarned(state, t.id);
  let html = `<h2>${hidden ? "Hidden trophy" : esc(t.name)}</h2>
  <div class="t-meta">${gradeBadge(t)}${t.kind !== t.grade ? `<span class="badge kind">${kindLabel(t.kind)}</span>` : ""}${flagBadges(t)}<span class="badge rarity">Rarity ${t.rarity}%</span></div>
  <p class="official">“${hidden ? "Hidden until earned." : esc(t.description)}”</p>
  <p><label class="toggle"><input type="checkbox" id="detail-earned"${earned ? " checked" : ""}> Earned</label></p>`;
  if (!hidden) {
    html += `<h3>Guide</h3><p>${esc(t.guide)}</p>`;
    if (t.target) {
      const got = getProgress(state, t.id);
      html += `<h3>Progress — ${esc(t.target_label || "")}</h3>
      <div class="counter-row">
        <button id="minus-btn" aria-label="Decrease progress">−</button>
        <input type="number" id="progress-input" min="0" max="${t.target}" value="${got}" aria-label="Progress count">
        <button id="plus-btn" aria-label="Increase progress">+</button>
        <span>/ ${t.target.toLocaleString("en-US")}</span>
      </div>`;
    }
    html += `<h3>Your notes</h3>
    <textarea class="notes" id="notes-input" placeholder="Where did you find it? What worked?">${esc(state.notes[t.id] || "")}</textarea>
    <h3>Sources</h3>
    <p class="sources">${esc(t.sources)}</p>`;
  } else {
    html += `<h3>Guide</h3><p>Earn this trophy to reveal its guide. The spoiler setting hides story trophies until they are earned — turn it off in the Tracker toolbar or in Save &amp; settings.</p>`;
  }
  return html;
}
