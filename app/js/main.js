// Leonida Trophy Guide — boot, routing and event wiring.
import { loadState, saveState, exportState, importState, setEarned, setProgress, setNote, earnedCount, demoState } from "./store.js";
import { renderTracker, renderRoadmap, renderMissables, renderPlanner, renderSave, renderDetail } from "./views.js";

const params = new URLSearchParams(location.search);
let view = params.get("view") || "tracker";
let state = loadState();
let demo = params.get("demo") === "1";
if (demo) state = demoState();
if (params.get("spoiler") === "off") state.settings.spoiler = false;
if (params.get("spoiler") === "on") state.settings.spoiler = true;
if (params.get("theme") === "light" || params.get("theme") === "dark") state.settings.theme = params.get("theme");

const opts = { kind: "all", grade: "all", query: "", hideEarned: state.settings.hideEarned };
let selectedId = null;
let data = null;

const listCol = document.getElementById("list-col");
const detailCol = document.getElementById("detail-col");

function applyTheme() {
  document.body.dataset.theme = state.settings.theme;
}

function updateProgressHeader() {
  const earned = earnedCount(state, data.trophies);
  const pct = Math.round((earned / data.trophies.length) * 100);
  document.getElementById("progress-num").textContent = `${earned} / ${data.trophies.length}`;
  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("progress-sub").textContent =
    `${pct}% · 1 platinum · 2 gold · 6 silver · 46 bronze`;
}

function renderList(keepSearchFocus) {
  if (view === "tracker") listCol.innerHTML = renderTracker(state, data, opts, selectedId);
  else if (view === "roadmap") listCol.innerHTML = renderRoadmap(state, data);
  else if (view === "missables") listCol.innerHTML = renderMissables(state, data);
  else if (view === "planner") listCol.innerHTML = renderPlanner(state, data);
  else if (view === "save") listCol.innerHTML = renderSave(state, data);
  bindList();
  if (keepSearchFocus) {
    const q = document.getElementById("q");
    if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
}

function renderDetailPane() {
  detailCol.innerHTML = renderDetail(state, data, selectedId);
  bindDetail();
}

function renderAll(keepSearchFocus) {
  applyTheme();
  updateProgressHeader();
  document.querySelectorAll(".view-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  renderList(keepSearchFocus);
  renderDetailPane();
}

function download(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function bindList() {
  document.querySelectorAll(".view-btn").forEach((b) => {
    b.onclick = () => { view = b.dataset.view; renderAll(); };
  });
  const q = document.getElementById("q");
  if (q) q.oninput = () => { opts.query = q.value; renderList(true); };
  const gf = document.getElementById("grade-filter");
  if (gf) gf.onchange = () => { opts.grade = gf.value; renderList(); };
  const he = document.getElementById("hide-earned");
  if (he) he.onchange = () => { opts.hideEarned = he.checked; state.settings.hideEarned = he.checked; saveState(state); renderList(); };
  const sp = document.getElementById("spoiler");
  if (sp) sp.onchange = () => { state.settings.spoiler = sp.checked; saveState(state); renderAll(); };
  document.querySelectorAll("[data-kind]").forEach((c) => {
    c.onclick = () => { opts.kind = c.dataset.kind; renderList(); };
  });
  document.querySelectorAll(".trophy").forEach((el) => {
    el.onclick = (e) => {
      if (e.target.classList.contains("t-check")) return;
      selectedId = Number(el.dataset.id);
      renderAll();
    };
    el.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectedId = Number(el.dataset.id); renderAll(); }
    };
  });
  document.querySelectorAll(".t-check").forEach((cb) => {
    cb.onchange = () => {
      setEarned(state, Number(cb.dataset.id), cb.checked);
      renderAll();
    };
  });
  const exportBtn = document.getElementById("export-btn");
  if (exportBtn) exportBtn.onclick = () => download("leonida-trophy-guide-progress.json", exportState(state));
  const importBtn = document.getElementById("import-btn");
  const importFile = document.getElementById("import-file");
  if (importBtn && importFile) {
    importBtn.onclick = () => importFile.click();
    importFile.onchange = () => {
      const file = importFile.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          state = importState(String(reader.result));
          saveState(state);
          document.getElementById("save-msg").textContent = "Imported. Your progress was replaced with the file's.";
          renderAll();
        } catch (e) {
          document.getElementById("save-msg").textContent = "That file is not a Leonida Trophy Guide export.";
        }
      };
      reader.readAsText(file);
    };
  }
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) resetBtn.onclick = () => {
    if (confirm("Reset all progress, notes and counters?")) {
      localStorage.removeItem("leonida-trophy-guide-v1");
      state = loadState();
      renderAll();
    }
  };
  const spoilerSave = document.getElementById("spoiler-save");
  if (spoilerSave) spoilerSave.onchange = () => { state.settings.spoiler = spoilerSave.checked; saveState(state); renderAll(); };
  const themeBtn = document.getElementById("theme-btn");
  if (themeBtn) themeBtn.onclick = () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    saveState(state);
    renderAll();
  };
}

function bindDetail() {
  const earnedBox = document.getElementById("detail-earned");
  if (earnedBox) earnedBox.onchange = () => {
    const t = data.trophies.find((x) => x.id === selectedId) || data.trophies[0];
    setEarned(state, t.id, earnedBox.checked);
    renderAll();
  };
  const minus = document.getElementById("minus-btn");
  const plus = document.getElementById("plus-btn");
  const input = document.getElementById("progress-input");
  const t = data.trophies.find((x) => x.id === selectedId);
  if (t && t.target) {
    const bump = (d) => {
      const cur = (state.progress[t.id] || 0) + d;
      setProgress(state, t.id, cur, t.target);
      renderAll();
    };
    if (minus) minus.onclick = () => bump(-1);
    if (plus) plus.onclick = () => bump(1);
    if (input) input.onchange = () => {
      setProgress(state, t.id, input.value, t.target);
      renderAll();
    };
  }
  const notes = document.getElementById("notes-input");
  if (notes) {
    let timer = null;
    notes.oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setNote(state, t.id, notes.value), 400);
    };
  }
}

fetch("./data/trophies.json")
  .then((r) => r.json())
  .then((json) => {
    data = json;
    if (!selectedId) selectedId = 17;
    renderAll();
  })
  .catch(() => {
    listCol.innerHTML = `<div class="empty">Could not load the trophy list (data/trophies.json).</div>`;
  });
