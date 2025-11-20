const STORAGE_KEY = "ourBudgetHub_data_v2";

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      goal: {
        name: "Our shared goal",
        amount: 0
      },
      transactions: []
    };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.goal) {
      parsed.goal = { name: "Our shared goal", amount: 0 };
    }
    if (!Array.isArray(parsed.transactions)) {
      parsed.transactions = [];
    }
    return parsed;
  } catch {
    return {
      goal: { name: "Our shared goal", amount: 0 },
      transactions: []
    };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatCurrency(num) {
  if (!isFinite(num)) num = 0;
  return "$" + num.toFixed(2);
}

function calculateSummary(data) {
  let youAdded = 0;
  let partnerAdded = 0;
  let spent = 0;

  for (const t of data.transactions) {
    if (t.type === "contribution") {
      if (t.person === "you") youAdded += t.amount;
      if (t.person === "partner") partnerAdded += t.amount;
    } else if (t.type === "expense") {
      spent += t.amount;
    }
  }

  const saved = youAdded + partnerAdded;
  const balance = saved - spent;

  return { youAdded, partnerAdded, spent, saved, balance };
}

function getCurrentMonthLabel() {
  const now = new Date();
  return now.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function calculateThisMonth(data) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let saved = 0;
  let spent = 0;

  for (const t of data.transactions) {
    if (!t.dateISO) continue;
    const d = new Date(t.dateISO);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      if (t.type === "contribution") saved += t.amount;
      if (t.type === "expense") spent += t.amount;
    }
  }

  return { saved, spent };
}

function calculateCategoryTotals(data) {
  const totals = {};
  for (const t of data.transactions) {
    if (t.type !== "expense") continue;
    const cat = t.category || "other";
    if (!totals[cat]) totals[cat] = 0;
    totals[cat] += t.amount;
  }
  return totals;
}

function buildCategoryBars(totals) {
  const container = document.getElementById("category-bars");
  container.innerHTML = "";
  const entries = Object.entries(totals);
  if (entries.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No expenses yet. Girl math still loading…";
    p.style.fontSize = "0.8rem";
    p.style.color = "#6b7280";
    container.appendChild(p);
    return;
  }

  const maxVal = Math.max(...entries.map(([, v]) => v));
  entries.sort((a, b) => b[1] - a[1]);

  for (const [cat, val] of entries) {
    const row = document.createElement("div");
    row.className = "category-bar-row";

    const label = document.createElement("span");
    label.className = "category-bar-label";
    label.textContent = cat;

    const track = document.createElement("div");
    track.className = "category-bar-track";

    const fill = document.createElement("div");
    fill.className = "category-bar-fill";
    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
    fill.style.width = pct.toFixed(0) + "%";

    track.appendChild(fill);
    row.appendChild(label);
    row.appendChild(track);

    container.appendChild(row);
  }
}

function renderAll() {
  const data = loadData();
  const { youAdded, partnerAdded, spent, saved, balance } = calculateSummary(data);

  // Goal
  const goalNameEl = document.getElementById("goal-name");
  const goalAmountEl = document.getElementById("goal-amount");
  const savedAmountEl = document.getElementById("saved-amount");
  const remainingAmountEl = document.getElementById("remaining-amount");
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressLabel = document.getElementById("progress-label");

  const goalAmount = data.goal.amount || 0;
  const remaining = Math.max(goalAmount - saved, 0);
  const pct = goalAmount > 0 ? Math.min((saved / goalAmount) * 100, 100) : 0;

  goalNameEl.textContent = data.goal.name || "Our shared goal";
  goalAmountEl.textContent = formatCurrency(goalAmount);
  savedAmountEl.textContent = formatCurrency(saved);
  remainingAmountEl.textContent = formatCurrency(remaining);
  progressBarFill.style.width = pct.toFixed(0) + "%";
  progressLabel.textContent =
    goalAmount > 0 ? `${pct.toFixed(0)}% complete` : "Set a goal amount to start tracking progress";

  // Summary
  document.getElementById("you-total").innerHTML = "💖 " + formatCurrency(youAdded);
  document.getElementById("partner-total").innerHTML = "🫶 " + formatCurrency(partnerAdded);
  document.getElementById("spent-total").innerHTML = "🧾 " + formatCurrency(spent);
  document.getElementById("balance-total").innerHTML = "💰 " + formatCurrency(balance);

  const spentNote = document.getElementById("spent-note");
  const balanceNote = document.getElementById("balance-note");

  if (spent === 0) {
    spentNote.textContent = "So far… very calm.";
  } else if (spent < saved / 3) {
    spentNote.textContent = "Spending under control, love that for you.";
  } else {
    spentNote.textContent = "Ok maybe close the UberEats app a lil bit 😭";
  }

  if (balance <= 0) {
    balanceNote.textContent = "You’re in clown mode. Time to save again.";
  } else if (balance < goalAmount / 2) {
    balanceNote.textContent = "Slow and steady rich era loading…";
  } else {
    balanceNote.textContent = "Big rich energy. Financially hot couple.";
  }

  // This month vibe
  const month = calculateThisMonth(data);
  document.getElementById("month-label").textContent = getCurrentMonthLabel();
  document.getElementById("month-saved").textContent = formatCurrency(month.saved);
  document.getElementById("month-spent").textContent = formatCurrency(month.spent);

  const monthMessage = document.getElementById("month-message");
  if (month.saved === 0 && month.spent === 0) {
    monthMessage.textContent = "Add a few entries to see the vibe ✨";
  } else if (month.saved >= month.spent) {
    monthMessage.textContent = "Responsible era 😌 You’re saving more than you’re spending.";
  } else {
    monthMessage.textContent = "Ok but at least you’re enjoying life. Maybe add a bit more savings tho.";
  }

  // Category breakdown
  const totals = calculateCategoryTotals(data);
  buildCategoryBars(totals);

  const topCategoryLabel = document.getElementById("top-category");
  const entries = Object.entries(totals);
  if (entries.length === 0) {
    topCategoryLabel.textContent = "–";
  } else {
    entries.sort((a, b) => b[1] - a[1]);
    topCategoryLabel.textContent = `${entries[0][0]} (${formatCurrency(entries[0][1])})`;
  }

  // Transactions table
  renderTransactions(data.transactions);
}

function renderTransactions(allTransactions) {
  const tbody = document.getElementById("transactions-body");
  const personFilter = document.getElementById("filter-person").value;
  const typeFilter = document.getElementById("filter-type").value;

  tbody.innerHTML = "";

  const filtered = allTransactions.filter((t) => {
    let ok = true;
    if (personFilter !== "all" && t.person !== personFilter) ok = false;
    if (typeFilter !== "all" && t.type !== typeFilter) ok = false;
    return ok;
  });

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.textContent = "No entries yet. Add contributions or expenses to see them here.";
    td.style.color = "#6b7280";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (const t of filtered) {
    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.textContent = t.date || "";
    tr.appendChild(dateTd);

    const whoTd = document.createElement("td");
    whoTd.textContent = t.person === "you" ? "You" : "Partner";
    tr.appendChild(whoTd);

    const typeTd = document.createElement("td");
    typeTd.textContent = t.type === "contribution" ? "Contribution" : "Expense";
    tr.appendChild(typeTd);

    const amountTd = document.createElement("td");
    amountTd.textContent = formatCurrency(t.amount);
    tr.appendChild(amountTd);

    const categoryTd = document.createElement("td");
    categoryTd.textContent = t.category || "";
    tr.appendChild(categoryTd);

    const noteTd = document.createElement("td");
    noteTd.textContent = t.note || "";
    tr.appendChild(noteTd);

    const actionTd = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "✕";
    delBtn.title = "Delete";
    delBtn.addEventListener("click", () => {
      const data = loadData();
      const idx = data.transactions.findIndex((x) => x.id === t.id);
      if (idx !== -1) {
        data.transactions.splice(idx, 1);
        saveData(data);
        renderAll();
      }
    });
    actionTd.appendChild(delBtn);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  }
}

function setupForms() {
  const contributionForm = document.getElementById("contribution-form");
  const expenseForm = document.getElementById("expense-form");

  contributionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = loadData();

    const person = document.getElementById("contributor").value;
    const amount = parseFloat(document.getElementById("contribution-amount").value);
    const category = document.getElementById("contribution-category").value;
    const note = document.getElementById("contribution-note").value.trim();
    const now = new Date();

    if (!isFinite(amount) || amount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    data.transactions.unshift({
      id: now.getTime().toString() + Math.random().toString().slice(2),
      type: "contribution",
      person,
      amount,
      category,
      note,
      date: now.toLocaleDateString(),
      dateISO: now.toISOString()
    });

    saveData(data);
    contributionForm.reset();
    renderAll();
  });

  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = loadData();

    const person = document.getElementById("spender").value;
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const category = document.getElementById("expense-category").value;
    const note = document.getElementById("expense-note").value.trim();
    const now = new Date();

    if (!isFinite(amount) || amount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    data.transactions.unshift({
      id: now.getTime().toString() + Math.random().toString().slice(2),
      type: "expense",
      person,
      amount,
      category,
      note,
      date: now.toLocaleDateString(),
      dateISO: now.toISOString()
    });

    saveData(data);
    expenseForm.reset();
    renderAll();
  });
}

function setupFilters() {
  const personSel = document.getElementById("filter-person");
  const typeSel = document.getElementById("filter-type");

  personSel.addEventListener("change", () => {
    const data = loadData();
    renderTransactions(data.transactions);
  });

  typeSel.addEventListener("change", () => {
    const data = loadData();
    renderTransactions(data.transactions);
  });
}

function setupGoalModal() {
  const modal = document.getElementById("goal-modal");
  const openBtn = document.getElementById("edit-goal-btn");
  const cancelBtn = document.getElementById("cancel-goal-btn");
  const form = document.getElementById("goal-form");
  const nameInput = document.getElementById("goal-name-input");
  const amountInput = document.getElementById("goal-amount-input");

  openBtn.addEventListener("click", () => {
    const data = loadData();
    nameInput.value = data.goal.name || "";
    amountInput.value = data.goal.amount || "";
    modal.classList.remove("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = loadData();

    const name = nameInput.value.trim() || "Our shared goal";
    const amount = parseFloat(amountInput.value);
    if (!isFinite(amount) || amount < 0) {
      alert("Enter a valid goal amount.");
      return;
    }

    data.goal.name = name;
    data.goal.amount = amount;
    saveData(data);
    modal.classList.add("hidden");
    renderAll();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupForms();
  setupFilters();
  setupGoalModal();
  renderAll();
});
