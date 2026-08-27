/* Navigating Philosophy, shared behaviour.
 *
 * Everything in this file is identical across every activity:
 * the two play modes and the skip button, the glossary, walking
 * by pointer, saving and resuming, the split between narration
 * and speech, the collapsible description, and the status line.
 *
 * Each activity defines ACTIVITY_KEY before loading this file,
 * and supplies its own prompts, dialogue, and drawing.
 */
"use strict";

let statusHideAt = 0;
function statusElement() { return document.getElementById("status"); }
function setStatus(txt) {
  const el = statusElement();
  if (el) el.textContent = txt || "";
  statusHideAt = txt ? performance.now() + 6000 : 0;
}
function clearStatus() {
  const el = statusElement();
  if (el) el.textContent = "";
  statusHideAt = 0;
}
function tickStatus() {
  if (statusHideAt && performance.now() > statusHideAt) clearStatus();
}

/* =========================================================
   Play modes, skipping, glossary, and pointer walking.
   Added so the activity suits a casual visitor and a graded
   student without being two separate files.
   ========================================================= */
const PLAY = (function () {
  let forced = null;
  try {
    const q = new URLSearchParams(window.location.search).get("mode");
    if (q === "course" || q === "open") forced = q;
  } catch (err) { forced = null; }
  let saved = null;
  try { saved = localStorage.getItem("phil_play_mode"); } catch (err) { saved = null; }
  return {
    mode: forced || (saved === "course" ? "course" : "open"),
    locked: forced !== null
  };
})();
function courseMode() { return PLAY.mode === "course"; }
function lastPromptKey() {
  const k = Object.keys(prompts);
  return k[k.length - 1];
}
function promptRequired(key) {
  return courseMode() && key === lastPromptKey();
}
function setPlayMode(m) {
  PLAY.mode = m;
  try { localStorage.setItem("phil_play_mode", m); } catch (err) { /* storage is optional */ }
  paintModeButton();
}
function paintModeButton() {
  const b = document.getElementById("modeToggle");
  if (!b) return;
  b.textContent = courseMode() ? "Course mode is on" : "Relaxed mode is on";
  b.title = courseMode()
    ? "Course mode asks for one written answer at the end, and shows the quiz and discussion questions."
    : "Relaxed mode lets you skip any question, and hides the quiz and discussion questions.";
}
(function installModeButton() {
  const row = document.querySelector(".controls-row");
  if (!row || PLAY.locked) return;
  const b = document.createElement("button");
  b.id = "modeToggle";
  b.addEventListener("click", () => setPlayMode(courseMode() ? "open" : "course"));
  row.insertBefore(b, row.firstChild);
  paintModeButton();
})();

/* A Skip button inside the question box. */
(function installSkip() {
  const bar = document.getElementById("modalButtons");
  if (!bar) return;
  const b = document.createElement("button");
  b.id = "skipPrompt";
  b.textContent = "Skip this question";
  b.addEventListener("click", () => {
    if (!activePrompt) return;
    const p = prompts[activePrompt.key];
    reflectionLog.push({
      stage: p.title, prompt: p.text, choice: null, response: "(skipped)"
    });
    if (window.speechSynthesis) speechSynthesis.cancel();
    overlay.classList.remove("open");
    paused = false;
    const cb = activePrompt.onDone;
    activePrompt = null;
    if (typeof saveProgress === "function") saveProgress();
    if (cb) cb();
  });
  bar.insertBefore(b, bar.firstChild);
})();

/* Plain definitions for words worth keeping but worth glossing. */
const GLOSSARY = {
  "contrivance": "parts put together so they accomplish a purpose",
  "contingent": "able to exist or not exist, rather than having to exist",
  "contingency": "the fact that something could just as well not have existed",
  "necessary being": "something that could not have failed to exist",
  "efficient cause": "whatever brings a thing about",
  "omnipotent": "able to do anything",
  "omnipotence": "the power to do anything",
  "theodicy": "an attempt to explain why a good God would allow suffering",
  "aporia": "the state of being stuck, after realizing you do not know",
  "anamnesis": "the idea that learning is really remembering",
  "recollection": "remembering something the soul is said to have known already",
  "expectation": "the value of a bet, found by multiplying the prize by its chance",
  "premise": "a statement an argument builds on",
  "regress": "a chain of causes or reasons that keeps going back",
  "analogy": "an argument that two things alike in some ways are alike in others",
  "skeptic": "someone who withholds judgment until the evidence settles it",
  "virtue": "a settled habit of character that makes someone good at living",
  "rhetoric": "the craft of persuading an audience",
  "sophist": "a paid teacher of argument and persuasion in ancient Greece",
  "dialectic": "working toward truth by question and answer",
  "metaphysics": "the study of what exists and what it is like",
  "epistemology": "the study of knowledge and how we get it",
  "double effect": "the idea that harm you intend differs from harm you only foresee"
};
const GLOSS_KEYS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
function escapeForHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function escapeForRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function glossify(el, text) {
  let html = escapeForHtml(text);
  const used = {};
  GLOSS_KEYS.forEach(term => {
    if (used[term]) return;
    const re = new RegExp("\\b(" + escapeForRegex(term) + ")\\b", "i");
    if (!re.test(html)) return;
    used[term] = true;
    html = html.replace(re,
      '<span class="gloss" tabindex="0" role="button" data-def="' +
      escapeForHtml(GLOSSARY[term]) + '">$1</span>');
  });
  el.innerHTML = html;
  el.querySelectorAll(".gloss").forEach(sp => {
    const show = () => {
      let tip = sp.querySelector(".gloss-tip");
      if (tip) { tip.remove(); return; }
      tip = document.createElement("span");
      tip.className = "gloss-tip";
      tip.textContent = sp.dataset.def;
      sp.appendChild(tip);
    };
    sp.addEventListener("click", show);
    sp.addEventListener("keydown", ev => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); show(); }
    });
  });
}

/* Walking by pointer, for anyone who would rather not use keys. */
let moveTarget = null;
(function installPointerWalk() {
  if (typeof canvas === "undefined" || !canvas.addEventListener) return;
  if (typeof camX === "undefined") return;
  canvas.addEventListener("click", ev => {
    if (typeof player === "undefined" || !player.canMove) return;
    if (typeof dialogueActive !== "undefined" && dialogueActive) return;
    if (paused) return;
    const rect = canvas.getBoundingClientRect();
    const sx = (ev.clientX - rect.left) * (canvas.width / rect.width);
    moveTarget = sx + camX;
  });
  const row = document.querySelector(".controls-row");
  if (!row) return;
  const b = document.createElement("button");
  b.id = "walkNext";
  b.textContent = "Walk to the next stop";
  b.addEventListener("click", () => {
    if (typeof player === "undefined" || !player.canMove) return;
    let x = null;
    try {
      if (typeof STATIONS !== "undefined" && typeof nextStationIndex === "function") {
        const i = nextStationIndex();
        if (i >= 0) x = STATIONS[i].x;
      }
    } catch (err) { x = null; }
    if (x === null && typeof STAND_X !== "undefined") x = STAND_X;
    if (x !== null) moveTarget = x;
  });
  row.appendChild(b);
})();
function applyPointerWalk(dt) {
  if (moveTarget === null) return;
  if (typeof player === "undefined" || !player.canMove) { moveTarget = null; return; }
  if (typeof dialogueActive !== "undefined" && dialogueActive) { moveTarget = null; return; }
  const d = moveTarget - player.x;
  if (Math.abs(d) < 6) { moveTarget = null; return; }
  const step = 210 * dt * (d > 0 ? 1 : -1);
  player.x += step;
  player.facing = d > 0 ? 1 : -1;
}

/* =========================================================
   Saving in the middle. Closing the tab no longer loses the
   activity: what is answered and how far the walk has gone
   are stored, and a Resume button appears next time.
   ========================================================= */
const SAVE_SLOT = "phil_save_" + (typeof ACTIVITY_KEY !== "undefined" ? ACTIVITY_KEY : "unknown");
function snapshotProgress() {
  const s = { log: reflectionLog, when: Date.now() };
  try { if (typeof flags !== "undefined") s.flags = flags; } catch (err) { /* none */ }
  try { if (typeof player !== "undefined") s.px = player.x; } catch (err) { /* none */ }
  try { if (typeof scene !== "undefined") s.scene = scene; } catch (err) { /* none */ }
  try { if (typeof diagramStage !== "undefined") s.diagram = diagramStage; } catch (err) { /* none */ }
  try { if (typeof record !== "undefined") s.record = record; } catch (err) { /* none */ }
  return s;
}
function saveProgress() {
  try { localStorage.setItem(SAVE_SLOT, JSON.stringify(snapshotProgress())); }
  catch (err) { /* storage is optional */ }
}
function clearProgress() {
  try { localStorage.removeItem(SAVE_SLOT); } catch (err) { /* storage is optional */ }
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_SLOT);
    return raw ? JSON.parse(raw) : null;
  } catch (err) { return null; }
}
function restoreProgress(s) {
  if (!s) return;
  if (s.log && s.log.length) {
    reflectionLog.length = 0;
    s.log.forEach(r => reflectionLog.push(r));
  }
  if (s.flags && typeof flags !== "undefined") {
    Object.keys(s.flags).forEach(k => { if (k in flags) flags[k] = s.flags[k]; });
  }
  if (s.record && typeof record !== "undefined") {
    Object.keys(s.record).forEach(k => { record[k] = s.record[k]; });
  }
  if (typeof s.px === "number" && typeof player !== "undefined") player.x = s.px;
  if (typeof s.diagram === "number" && typeof diagramStage !== "undefined") diagramStage = s.diagram;
  if (typeof player !== "undefined") player.canMove = true;
  if (typeof camX !== "undefined" && typeof W !== "undefined" && typeof WORLD_W !== "undefined") {
    camX = Math.min(Math.max(player.x - 430, 0), WORLD_W - W);
  }
}
(function installResume() {
  const saved = loadProgress();
  if (!saved) return;
  const row = document.querySelector(".controls-row");
  if (!row) return;
  const b = document.createElement("button");
  b.id = "resumeBtn";
  b.className = "primary";
  b.textContent = "Resume where you left off";
  b.addEventListener("click", () => {
    if (typeof flags !== "undefined") flags.started = true;
    else if (typeof started !== "undefined") started = true;
    restoreProgress(saved);
    const sb = document.getElementById("startBtn");
    if (sb) sb.disabled = true;
    b.disabled = true;
    if (typeof setObjective === "function") {
      setObjective("Picking up where you stopped. Press E to continue from here.");
    }
  });
  row.appendChild(b);
})();

/* =========================================================
   Narration and speech are shown apart, so scene description
   never runs into what a person actually says.
   ========================================================= */
const SPEAKERS = ["Anaxagoras", "Anaximenes", "Anselm", "Aquinas", "Aristotle", "Captain", "Collector", "Crito", "Democritus", "Descartes", "Elisabeth", "Empedocles", "Epictetus", "Euthyphro", "Gatekeeper", "Glaucon", "Guard", "Heraclitus", "Herald", "Hypatia", "Infirmarer", "Jailer", "Meletus", "Neighbor", "Paley", "Parmenides", "Pascal", "Passenger", "Patient", "Pheidippides", "Plato", "Porter", "Prisoner", "Pythagoras", "Right Argument", "Rufus", "Sextus", "Socrates", "Strepsiades", "Student", "Synesius", "Thales", "Vendor", "Wrong Argument", "You", "Zeno"];
function splitNarration(text) {
  let best = null;
  SPEAKERS.forEach(nm => {
    const i = text.indexOf(nm + ": ");
    if (i < 0) return;
    if (i > 0) {
      const before = text.charAt(i - 1);
      if (before !== " " || !/[.!?"\u2019]/.test(text.charAt(i - 2) || "")) {
        if (i > 0 && !/[.!?] $/.test(text.slice(Math.max(0, i - 2), i))) return;
      }
    }
    if (best === null || i < best.i) best = { i: i, name: nm };
  });
  if (best === null) return { narration: text, speaker: null, speech: "" };
  return {
    narration: text.slice(0, best.i).trim(),
    speaker: best.name,
    speech: text.slice(best.i + best.name.length + 1).trim()
  };
}
function renderCardText(text) {
  const nEl = document.getElementById("dlgNarration");
  const sEl = document.getElementById("dlgSpeaker");
  const parts = splitNarration(text);
  if (nEl) {
    if (parts.narration) {
      if (typeof glossify === "function") glossify(nEl, parts.narration);
      else nEl.textContent = parts.narration;
      nEl.style.display = "block";
    } else {
      nEl.textContent = "";
      nEl.style.display = "none";
    }
  }
  if (sEl) {
    sEl.textContent = parts.speaker || "";
    sEl.style.display = parts.speaker ? "block" : "none";
  }
  if (parts.speaker) {
    dlgLine.classList.add("speech");
    if (typeof glossify === "function") glossify(dlgLine, parts.speech);
    else dlgLine.textContent = parts.speech;
    dlgLine.style.display = "block";
  } else {
    dlgLine.classList.remove("speech");
    dlgLine.textContent = "";
    dlgLine.style.display = "none";
  }
}

/* The activity description is tucked behind the title, so the
   scene starts higher up the page. Hover on a mouse, tap or
   Enter otherwise. */
(function setupAbout() {
  const wrap = document.querySelector(".about-wrap");
  if (!wrap) return;
  const h = wrap.querySelector("h1");
  if (!h) return;
  h.setAttribute("tabindex", "0");
  h.setAttribute("role", "button");
  h.setAttribute("aria-expanded", "false");
  h.setAttribute("aria-controls", "aboutText");
  function toggle() {
    const open = wrap.classList.toggle("open");
    h.setAttribute("aria-expanded", open ? "true" : "false");
  }
  h.addEventListener("click", toggle);
  h.addEventListener("keydown", ev => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggle(); }
    if (ev.key === "Escape") { wrap.classList.remove("open"); h.setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("click", ev => {
    if (!wrap.contains(ev.target)) {
      wrap.classList.remove("open");
      h.setAttribute("aria-expanded", "false");
    }
  });
})();

function hideCourseworkIfRelaxed() {
  if (typeof courseMode === "function" && courseMode()) return;
  const quiz = document.getElementById("quizSection");
  if (quiz) quiz.style.display = "none";
  const d1 = document.getElementById("discussion1");
  if (d1 && d1.closest) {
    const box = d1.closest(".section-box");
    if (box) box.style.display = "none";
  }
  document.querySelectorAll("#endScreen p").forEach(p => {
    if (p.textContent.indexOf("assigned this activity for credit") !== -1) p.style.display = "none";
  });
}
