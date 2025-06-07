// Financial Freedom Tools - Main JavaScript file
console.log('Financial Freedom Tools initialized');

// Income & Expense Tracker Logic
if (document.getElementById('trackerForm')) {
    document.getElementById('trackerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form values
        const month = document.getElementById('month').value;
        const year = document.getElementById('year').value;
        const income = parseFloat(document.getElementById('income').value);
        const expenses = parseFloat(document.getElementById('expenses').value);
        
        // Calculate balance
        const balance = income - expenses;
        
        // Get month name
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[parseInt(month) - 1];
        
        try {
            const data = {
                month: parseInt(month),
                year: parseInt(year),
                income: income,
                expenses: expenses
            };

            console.log('Sending data to Google Sheets:', data);

            // Send data to Google Sheets
            const response = await fetch('https://script.google.com/macros/s/AKfycbzrb1C_9HmneNmf9H2gFkf6DeHxL9OZHNsL32jmUCbnJoCbwhUGirnkYLIApKlJBLdr/exec', {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            console.log('Raw response:', response);
            
            // Since we're using no-cors, we can't check the response
            // We'll assume success if we get here
            
            // Create new row
            const tbody = document.getElementById('dataTableBody');
            const newRow = document.createElement('tr');
            
            // Format numbers with 2 decimal places
            const formatNumber = (num) => num.toFixed(2);
            
            newRow.innerHTML = `
                <td>${monthName}</td>
                <td>${year}</td>
                <td>€${formatNumber(income)}</td>
                <td>€${formatNumber(expenses)}</td>
                <td>€${formatNumber(balance)}</td>
            `;
            
            // Add row to table
            tbody.appendChild(newRow);
            
            // Clear form
            this.reset();
            
            // Show success message
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = 'Data saved successfully!';
            messageDiv.className = 'message success';
            
            // Clear message after 3 seconds
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'message';
            }, 3000);

        } catch (error) {
            console.error('Error saving data:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = `Error: ${error.message}`;
            messageDiv.className = 'message error';
            
            // Clear error message after 3 seconds
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'message';
            }, 3000);
        }
    });
}

// Strategy Comparison Tool Logic
if (document.getElementById('compareForm')) {
    function formatLargeNumber(num) {
        if (isNaN(num)) return '';
        num = Number(num);
        if (num >= 1e12) return (num / 1e12).toPrecision(3).replace(/\.0+$/, '') + 'T';
        if (num >= 1e9) return (num / 1e9).toPrecision(3).replace(/\.0+$/, '') + 'B';
        if (num >= 1e6) return (num / 1e6).toPrecision(3).replace(/\.0+$/, '') + 'M';
        if (num >= 1e3) return (num / 1e3).toPrecision(3).replace(/\.0+$/, '') + 'K';
        return num.toLocaleString(undefined, {maximumFractionDigits:2});
    }

    document.getElementById('compareForm').onsubmit = function(e) {
        e.preventDefault();
        const income = parseFloat(this.income.value);
        const annualReturn = parseFloat(this.return.value);
        const rate = parseFloat(this.rate.value);
        const interest = parseFloat(this.interest.value);

        if (isNaN(income) || isNaN(annualReturn) || isNaN(rate) || isNaN(interest)) return;

        // Calculate required assets for each strategy (all use the same formula now)
        const requiredAssets = (income * 12) / (rate / 100);

        // Calculate all years in parallel
        const years = 100;
        let assetIncomeArr = [];
        let sellAssetsArr = [];
        let borrowArr = [];

        // Asset Income calculations
        let assets1 = requiredAssets;
        for (let y = 1; y <= years; y++) {
            let annualIncome = assets1 * (rate / 100);
            assetIncomeArr.push({assets: assets1, income: annualIncome});
            assets1 = assets1 * (1 + (annualReturn - rate) / 100);
        }

        // Selling Assets calculations
        let assets2 = requiredAssets;
        for (let y = 1; y <= years; y++) {
            let withdrawal = assets2 * (rate / 100);
            sellAssetsArr.push({assets: assets2, withdrawal: withdrawal});
            assets2 = (assets2 - withdrawal) * (1 + annualReturn / 100);
            if (assets2 < 0) assets2 = 0;
        }

        // Borrowing calculations
        let assets3 = requiredAssets;
        let borrowed = 0;
        let totalDebt = 0;
        for (let y = 1; y <= years; y++) {
            assets3 = assets3 * (1 + annualReturn / 100);
            let toBorrow = assets3 * (rate / 100);
            borrowed += toBorrow;
            let interestCost = borrowed * (interest / 100);
            borrowed += interestCost;
            assets3 -= interestCost;
            if (assets3 < 0) assets3 = 0;
            totalDebt = borrowed;
            borrowArr.push({assets: assets3, toBorrow, interestCost, totalDebt});
        }

        // Build combined table with vertical dividers and centered group headers (final version, with correct columns under each strategy)
        let table = `<table class='compare-table'><thead>
          <tr>
            <th rowspan="2">Year</th>
            <th class="strategy-group" colspan="2">Asset Income</th>
            <th class="strategy-group" colspan="2">Selling Assets</th>
            <th class="strategy-group" colspan="4">Buy, Borrow, Die</th>
          </tr>
          <tr>
            <th>Assets</th>
            <th>Income</th>
            <th class="strategy-divider">Assets</th>
            <th>Withdrawal</th>
            <th class="strategy-divider">Assets</th>
            <th>Borrowed</th>
            <th>Interest</th>
            <th>Total Debt</th>
          </tr>
        </thead><tbody>`;
        for (let y = 0; y < years; y++) {
            table += `<tr><td>${y+1}</td>`;
            // Asset Income
            table += `<td>${formatLargeNumber(assetIncomeArr[y]?.assets)}</td><td>${formatLargeNumber(assetIncomeArr[y]?.income)}</td>`;
            // Selling Assets
            table += `<td class="strategy-divider">${formatLargeNumber(sellAssetsArr[y]?.assets)}</td><td>${formatLargeNumber(sellAssetsArr[y]?.withdrawal)}</td>`;
            // Borrowing
            table += `<td class="strategy-divider">${formatLargeNumber(borrowArr[y]?.assets)}</td><td>${formatLargeNumber(borrowArr[y]?.toBorrow)}</td><td>${formatLargeNumber(borrowArr[y]?.interestCost)}</td><td>${formatLargeNumber(borrowArr[y]?.totalDebt)}</td>`;
            table += `</tr>`;
        }
        table += `</tbody></table>`;
        
        document.getElementById('results').innerHTML = `<div class='table-responsive'><div class='strategy-card' style='width:100%;max-width:none;'>${table}</div></div>`;
        document.getElementById('results').style.display = 'block';
    };
} 

// Income Calculator Logic
if (document.getElementById('incomeForm')) {
    function formatCurrency(amount) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Toggle between calculation modes
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const assetsGroup = document.getElementById('assetsGroup');
    const incomeGroup = document.getElementById('incomeGroup');
    const spendingGroup = document.getElementById('spendingGroup');
    const incomeResults = document.getElementById('incomeResults');
    const monthlyResults = document.getElementById('monthlyResults');
    const assetsResults = document.getElementById('assetsResults');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update toggle buttons
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show/hide relevant form groups
            const mode = btn.dataset.mode;
            if (mode === 'income') {
                assetsGroup.style.display = 'flex';
                incomeGroup.style.display = 'none';
                spendingGroup.style.display = 'flex';
                incomeResults.style.display = 'flex';
                monthlyResults.style.display = 'flex';
                assetsResults.style.display = 'none';
                document.getElementById('assets').required = true;
                document.getElementById('desiredIncome').required = false;
            } else {
                assetsGroup.style.display = 'none';
                incomeGroup.style.display = 'flex';
                spendingGroup.style.display = 'none';
                incomeResults.style.display = 'none';
                monthlyResults.style.display = 'none';
                assetsResults.style.display = 'flex';
                document.getElementById('assets').required = false;
                document.getElementById('desiredIncome').required = true;
                // Clear previous result
                document.getElementById('requiredAssets').textContent = '';
            }
            document.getElementById('results').style.display = 'none';
        });
    });

    document.getElementById('incomeForm').onsubmit = function(e) {
        e.preventDefault();
        const returnRate = parseFloat(this.return.value);
        const mode = document.querySelector('.toggle-btn.active').dataset.mode;
        if (isNaN(returnRate)) return;
        if (mode === 'income') {
            // Calculate income from assets
            const assets = parseFloat(this.assets.value);
            const spending = parseFloat(this.spending.value) || 0;
            if (isNaN(assets)) return;
            const annualIncome = assets * (returnRate / 100);
            const monthlyIncome = annualIncome / 12;
            document.getElementById('annualIncome').textContent = formatCurrency(annualIncome);
            document.getElementById('monthlyIncome').textContent = formatCurrency(monthlyIncome);
            // Show spending comparison if provided
            const spendingResult = document.getElementById('spendingResult');
            if (spending > 0) {
                const shortfall = spending - monthlyIncome;
                document.getElementById('monthlyShortfall').textContent = formatCurrency(Math.abs(shortfall));
                spendingResult.style.display = 'flex';
                spendingResult.querySelector('span:first-child').textContent = 
                    shortfall <= 0 ? 'Monthly Surplus:' : 'Monthly Shortfall:';
            } else {
                spendingResult.style.display = 'none';
            }
            assetsResults.style.display = 'none';
        } else {
            // Calculate required assets from desired income
            const desiredIncome = parseFloat(this.desiredIncome.value);
            if (isNaN(desiredIncome)) return;
            const annualIncome = desiredIncome * 12;
            const requiredAssets = (annualIncome / (returnRate / 100));
            document.getElementById('requiredAssets').innerHTML = `<strong>€${formatCurrency(requiredAssets)}</strong> required to generate €${formatCurrency(desiredIncome)} per month at ${returnRate}% annual return.`;
            assetsResults.style.display = 'flex';
            // Hide spending result in required assets mode
            document.getElementById('spendingResult').style.display = 'none';
        }
        document.getElementById('results').style.display = 'block';
    };
} 

// Sell Asset Simulator
// Add toggle and required assets calculation
function calculateRequiredAssets(withdrawal, years, returnRate) {
    // Formula for present value of an ordinary annuity
    // PV = PMT * [1 - (1 + r)^-n] / r
    const r = returnRate / 100;
    if (r === 0) return withdrawal * years;
    return withdrawal * (1 - Math.pow(1 + r, -years)) / r;
}

document.addEventListener('DOMContentLoaded', function() {
    const sellForm = document.getElementById('sellForm');
    const toggleBtns = document.querySelectorAll('.calculator-toggle .toggle-btn');
    const assetsGroup = document.getElementById('assetsGroup');
    const withdrawalGroup = document.getElementById('withdrawalGroup');
    const returnGroup = document.getElementById('returnGroup');
    const yearsGroup = document.getElementById('yearsGroup');
    const resultsDiv = document.getElementById('results');
    const drawdownResults = document.getElementById('drawdownResults');
    const requiredResults = document.getElementById('requiredResults');
    const requiredAssetsResult = document.getElementById('requiredAssetsResult');

    if (requiredResults) {
        requiredResults.style.display = 'none';
    }

    if (sellForm) {
        // Toggle logic
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.dataset.mode;
                if (mode === 'drawdown') {
                    assetsGroup.style.display = '';
                    yearsGroup.style.display = 'none';
                    drawdownResults.style.display = '';
                    requiredResults.style.display = 'none';
                    document.getElementById('assets').required = true;
                    document.getElementById('years').required = false;
                } else {
                    assetsGroup.style.display = 'none';
                    yearsGroup.style.display = '';
                    drawdownResults.style.display = 'none';
                    requiredResults.style.display = '';
                    document.getElementById('assets').required = false;
                    document.getElementById('years').required = true;
                }
                resultsDiv.style.display = 'none';
            });
        });

        sellForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const assets = parseFloat(document.getElementById('assets').value);
            let withdrawal = parseFloat(document.getElementById('withdrawal').value);
            const returnRate = parseFloat(document.getElementById('return').value);
            if (isNaN(assets) || isNaN(withdrawal) || isNaN(returnRate)) return;
            // Calculate implied withdrawal rate
            const withdrawalRate = (withdrawal * 12) / assets * 100;
            const annualWithdrawal = withdrawal * 12;
            let currentAssets = assets;
            let years = 0;
            const yearlyResults = [];
            while (currentAssets > 0 && years < 100) {
                yearlyResults.push({
                    year: years + 1,
                    assets: currentAssets
                });
                currentAssets = (currentAssets - annualWithdrawal) * (1 + returnRate / 100);
                years++;
            }
            resultsDiv.style.display = 'block';
            drawdownResults.style.display = '';
            const warningMessage = document.getElementById('warningMessage');
            const resultMessage = document.getElementById('resultMessage');
            const yearlyData = document.getElementById('yearlyData');
            warningMessage.style.display = annualWithdrawal > (assets * returnRate / 100) ? 'block' : 'none';
            let resultText = '';
            if (years >= 30) {
                resultText += '<div class="success-message">✅ Your strategy is likely sustainable</div>';
            } else {
                resultText += `<div class="warning-message">⚠️ Your assets will last ${years} years</div>`;
            }
            resultText += `<div style='margin-top:1rem; color:#333;'><strong>Your assets will last:</strong> ${years} years</div>`;
            resultText += `<div style='margin-top:0.5rem; color:#333;'><strong>Monthly Withdrawal:</strong> €${formatLargeNumber(withdrawal)}<br><strong>Implied Withdrawal Rate:</strong> ${withdrawalRate.toFixed(2)}%</div>`;
            resultMessage.innerHTML = resultText;
            yearlyData.innerHTML = yearlyResults.map(({ year, assets }) => `
                <tr>
                    <td>${year}</td>
                    <td>€${formatLargeNumber(assets)}</td>
                </tr>
            `).join('');
        });
    }
}); 

// Dashboard logic from dashboard.html
// ... existing code ...
document.addEventListener('DOMContentLoaded', async () => {
  // Add active state to current page in navigation
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });

  const tableBody = document.getElementById('monthlyTableBody');

  function getMonthName(m) {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  }

  // Format numbers as 1K, 1M, 1B with max 3 digits
    // Calculate dashboard stats
    Object.values(summary).forEach(({income, expenses}) => {
      const savings = income - expenses;
      totalSavings += savings;
      totalIncome += income;
      if (income > 0) {
        totalSavingsRate += (savings / income);
        count++;
      }
    });

}, // Add missing comma here

document.getElementById('retirementForm').onsubmit = function(e) {
    e.preventDefault();
    const years = parseFloat(this.years.value);
    const monthlyIncome = parseFloat(this.monthlyIncome.value);
    const currentSavings = parseFloat(this.currentSavings.value);
    const roi = parseFloat(this.roi.value) / 100;
    const withdrawalRate = parseFloat(this.withdrawalRate.value) / 100;
    
    if (isNaN(years) || isNaN(monthlyIncome) || isNaN(currentSavings) || isNaN(roi) || isNaN(withdrawalRate) || withdrawalRate === 0) return;
    
    // Calculate target wealth needed at retirement
    const targetWealth = (monthlyIncome * 12) / withdrawalRate;
    
    // Calculate future value of current savings
    const fvCurrent = currentSavings * Math.pow(1 + roi, years);
    
    // Calculate required monthly investment (PMT)
    // FV = PMT * [((1 + r)^n - 1) / r]
    let requiredMonthly = 0;
    if (fvCurrent < targetWealth) {
        const n = years * 12;
        const r = Math.pow(1 + roi, 1/12) - 1;
        requiredMonthly = (targetWealth - fvCurrent) * r / (Math.pow(1 + r, n) - 1);
    }
    
    // Output
    const resultsDiv = document.getElementById('results');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `<div><strong>Target wealth needed at retirement:</strong> ${formatCurrency(targetWealth)}</div>`;
    
    let monthlyInvest = 0;
    if (fvCurrent >= targetWealth) {
        resultsDiv.innerHTML += `<div class="success">🎉 You're already on track!</div>`;
        monthlyInvest = 0;
    } else {
        monthlyInvest = Math.ceil(requiredMonthly);
    }
    resultsDiv.innerHTML += `<div class="invest">🚀 You need to invest <strong>${formatCurrency(monthlyInvest)}/month</strong></div>`;
}); // Add missing closing parenthesis 