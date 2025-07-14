const state = {
  earnings: 0,
  expense: 0,
  net: 0,
  transactions: [],
  budgetLimits: {
    Food: 0,
    Travel: 0,
    Shopping: 0,
    Bills: 0,
    Other: 0
  }
};

let isUpdate = false;
let tid;

const transactionFormEl = document.getElementById("transactionForm");

const renderTransactions = () => {
  const transactionContainerEl = document.querySelector(".transactions");
  const netAmountEl = document.getElementById("netAmount");
  const earningEl = document.getElementById("earning");
  const expenseEl = document.getElementById("expense");

  const transactions = state.transactions;

  let earning = 0;
  let expense = 0;
  let net = 0;
  const categoryTotals = {};

  transactionContainerEl.innerHTML = "";

  transactions.forEach((transaction) => {
    const { id, amount, text, type, category } = transaction;
    const isCredit = type === "credit";
    const sign = isCredit ? "+" : "-";

    const transactionEl = `
      <div class="transaction" id="${id}">
        <div class="content" onclick="showEdit(${id})">
          <div class="left">
            <p>${text} (${category})</p>
            <p>${sign} ₹ ${amount}</p>
          </div>
          <div class="status ${isCredit ? "credit" : "debit"}">${isCredit ? "C" : "D"}</div>
        </div>
        <div class="lower">
          <div class="icon" onclick="handleUpdate(${id})">
            <img src="./icons/pen.svg" alt="pen" />
          </div>
          <div class="icon" onclick="handleDelete(${id})">
            <img src="./icons/trash.svg" alt="trash" />
          </div>
        </div>
      </div>`;

    earning += isCredit ? amount : 0;
    expense += !isCredit ? amount : 0;
    net = earning - expense;

    if (!isCredit) {
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      const limit = state.budgetLimits[category];
      if (limit > 0) {
        if (categoryTotals[category] > limit) {
          alert(`⚠️ You've exceeded your budget for ${category}!`);
        } else if (categoryTotals[category] > 0.8 * limit) {
          alert(`⚠️ You're nearing your budget limit for ${category}.`);
        }
      }
    }

    transactionContainerEl.insertAdjacentHTML("afterbegin", transactionEl);
  });

  netAmountEl.innerHTML = `₹ ${net}`;
  earningEl.innerHTML = `₹ ${earning}`;
  expenseEl.innerHTML = `₹ ${expense}`;
};

const addTransaction = (e) => {
  e.preventDefault();

  const isEarn = e.submitter.id === "earnBtn";

  const formData = new FormData(transactionFormEl);
  const tData = {};
  formData.forEach((value, key) => tData[key] = value);

  const { text, amount, category } = tData;

  const transaction = {
    id: isUpdate ? tid : Math.floor(Math.random() * 1000),
    text: text,
    amount: +amount,
    category,
    type: isEarn ? "credit" : "debit"
  };

  if (isUpdate) {
    const tIndex = state.transactions.findIndex((t) => t.id === tid);
    state.transactions[tIndex] = transaction;
    isUpdate = false;
    tid = null;
  } else {
    state.transactions.push(transaction);
  }

  renderTransactions();
  transactionFormEl.reset();
};

const showEdit = (id) => {
  const selectedTransaction = document.getElementById(id);
  const lowerEl = selectedTransaction.querySelector(".lower");
  lowerEl.classList.toggle("showTransaction");
};

const handleUpdate = (id) => {
  const transaction = state.transactions.find((t) => t.id === id);
  const { text, amount, category } = transaction;

  document.getElementById("text").value = text;
  document.getElementById("amount").value = amount;
  document.getElementById("category").value = category;

  tid = id;
  isUpdate = true;
};

const handleDelete = (id) => {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  renderTransactions();
};

const setBudgetLimits = () => {
  state.budgetLimits.Food = +document.getElementById("foodLimit").value || 0;
  state.budgetLimits.Travel = +document.getElementById("travelLimit").value || 0;
  state.budgetLimits.Shopping = +document.getElementById("shoppingLimit").value || 0;
  // Add more categories as needed
};

document.getElementById("foodLimit").addEventListener("change", setBudgetLimits);
document.getElementById("travelLimit").addEventListener("change", setBudgetLimits);
document.getElementById("shoppingLimit").addEventListener("change", setBudgetLimits);

renderTransactions();
transactionFormEl.addEventListener("submit", addTransaction);

const downloadCSV = () => {
  const rows = [
    ["ID", "Description", "Amount", "Type", "Category"], // headers
    ...state.transactions.map((t) => [
      t.id,
      `"${t.text}"`,
      t.amount,
      t.type,
      t.category || ""
    ])
  ];

  const csvContent = rows.map(e => e.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const today = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `expense_report_${today}.csv`);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

document.getElementById("downloadBtn").addEventListener("click", downloadCSV);