/*
  Dash — app.js
  This is the only place data gets read, changed, or saved.
  Everything lives in the browser's localStorage under one key,
  so closing the tab never loses your numbers.
*/

const STORAGE_KEY = "dashData";

const defaultData = {
  revenue: [],   // { id, month: "2026-09", skool: 1200, pipeline: 3000 }
  clients: [],   // { id, name, stage: "hot"|"warm"|"cold", nextAction }
  skool: { premiumClients: 0, conversionRate: 0 },
  events: [],    // { id, date: "2026-09-15", title }
  todos: []      // { id, text, done }
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultData), ...parsed };
  } catch (e) {
    console.warn("Dash: couldn't read saved data, starting fresh.", e);
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let data = loadData();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ---------- Header date ---------- */
document.getElementById("todayLabel").textContent = new Date().toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric"
});

/* ---------- Stat tiles ---------- */
function renderStats() {
  const thisMonth = data.revenue.find(r => r.month === currentMonthKey());
  const skoolIncome = thisMonth ? thisMonth.skool : 0;
  const pipelineIncome = thisMonth ? thisMonth.pipeline : 0;
  document.getElementById("statTotalIncome").textContent = formatMoney(skoolIncome + pipelineIncome);
  document.getElementById("statIncomeBreakdown").textContent =
    `Skool ${formatMoney(skoolIncome)} + Pipeline ${formatMoney(pipelineIncome)}`;

  document.getElementById("statPremiumClients").textContent = data.skool.premiumClients;
  document.getElementById("statConversionRate").textContent = `${data.skool.conversionRate}%`;
}

/* ---------- Revenue & Projected Income ---------- */
function renderRevenue() {
  const body = document.getElementById("revenueTableBody");
  body.innerHTML = "";
  if (data.revenue.length === 0) {
    body.innerHTML = `<tr class="empty-row"><td colspan="5">No months logged yet. Add your first one above.</td></tr>`;
    return;
  }
  const sorted = [...data.revenue].sort((a, b) => b.month.localeCompare(a.month));
  for (const r of sorted) {
    const tr = document.createElement("tr");
    const total = r.skool + r.pipeline;
    const label = new Date(r.month + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" });
    tr.innerHTML = `
      <td>${label}</td>
      <td>${formatMoney(r.skool)}</td>
      <td>${formatMoney(r.pipeline)}</td>
      <td>${formatMoney(total)}</td>
      <td><button class="icon-btn" data-id="${r.id}" title="Delete">&times;</button></td>
    `;
    tr.querySelector("button").addEventListener("click", () => {
      data.revenue = data.revenue.filter(x => x.id !== r.id);
      saveData();
      renderRevenue();
      renderStats();
    });
    body.appendChild(tr);
  }
}

document.getElementById("revenueForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const month = document.getElementById("revenueMonth").value;
  const skool = parseFloat(document.getElementById("revenueSkool").value) || 0;
  const pipeline = parseFloat(document.getElementById("revenuePipeline").value) || 0;

  const existing = data.revenue.find(r => r.month === month);
  if (existing) {
    existing.skool = skool;
    existing.pipeline = pipeline;
  } else {
    data.revenue.push({ id: uid(), month, skool, pipeline });
  }
  saveData();
  e.target.reset();
  renderRevenue();
  renderStats();
});

/* ---------- Skool platform ---------- */
function renderSkoolForm() {
  document.getElementById("skoolPremiumClients").value = data.skool.premiumClients;
  document.getElementById("skoolConversionRate").value = data.skool.conversionRate;
}

document.getElementById("skoolForm").addEventListener("submit", (e) => {
  e.preventDefault();
  data.skool.premiumClients = parseInt(document.getElementById("skoolPremiumClients").value, 10) || 0;
  data.skool.conversionRate = parseFloat(document.getElementById("skoolConversionRate").value) || 0;
  saveData();
  renderStats();
});

/* ---------- Client pipeline ---------- */
function renderClients() {
  const body = document.getElementById("clientsTableBody");
  body.innerHTML = "";
  if (data.clients.length === 0) {
    body.innerHTML = `<tr class="empty-row"><td colspan="4">No clients yet. Add one above.</td></tr>`;
    return;
  }
  const stageOrder = { hot: 0, warm: 1, cold: 2 };
  const sorted = [...data.clients].sort((a, b) => stageOrder[a.stage] - stageOrder[b.stage]);
  for (const c of sorted) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(c.name)}</td>
      <td><span class="stage-badge stage-${c.stage}">${c.stage}</span></td>
      <td>${escapeHtml(c.nextAction)}</td>
      <td><button class="icon-btn" data-id="${c.id}" title="Delete">&times;</button></td>
    `;
    tr.querySelector("button").addEventListener("click", () => {
      data.clients = data.clients.filter(x => x.id !== c.id);
      saveData();
      renderClients();
    });
    body.appendChild(tr);
  }
}

document.getElementById("clientForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("clientName").value.trim();
  const stage = document.getElementById("clientStage").value;
  const nextAction = document.getElementById("clientNextAction").value.trim();
  if (!name || !nextAction) return;
  data.clients.push({ id: uid(), name, stage, nextAction });
  saveData();
  e.target.reset();
  renderClients();
});

/* ---------- Calendar ---------- */
let calendarCursor = new Date(); // tracks which month is on screen

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();

  document.getElementById("calMonthLabel").textContent =
    calendarCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  ["S", "M", "T", "W", "T", "F", "S"].forEach(d => {
    const el = document.createElement("div");
    el.className = "cal-dow";
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement("div");
    el.className = "cal-day empty";
    grid.appendChild(el);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = data.events.filter(ev => ev.date === dateStr);
    const el = document.createElement("div");
    el.className = "cal-day" + (dayEvents.length ? " has-event" : "") + (dateStr === todayStr ? " today-cell" : "");
    el.title = dayEvents.map(ev => ev.title).join(", ");
    el.innerHTML = `${day}${dayEvents.length ? '<span class="dot"></span>' : ""}`;
    grid.appendChild(el);
  }
}

document.getElementById("calPrev").addEventListener("click", () => {
  calendarCursor.setMonth(calendarCursor.getMonth() - 1);
  renderCalendar();
});
document.getElementById("calNext").addEventListener("click", () => {
  calendarCursor.setMonth(calendarCursor.getMonth() + 1);
  renderCalendar();
});

function renderUpcomingEvents() {
  const list = document.getElementById("upcomingEventsList");
  list.innerHTML = "";
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = data.events
    .filter(ev => ev.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    list.innerHTML = `<li class="empty-hint">No upcoming launches or content scheduled.</li>`;
    return;
  }

  for (const ev of upcoming) {
    const li = document.createElement("li");
    const label = new Date(ev.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    li.innerHTML = `
      <span><span class="event-date">${label}</span>${escapeHtml(ev.title)}</span>
      <button class="icon-btn" title="Delete">&times;</button>
    `;
    li.querySelector("button").addEventListener("click", () => {
      data.events = data.events.filter(x => x.id !== ev.id);
      saveData();
      renderCalendar();
      renderUpcomingEvents();
    });
    list.appendChild(li);
  }
}

document.getElementById("eventForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const date = document.getElementById("eventDate").value;
  const title = document.getElementById("eventTitle").value.trim();
  if (!date || !title) return;
  data.events.push({ id: uid(), date, title });
  saveData();
  e.target.reset();
  calendarCursor = new Date(date + "T00:00:00");
  renderCalendar();
  renderUpcomingEvents();
});

/* ---------- To-Do list ---------- */
function renderTodos() {
  const list = document.getElementById("todoList");
  list.innerHTML = "";
  if (data.todos.length === 0) {
    list.innerHTML = `<li class="empty-hint">Nothing on your list. Add a task above.</li>`;
    return;
  }
  for (const t of data.todos) {
    const li = document.createElement("li");
    if (t.done) li.classList.add("done");
    li.innerHTML = `
      <span class="todo-left">
        <input type="checkbox" ${t.done ? "checked" : ""}>
        <span class="todo-text">${escapeHtml(t.text)}</span>
      </span>
      <button class="icon-btn" title="Delete">&times;</button>
    `;
    li.querySelector("input").addEventListener("change", (e) => {
      t.done = e.target.checked;
      saveData();
      renderTodos();
    });
    li.querySelector("button").addEventListener("click", () => {
      data.todos = data.todos.filter(x => x.id !== t.id);
      saveData();
      renderTodos();
    });
    list.appendChild(li);
  }
}

document.getElementById("todoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = document.getElementById("todoText").value.trim();
  if (!text) return;
  data.todos.push({ id: uid(), text, done: false });
  saveData();
  e.target.reset();
  renderTodos();
});

/* ---------- Helpers ---------- */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Initial render ---------- */
renderStats();
renderRevenue();
renderSkoolForm();
renderClients();
renderCalendar();
renderUpcomingEvents();
renderTodos();
