/* Bracketeer UI: input rules, live preview, keyboard support, history. */

const exprEl = document.getElementById("expr");
const previewEl = document.getElementById("preview");
const historyEl = document.getElementById("history");
const clearHistoryBtn = document.getElementById("clear-history");

const isOp = (c) => "+−×÷".includes(c);
const isDigit = (c) => /[0-9]/.test(c);

let expr = "";
let finished = false; // true right after "="
let history = loadHistory();

/* ---------- input rules ---------- */

function startFresh() {
  if (finished) { expr = ""; finished = false; }
}

function pressDigit(d) {
  startFresh();
  if (expr.slice(-1) === ")") expr += "×";
  expr += d;
}

function pressDot() {
  startFresh();
  const segment = expr.match(/[0-9.]*$/)[0];
  if (segment.includes(".")) return;
  if (segment === "") {
    if (expr.slice(-1) === ")") expr += "×";
    expr += "0.";
  } else {
    expr += ".";
  }
}

function pressOperator(op) {
  finished = false;
  const last = expr.slice(-1);
  if (expr === "" || last === "(") {
    if (op === "−") expr += "−"; // leading minus: −5, (−5
    return;
  }
  if (isOp(last)) {
    const before = expr.slice(-2, -1);
    const unaryMinus = last === "−" && (before === "" || before === "(");
    if (unaryMinus) return;
    expr = expr.slice(0, -1) + op; // swap 5+ → 5×
    return;
  }
  expr += op;
}

function pressOpen() {
  finished = false;
  const last = expr.slice(-1);
  if (isDigit(last) || last === "." || last === ")") expr += "×";
  expr += "(";
}

function pressClose() {
  finished = false;
  const open = (expr.match(/\(/g) || []).length - (expr.match(/\)/g) || []).length;
  const last = expr.slice(-1);
  if (open <= 0) return flash("No open bracket to close");
  if (!(isDigit(last) || last === "." || last === ")")) return;
  expr += ")";
}

function pressBackspace() {
  if (finished) finished = false;
  expr = expr.slice(0, -1);
}

function pressClear() {
  expr = "";
  finished = false;
}

function pressEquals() {
  if (expr === "") return;
  try {
    const value = Engine.evaluate(expr);
    const shown = Engine.tidy(expr);
    const answer = Engine.format(value);
    history.unshift({ expr: shown, answer });
    history = history.slice(0, 6);
    saveHistory();
    expr = answer;
    finished = true;
    render({ note: shown + " =" });
    renderHistory();
  } catch (err) {
    render({ error: err.message });
  }
}

/* ---------- rendering ---------- */

function renderExpression() {
  exprEl.textContent = "";
  let depth = 0;
  for (const ch of expr) {
    const span = document.createElement("span");
    span.textContent = ch;
    if (ch === "(") span.className = "b d" + (depth++ % 4);
    else if (ch === ")") span.className = "b d" + (--depth % 4 < 0 ? 0 : depth % 4);
    else if (isOp(ch)) span.className = "op";
    exprEl.appendChild(span);
  }
  // ghost closing brackets show what will auto-close
  for (let d = depth - 1; d >= 0; d--) {
    const ghost = document.createElement("span");
    ghost.className = "b ghost d" + (d % 4);
    ghost.textContent = ")";
    exprEl.appendChild(ghost);
  }
  exprEl.scrollLeft = exprEl.scrollWidth;
  exprEl.classList.toggle("final", finished);
}

function render({ note, error } = {}) {
  renderExpression();
  previewEl.classList.remove("error");
  if (error) {
    previewEl.textContent = error;
    previewEl.classList.add("error");
    return;
  }
  if (note) { previewEl.textContent = note; return; }
  if (expr === "" ) { previewEl.textContent = "Type a sum, use ( ) to group"; return; }
  try {
    previewEl.textContent = "= " + Engine.format(Engine.evaluate(expr));
  } catch {
    previewEl.textContent = "";
  }
}

let flashTimer;
function flash(message) {
  previewEl.textContent = message;
  previewEl.classList.add("error");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => render(), 1400);
}

function renderHistory() {
  historyEl.textContent = "";
  if (history.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Finished sums appear here.";
    historyEl.appendChild(li);
    return;
  }
  history.forEach((item) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "history-item";
    btn.setAttribute("aria-label", `Reuse ${item.answer} from ${item.expr}`);
    const e = document.createElement("span");
    e.className = "h-expr";
    e.textContent = item.expr;
    const a = document.createElement("span");
    a.className = "h-answer";
    a.textContent = "= " + item.answer;
    btn.append(e, a);
    btn.addEventListener("click", () => {
      expr = item.answer;
      finished = true;
      render({ note: item.expr + " =" });
    });
    li.appendChild(btn);
    historyEl.appendChild(li);
  });
}

/* ---------- history storage (safe if storage is blocked) ---------- */

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem("bracketeer-history"));
    return Array.isArray(saved) ? saved.slice(0, 6) : [];
  } catch { return []; }
}
function saveHistory() {
  try { localStorage.setItem("bracketeer-history", JSON.stringify(history)); } catch {}
}

/* ---------- wiring ---------- */

function handleKey(key) {
  if (isDigit(key)) pressDigit(key);
  else if (key === ".") pressDot();
  else if (isOp(key)) pressOperator(key);
  else if (key === "(") pressOpen();
  else if (key === ")") pressClose();
  else if (key === "del") pressBackspace();
  else if (key === "ac") pressClear();
  else if (key === "eq") { pressEquals(); return; }
  render();
}

document.querySelector(".keys").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-key]");
  if (btn) handleKey(btn.dataset.key);
});

const KEYBOARD = {
  "+": "+", "-": "−", "*": "×", "x": "×", "X": "×", "/": "÷",
  "(": "(", ")": ")", "[": "(", "]": ")", ".": ".", ",": ".",
  "Enter": "eq", "=": "eq", "Backspace": "del", "Escape": "ac", "Delete": "ac",
};

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.closest("#theme-toggle, .history")) return; // let those buttons use Enter normally
  const key = isDigit(e.key) ? e.key : KEYBOARD[e.key];
  if (!key) return;
  e.preventDefault(); // also stops Enter from clicking a focused button
  handleKey(key);
  const btn = document.querySelector(`button[data-key="${key}"]`);
  if (btn) {
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 110);
  }
});

clearHistoryBtn.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
});

render();
renderHistory();

/* ---------- theme (light / dark) ---------- */

const themeBtn = document.getElementById("theme-toggle");
const themeMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.setAttribute("aria-pressed", String(theme === "dark"));
  themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#0c0f1d" : "#e9ecff");
}

themeBtn.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("bracketeer-theme", next); } catch {}
});

// follow the device setting until the user picks a theme themselves
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
systemDark.addEventListener("change", (e) => {
  let saved = null;
  try { saved = localStorage.getItem("bracketeer-theme"); } catch {}
  if (!saved) applyTheme(e.matches ? "dark" : "light");
});

applyTheme(document.documentElement.getAttribute("data-theme") || "light");