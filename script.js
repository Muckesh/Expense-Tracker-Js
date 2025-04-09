const modeToggle = document.getElementById("modeToggle");
const body = document.body;
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const balance = document.getElementById('balance');
// const pieChart = document.getElementById('pieChart');

const expenseForm = document.getElementById('expenseForm');
// const expenseName = document.getElementById('expenseName');
// const expenseAmount = document.getElementById('expenseAmount');
// const expenseCategory = document.getElementById('expenseCategory');
// const expenseDate = document.getElementById("expenseDate");


const filterCategory = document.getElementById('filterCategory');
const filterMonth = document.getElementById("filterMonth");
const resetFilters = document.getElementById('resetFilters');

const expenseList = document.getElementById('expenseList');
const noExpenses = document.getElementById('noExpenses');


let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

let pieChart;

modeToggle.addEventListener('click',function(){
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    modeToggle.innerHTML = isDarkMode ? `<i class="fa-solid fa-sun"></i>` : `<i class="fa-solid fa-moon"></i>`;
    localStorage.setItem('darkMode',isDarkMode);

    // Update chart label colors if it exists
    if (pieChart) {
        updateChartColors();
        pieChart.update();
        }
});

if (localStorage.getItem('darkMode') === 'true') {
    body.classList.toggle('dark-mode');
    modeToggle.innerHTML =`<i class="fa-solid fa-sun"></i>`;
}

// set default expense date to today
document.getElementById('expenseDate').valueAsDate = new Date();
// expenseDate.valueAsDate = new Date();

// set default month filter to the current month
const today = new Date();
filterMonth.value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;

// save to local storage
function saveExpenses(){
    localStorage.setItem('expenses',JSON.stringify(expenses));
}


// rendering the expense list
function renderExpenses(filtered = expenses){
    expenseList.innerHTML = "";

    if (filtered.length === 0) {
        noExpenses.style.display = 'block';
    } else {
        noExpenses.style.display = 'none';
    }

    filtered.forEach((expense, index)=>{
        const item = document.createElement('div');
        item.className= "expense-item";
        item.innerHTML = `
            <div>
                <strong>${expense.name}</strong> - Rs. ${expense.amount} <em>(${expense.category})</em><br>
                <small>${expense.date}</small>
            </div>
            <div class = "actions" >
                <button onclick = "editExpense(${index})"><i class = "fa fa-edit"></i></button>
                <button onclick = "deleteExpense(${index})"><i class = "fa fa-trash"></i></button>
            </div>
        `;
        expenseList.appendChild(item);
    });
}

expenseForm.addEventListener('submit',function(e){
    e.preventDefault();

    const name = document.getElementById('expenseName').value.trim();
    const amount = parseInt(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;

    if (!name || !amount || !category || !date) {
        return;
    }

    // for editing the expense
    if (expenseForm.dataset.editingIndex !== undefined) {
        const index = parseInt(expenseForm.dataset.editingIndex);
        expenses[index] = {name,amount,category,date};
        delete expenseForm.dataset.editingIndex;
    } else {
        expenses.push({name,amount,category,date});
    }

    // expenses.push({name,amount,category,date});

    saveExpenses();
    renderExpenses();
    updateSummary();
    drawPieChart();
    expenseForm.reset();
    document.getElementById('expenseDate').valueAsDate = new Date();

});


function updateSummary(){
    const income = expenses.filter(e => e.category === "Income").reduce((sum,e)=>sum+e.amount,0);
    const expense = expenses.filter(e => e.category !== "Income").reduce((sum,e) => sum+e.amount,0);

    totalIncome.textContent = `Rs. ${income}`;
    totalExpense.textContent = `Rs. ${expense}`;

    if (income - expense > 0) {
        balance.className="total income";
    } else if(income-expense < 0){
        balance.className="total expense";
    }else{
        balance.className="total";
    }

    balance.textContent = `Rs. ${income-expense}`;

}

function drawPieChart(){
    const categoryTotals = {};

    expenses.forEach(e => {
        if (e.category !== "Income") {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount; // {"Food" : 12 + 23}
        }
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const backgroundColors = labels.map((_,i)=>
        `hsl(${(i*360) / labels.length}, 70%,60%)`
    );

    if (pieChart) {
        pieChart.destroy();
    }

    const ctx = document.getElementById('pieChart').getContext('2d');

    pieChart = new Chart(ctx,{
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
                borderColor: getComputedStyle(document.body).getPropertyValue('--card-color'),
                borderWidth: 1
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-color')
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context){
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a,b)=>a+b,0);
                            const percentage = Math.round((value/total)*100);
                            return `${label}: Rs. ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateChartColors(){
    if (!pieChart) {
        return;
    }
    pieChart.options.plugins.legend.labels.color = getComputedStyle(document.body).getPropertyValue('--text-color');
    pieChart.update();
}

// delete expense

window.deleteExpense = function(index){
    if (confirm('Are you sure, you want to delete this expense? ')) {
        expenses.splice(index,1);
        saveExpenses();
        renderExpenses();
        updateSummary();
        drawPieChart();
    }
}

// edit expense
window.editExpense = function(index){
    const expense = expenses[index];
    document.getElementById('expenseName').value = expense.name;
    document.getElementById("expenseAmount").value =expense.amount;
    document.getElementById("expenseCategory").value=expense.category;
    document.getElementById("expenseDate").value=expense.date;

    expenseForm.dataset.editingIndex = index;
}

// filter expenses

function applyFilters(){
    const category = filterCategory.value;
    const month = filterMonth.value;

    const filtered = expenses.filter(exp =>{
        const matchCategory = !category || exp.category === category;
        const matchMonth = !month || exp.date.startsWith(month);
        return matchCategory && matchMonth;
    });

    renderExpenses(filtered);
}

// reset filters
resetFilters.addEventListener('click',()=>{
    filterCategory.value="";
    filterMonth.value="";
    renderExpenses();
});

// filter listeners
filterCategory.addEventListener('change',applyFilters);
filterMonth.addEventListener('change',applyFilters);

renderExpenses();
updateSummary();
drawPieChart();