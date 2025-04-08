// Element selectors
const modeToggle = document.getElementById('modeToggle');
const body = document.body;
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const noExpenses = document.getElementById('noExpenses');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const balance = document.getElementById('balance');
const filterCategory = document.getElementById('filterCategory');
const filterMonth = document.getElementById('filterMonth');
const resetFiltersBtn = document.getElementById('resetFilters');

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let pieChart;

// Toggle dark mode
function darkModeToggle() {
    body.classList.toggle('dark-mode');
    const icon = modeToggle.querySelector('i');
    icon.classList.toggle('fa-sun');
    icon.classList.toggle('fa-moon');
}

// Save expenses to localStorage
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Render the expense list
function renderExpenses(filtered = expenses) {
    expenseList.innerHTML = '';

    if (filtered.length === 0) {
        noExpenses.style.display = 'block';
        return;
    } else {
        noExpenses.style.display = 'none';
    }

    filtered.forEach((expense, index) => {
        const item = document.createElement('div');
        item.className = 'expense-item';
        item.innerHTML = `
            <div>
                <strong>${expense.name}</strong> - Rs. ${expense.amount} <em>(${expense.category})</em><br>
                <small>${expense.date}</small>
            </div>
            <div class="actions">
                <button onclick="editExpense(${index})"><i class="fa fa-edit"></i></button>
                <button onclick="deleteExpense(${index})"><i class="fa fa-trash"></i></button>
            </div>
        `;
        expenseList.appendChild(item);
    });
}

// Update summary values
function updateSummary() {
    const income = expenses
        .filter(e => e.category === 'Income')
        .reduce((sum, e) => sum + e.amount, 0);
    const expense = expenses
        .filter(e => e.category !== 'Income')
        .reduce((sum, e) => sum + e.amount, 0);

    totalIncome.textContent = `Rs. ${income}`;
    totalExpense.textContent = `Rs. ${expense}`;
    balance.textContent = `Rs. ${income - expense}`;
}

// Draw the pie chart
function drawPieChart() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    const categoryTotals = {};

    expenses.forEach(e => {
        if (e.category !== 'Income') {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        }
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const backgroundColors = labels.map((_, i) =>
        `hsl(${(i * 360) / labels.length}, 70%, 60%)`
    );

    if (pieChart) {
        pieChart.destroy();
    }

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
            }],
        },
    });
}

// Add or update expense
expenseForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('expenseName').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;

    if (!name || !amount || !category || !date) return;

    if (expenseForm.dataset.editingIndex !== undefined) {
        const index = parseInt(expenseForm.dataset.editingIndex);
        expenses[index] = { name, amount, category, date };
        delete expenseForm.dataset.editingIndex;
    } else {
        expenses.push({ name, amount, category, date });
    }

    saveExpenses();
    renderExpenses();
    updateSummary();
    drawPieChart();
    expenseForm.reset();
});

// Edit expense
window.editExpense = function (index) {
    const expense = expenses[index];
    document.getElementById('expenseName').value = expense.name;
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseCategory').value = expense.category;
    document.getElementById('expenseDate').value = expense.date;
    expenseForm.dataset.editingIndex = index;
};

// Delete expense
window.deleteExpense = function (index) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses.splice(index, 1);
        saveExpenses();
        renderExpenses();
        updateSummary();
        drawPieChart();
    }
};

// Filter expenses
function applyFilters() {
    const category = filterCategory.value;
    const month = filterMonth.value;

    const filtered = expenses.filter(exp => {
        const matchCategory = !category || exp.category === category;
        const matchMonth = !month || exp.date.startsWith(month);
        return matchCategory && matchMonth;
    });

    renderExpenses(filtered);
}

// Reset filters
resetFiltersBtn.addEventListener('click', () => {
    filterCategory.value = '';
    filterMonth.value = '';
    renderExpenses();
});

// Add filter listeners
filterCategory.addEventListener('change', applyFilters);
filterMonth.addEventListener('change', applyFilters);

// Initial load
renderExpenses();
updateSummary();
drawPieChart();
