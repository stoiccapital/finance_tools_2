// Financial Freedom Tools - Main JavaScript file
console.log('Financial Freedom Tools initialized');

// Add your JavaScript logic here 

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
        const withdrawalRate = parseFloat(this.withdrawalRate.value);
        const ltv = parseFloat(this.ltv.value);
        const interest = parseFloat(this.interest.value);
        const borrowPercent = parseFloat(this.borrowPercent.value);
        const dividendRate = parseFloat(this.dividendRate.value);
        
        if (isNaN(income) || isNaN(annualReturn) || isNaN(withdrawalRate) || 
            isNaN(ltv) || isNaN(interest) || isNaN(dividendRate)) return;

        // Calculate required assets for each strategy
        const requiredAssetsIncome = (income * 12) / (dividendRate / 100);
        const requiredAssetsSell = (income * 12) / (withdrawalRate / 100);
        const requiredAssetsBorrow = !isNaN(borrowPercent) ? 
            (income * 12) / (borrowPercent / 100) : 
            (income * 12) / (ltv / 100);

        // Calculate all years in parallel
        const years = 100;
        let assetIncomeArr = [];
        let sellAssetsArr = [];
        let borrowArr = [];

        // Asset Income calculations
        let assets1 = requiredAssetsIncome;
        for (let y = 1; y <= years; y++) {
            let annualIncome = assets1 * (dividendRate / 100);
            assetIncomeArr.push({assets: assets1, income: annualIncome});
            assets1 = assets1 * (1 + (annualReturn - dividendRate) / 100);
        }

        // Selling Assets calculations
        let assets2 = requiredAssetsSell;
        for (let y = 1; y <= years; y++) {
            let withdrawal = assets2 * (withdrawalRate / 100);
            sellAssetsArr.push({assets: assets2, withdrawal: withdrawal});
            assets2 = (assets2 - withdrawal) * (1 + annualReturn / 100);
            if (assets2 < 0) assets2 = 0;
        }

        // Borrowing calculations
        let assets3 = requiredAssetsBorrow;
        let borrowed = 0;
        let totalDebt = 0;
        for (let y = 1; y <= years; y++) {
            assets3 = assets3 * (1 + annualReturn / 100);
            let maxBorrow = assets3 * (ltv / 100);
            let toBorrow = !isNaN(borrowPercent) ? 
                assets3 * (borrowPercent / 100) : 
                income * 12;
            toBorrow = Math.min(toBorrow, maxBorrow - borrowed);
            if (toBorrow < 0) toBorrow = 0;
            borrowed += toBorrow;
            let interestCost = borrowed * (interest / 100);
            borrowed += interestCost;
            assets3 -= interestCost;
            if (assets3 < 0) assets3 = 0;
            totalDebt = borrowed;
            borrowArr.push({assets: assets3, toBorrow, interestCost, totalDebt});
            
            if (toBorrow === 0 && borrowed >= maxBorrow) break;
        }

        // Build combined table
        let table = `<table class='compare-table'><thead><tr><th>Year</th><th colspan='2'>Asset Income</th><th colspan='2'>Selling Assets</th><th colspan='4'>Buy, Borrow, Die</th></tr><tr><th></th><th>Assets</th><th>Income</th><th>Assets</th><th>Withdrawal</th><th>Assets</th><th>Borrowed</th><th>Interest</th><th>Total Debt</th></tr></thead><tbody>`;
        
        for (let y = 0; y < years; y++) {
            table += `<tr><td>${y+1}</td>`;
            // Asset Income
            table += `<td>${formatLargeNumber(assetIncomeArr[y]?.assets)}</td><td>${formatLargeNumber(assetIncomeArr[y]?.income)}</td>`;
            // Selling Assets
            table += `<td>${formatLargeNumber(sellAssetsArr[y]?.assets)}</td><td>${formatLargeNumber(sellAssetsArr[y]?.withdrawal)}</td>`;
            // Borrowing
            table += `<td>${formatLargeNumber(borrowArr[y]?.assets)}</td><td>${formatLargeNumber(borrowArr[y]?.toBorrow)}</td><td>${formatLargeNumber(borrowArr[y]?.interestCost)}</td><td>${formatLargeNumber(borrowArr[y]?.totalDebt)}</td>`;
            table += `</tr>`;
        }
        table += `</tbody></table>`;
        
        document.getElementById('results').innerHTML = `<div class='strategy-card' style='width:100%;max-width:none;'>${table}</div>`;
        document.getElementById('results').style.display = 'block';
    };
} 