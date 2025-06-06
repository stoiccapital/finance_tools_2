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

// Dashboard logic from overview.html
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
  function formatCompact(num, isPercent = false) {
    if (isNaN(num)) return '-';
    if (isPercent) {
      return num.toLocaleString(undefined, { maximumSignificantDigits: 3 }) + ' %';
    }
    return num.toLocaleString(undefined, { notation: 'compact', maximumSignificantDigits: 3 });
  }

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbzrb1C_9HmneNmf9H2gFkf6DeHxL9OZHNsL32jmUCbnJoCbwhUGirnkYLIApKlJBLdr/exec');
    const data = await response.json();

    const summary = {};
    let totalSavings = 0;
    let totalIncome = 0;
    let totalSavingsRate = 0;
    let count = 0;

    data.forEach(entry => {
      const year = entry.Year;
      const month = entry.Month;
      const income = parseFloat(entry.Income || 0);
      const expenses = parseFloat(entry.Expenses || 0);
      const savings = income - expenses;

      if (!year || !month) return;

      const key = `${year}-${month}`;
      if (!summary[key]) summary[key] = { income: 0, expenses: 0 };

      summary[key].income += income;
      summary[key].expenses += expenses;
    });

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

    const avgSavingsProjection = count > 0 ? totalSavings / count : 0;
    const avgSavingsRate = count > 0 ? (totalSavingsRate / count) * 100 : 0;
    
    // Short-term projections (months)
    const projection12 = totalSavings + avgSavingsProjection * 12;
    const projection24 = totalSavings + avgSavingsProjection * 24;
    const projection60 = totalSavings + avgSavingsProjection * 60;
    
    // Long-term projections (years)
    const projection10 = totalSavings + avgSavingsProjection * 120; // 10 years
    const projection20 = totalSavings + avgSavingsProjection * 240; // 20 years
    const projection30 = totalSavings + avgSavingsProjection * 360; // 30 years

    document.getElementById('avg-savings').textContent = formatCompact(avgSavingsProjection) + ' €';
    document.getElementById('avg-savings-rate').textContent = formatCompact(avgSavingsRate, true);

    // Prepare data for the chart
    // 1. Sort summary by date
    const sortedKeys = Object.keys(summary).sort((a, b) => {
      const [ya, ma] = a.split('-').map(Number);
      const [yb, mb] = b.split('-').map(Number);
      return ya !== yb ? ya - yb : ma - mb;
    });
    let cumulative = 0;
    const labels = [];
    const actualSavings = [];
    sortedKeys.forEach(key => {
      const { income, expenses } = summary[key];
      cumulative += income - expenses;
      const [year, month] = key.split('-');
      labels.push(getMonthName(parseInt(month)) + ' ' + year);
      actualSavings.push(cumulative);
    });
    
    // 2. Projected savings
    let lastValue = actualSavings.length > 0 ? actualSavings[actualSavings.length - 1] : 0;
    const projectionMonths = [12, 24, 60, 120, 240, 360]; // All projection points
    let projectedLabels = [];
    let projectedSavings = [];
    for (let i = 1; i <= Math.max(...projectionMonths); i++) {
      let date = new Date();
      if (sortedKeys.length > 0) {
        const [lastYear, lastMonth] = sortedKeys[sortedKeys.length - 1].split('-').map(Number);
        date = new Date(lastYear, lastMonth - 1 + i, 1);
      } else {
        date.setMonth(date.getMonth() + i);
      }
      const label = getMonthName(date.getMonth() + 1) + ' ' + date.getFullYear();
      projectedLabels.push(label);
      projectedSavings.push(lastValue + avgSavingsProjection * i);
    }

    // Merge labels for chart
    const allLabels = labels.concat(projectedLabels);
    const allActual = actualSavings.concat(Array(projectedLabels.length).fill(null));
    const allProjected = Array(labels.length).fill(null).concat(projectedSavings);

    // Draw chart
    const ctx = document.getElementById('savingsChart').getContext('2d');
    const roiSlider = document.getElementById('roiSlider');
    const roiValue = document.getElementById('roiValue');
    let savingsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Actual Savings',
            data: allActual,
            borderColor: '#000',
            backgroundColor: 'rgba(0,0,0,0.08)',
            tension: 0.2,
            spanGaps: true,
            pointRadius: 2,
            borderWidth: 2,
          },
          {
            label: 'Projected Savings',
            data: allProjected,
            borderColor: '#000',
            backgroundColor: 'rgba(0,0,0,0.08)',
            borderDash: [6, 6],
            tension: 0.2,
            pointRadius: 0,
            borderWidth: 2,
          },
          {
            label: 'Asset Projection',
            data: Array(labels.length).fill(null).concat(calculateAssetProjection(parseFloat(roiSlider.value)).projected),
            borderColor: '#000',
            backgroundColor: 'rgba(0,0,0,0.08)',
            borderDash: [3, 3],
            tension: 0.2,
            pointRadius: 0,
            borderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { size: 14 } }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + formatCompact(context.parsed.y) + ' €';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) { return formatCompact(value) + ' €'; }
            }
          },
          x: {
            ticks: {
              maxTicksLimit: 12
            }
          }
        }
      }
    });

    Object.entries(summary).forEach(([key, value]) => {
      const [year, month] = key.split("-");
      const balance = value.income - value.expenses;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${getMonthName(parseInt(month))}</td>
        <td>${year}</td>
        <td>${formatCompact(value.income)} €</td>
        <td>${formatCompact(value.expenses)} €</td>
        <td class="${balance >= 0 ? 'positive' : 'negative'}">${formatCompact(balance)} €</td>
      `;
      tableBody.appendChild(row);
    });

    // Asset Projection Chart
    let assetChart = null;

    function calculateAssetProjection(roi) {
      const monthlyRoi = Math.pow(1 + roi / 100, 1/12) - 1;
      let projectedAssets = [];
      let currentAsset = 0;

      // Calculate actual assets up to current date
      sortedKeys.forEach(key => {
        const { income, expenses } = summary[key];
        const savings = income - expenses;
        currentAsset = (currentAsset + savings) * (1 + monthlyRoi);
        projectedAssets.push(currentAsset);
      });

      // Project future assets
      const futureAssets = [];
      let lastAsset = projectedAssets.length > 0 ? projectedAssets[projectedAssets.length - 1] : 0;
      
      for (let i = 1; i <= Math.max(...projectionMonths); i++) {
        lastAsset = (lastAsset + avgSavingsProjection) * (1 + monthlyRoi);
        futureAssets.push(lastAsset);
      }

      return {
        actual: projectedAssets,
        projected: futureAssets
      };
    }

    function updateCharts() {
      const roi = parseFloat(roiSlider.value);
      roiValue.textContent = roi.toFixed(1);
      
      const assetData = calculateAssetProjection(roi);
      
      // Update savings chart
      savingsChart.data.datasets[2].data = Array(labels.length).fill(null).concat(assetData.projected);
      savingsChart.update();
      
      // Update asset chart
      if (assetChart) {
        assetChart.destroy();
      }

      const ctx = document.getElementById('assetChart').getContext('2d');
      assetChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: allLabels,
          datasets: [
            {
              label: 'Actual Assets',
              data: assetData.actual.concat(Array(projectedLabels.length).fill(null)),
              borderColor: '#000',
              backgroundColor: 'rgba(0,0,0,0.08)',
              tension: 0.2,
              spanGaps: true,
              pointRadius: 2,
              borderWidth: 2,
            },
            {
              label: 'Projected Assets',
              data: Array(labels.length).fill(null).concat(assetData.projected),
              borderColor: '#000',
              backgroundColor: 'rgba(0,0,0,0.08)',
              borderDash: [6, 6],
              tension: 0.2,
              pointRadius: 0,
              borderWidth: 2,
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: { font: { size: 14 } }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + formatCompact(context.parsed.y) + ' €';
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) { return formatCompact(value) + ' €'; }
              }
            },
            x: {
              ticks: {
                maxTicksLimit: 12
              }
            }
          }
        }
      });
    }

    // Update projection table
    function updateProjectionTable() {
      // Savings projections
      const savings = [12, 24, 60, 120, 240, 360].map(m => totalSavings + avgSavingsProjection * m);
      document.getElementById('savings-1y').textContent = formatCompact(savings[0]) + ' €';
      document.getElementById('savings-2y').textContent = formatCompact(savings[1]) + ' €';
      document.getElementById('savings-5y').textContent = formatCompact(savings[2]) + ' €';
      document.getElementById('savings-10y').textContent = formatCompact(savings[3]) + ' €';
      document.getElementById('savings-20y').textContent = formatCompact(savings[4]) + ' €';
      document.getElementById('savings-30y').textContent = formatCompact(savings[5]) + ' €';
      // Asset projections
      const roi = parseFloat(roiSlider.value);
      const assetData = calculateAssetProjection(roi);
      const asset = [11, 23, 59, 119, 239, 359].map(i => assetData.projected[i] || assetData.projected[assetData.projected.length-1] || 0);
      document.getElementById('asset-1y').textContent = formatCompact(asset[0]) + ' €';
      document.getElementById('asset-2y').textContent = formatCompact(asset[1]) + ' €';
      document.getElementById('asset-5y').textContent = formatCompact(asset[2]) + ' €';
      document.getElementById('asset-10y').textContent = formatCompact(asset[3]) + ' €';
      document.getElementById('asset-20y').textContent = formatCompact(asset[4]) + ' €';
      document.getElementById('asset-30y').textContent = formatCompact(asset[5]) + ' €';
    }
    // Call on load and whenever ROI changes
    roiSlider.addEventListener('input', () => {
      updateCharts();
      updateProjectionTable();
    });
    updateProjectionTable();

  } catch (err) {
    console.error("Failed to load monthly summary:", err);
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5">⚠️ Failed to load data.</td>`;
    tableBody.appendChild(row);
  }
}); 

function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    }).format(amount);
}

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
}; 