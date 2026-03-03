interface IncomeSource {
  name: string;
  amount: number;
  frequency: string;
  day_of_week?: number;
  day_of_month?: number[];
  enabled: boolean;
}

interface Config {
  account_number: string;
  account_holder: string;
  display_name: string;
  address: string;
  opening_balance: number;
  closing_balance: number;
  statement_period: string;
  total_pages: number;
  enquiries: string;
  reference: string;
  income_sources: IncomeSource[];
  monthly_spend_target: number;
}

const config: Config = {
  account_number: "06 3097 3865 4102",
  account_holder: "SHELAM DRIVIS LEE SANDFORD",
  display_name: "MR SD SANDFORD",
  address: "UNIT 4 14-16 TORRENS RD<br>CABOOLTURE SOUTH QLD 4510",
  opening_balance: 189.18,
  closing_balance: 360.93,
  statement_period: "2 Feb 2025 - 20 Mar 2025",
  total_pages: 16,
  enquiries: "13 2221",
  reference: "036",
  income_sources: [
    { name: "WAGE JOHN HOLLAND", amount: 1200.00, frequency: "weekly", day_of_week: 5, enabled: true },
    { name: "PENSION", amount: 950.00, frequency: "fortnightly", day_of_month: [8, 22], enabled: true }
  ],
  monthly_spend_target: 2500.00
};



// =============================================
// GENERATE TRANSACTIONS (equivalent to transgen.py)
// =============================================

const months: { [key: string]: number } = {
  'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
  'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(str: string): Date {
  const parts = str.trim().split(' ');
  const day = parseInt(parts[0]);
  const month = months[parts[1]];
  const year = parseInt(parts[2]);
  return new Date(year, month, day);
}

function formatDate(d: Date): string {
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  return `${day} ${month}`;
}

function formatAmount(amount: number): string {
  const fixed = Math.abs(amount).toFixed(2);
  const withCommas = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${withCommas}`;
}

function choice(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Transaction {
  date: string;
  desc: string;
  debit?: string;
  credit?: string;
  balance: string;
}

function generateStatement(customConfig: any): Transaction[] {
  const [startStr, endStr] = customConfig.statement_period.split(' - ');
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const opening = customConfig.opening_balance;
  const closing = customConfig.closing_balance;
  const days = (end.getTime() - start.getTime()) / 86400000;

  // Generate income transactions
  let incomeTxs: any[] = [];
  let totalIncome = 0;
  for (const source of customConfig.income_sources) {
    if (!source.enabled) continue;
    if (source.frequency === 'weekly') {
      let d = new Date(start);
      // Find first occurrence of day_of_week
      d.setDate(d.getDate() + (source.day_of_week + 7 - d.getDay()) % 7);
      while (d <= end) {
        const dateStr = formatDate(d);
        const amount = source.amount;
        totalIncome += amount;
        incomeTxs.push({
          date: dateStr,
          desc: source.name,
          credit: formatAmount(amount),
          debit: '',
          dateObj: new Date(d)
        });
        d = new Date(d.getTime() + 7 * 86400000);
      }
    } else if (source.frequency === 'fortnightly') {
      let d = new Date(start.getFullYear(), start.getMonth(), 1);
      while (d <= end) {
        for (const dom of source.day_of_month || []) {
          const pd = new Date(d.getFullYear(), d.getMonth(), dom);
          if (pd >= start && pd <= end) {
            const dateStr = formatDate(pd);
            const amount = source.amount;
            totalIncome += amount;
            incomeTxs.push({
              date: dateStr,
              desc: source.name,
              credit: formatAmount(amount),
              debit: '',
              dateObj: new Date(pd)
            });
          }
        }
        d.setMonth(d.getMonth() + 1);
      }
    }
  }

  // Calculate required debits
  const requiredNet = closing - opening;
  let requiredDebit = totalIncome - requiredNet;
  if (requiredDebit < 0) requiredDebit = 0; // Avoid negative debits

  // Generate expense transactions
  const numExpenses = Math.floor(days / 2) + 1; // Rough estimate
  const expenseDescs = [
    "WOOLWORTHS", "COLES SUPERMARKET", "BP FUEL", "UBER EATS", "NETFLIX SUBSCRIPTION",
    "ELECTRICITY BILL", "TRANSFER TO SAVINGS", "CASH WITHDRAWAL ATM", "AMAZON PURCHASE",
    "MYER STORE", "APPLE ITUNES", "SPOTIFY PREMIUM", "MCDONALDS", "STARBUCKS",
    "DOMINOS PIZZA", "KFC", "HUNGRY JACKS", "SUBWAY", "PIZZA HUT", "RED ROOSTER"
  ];
  let expenseTxs: any[] = [];
  if (numExpenses > 0 && requiredDebit > 0) {
    const averageDebit = requiredDebit / numExpenses;
    let expenseAmounts: number[] = [];
    for (let i = 0; i < numExpenses - 1; i++) {
      const variation = (Math.random() - 0.5) * 0.5 * averageDebit;
      expenseAmounts.push(averageDebit + variation);
    }
    const sumSoFar = expenseAmounts.reduce((a, b) => a + b, 0);
    expenseAmounts.push(requiredDebit - sumSoFar);

    for (let i = 0; i < numExpenses; i++) {
      if (expenseAmounts[i] <= 0) continue;
      const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      const dateStr = formatDate(d);
      const desc = choice(expenseDescs);
      const debit = formatAmount(expenseAmounts[i]);
      expenseTxs.push({
        date: dateStr,
        desc,
        debit,
        credit: '',
        dateObj: new Date(d)
      });
    }
  }

  // Combine and sort by date
  let allTxs = incomeTxs.concat(expenseTxs);
  allTxs.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Compute running balances
  let balance = opening;
  const txs: Transaction[] = allTxs.map(tx => {
    if (tx.credit) {
      balance += parseFloat(tx.credit.replace(/[$,]/g, ''));
    } else if (tx.debit) {
      balance -= parseFloat(tx.debit.replace(/[$,]/g, ''));
    }
    let balanceStr = formatAmount(Math.abs(balance));
    let suffix = ' CR';
    if (balance < 0) {
      balanceStr = balanceStr.replace('$', '$-');
      suffix = ' DR';
    }
    tx.balance = balanceStr + suffix;
    delete tx.dateObj;
    return tx;
  });

  return txs;
}

const transgenCustomConfig = {
  opening_balance: config.opening_balance,
  closing_balance: config.closing_balance,
  income_sources: config.income_sources,
  monthly_spend_target: config.monthly_spend_target,
  statement_period: config.statement_period
};

const txs = generateStatement(transgenCustomConfig);

const closingBalanceStr = txs[txs.length - 1]?.balance || `$${transgenCustomConfig.closing_balance.toFixed(2)} CR`;

console.log(`Opening balance: $${transgenCustomConfig.opening_balance.toFixed(2)}`);
console.log(`Closing balance: ${closingBalanceStr}`);
console.log(`Loaded ${txs.length} rows from generated transactions`);
console.log(`Opening balance: $${config.opening_balance.toFixed(2)}`);
console.log(`Closing balance: $${config.closing_balance.toFixed(2)}`);

// =============================================
// FINAL SCRIPT — MATCHES YOUR NEW SCREENSHOT
// =============================================

let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Statement Template</title>
<style>
@page {size: A4;margin: 0;}
body {margin: 0;padding: 0;font-family: Helvetica, sans-serif;color: #1A1A1A;-webkit-print-color-adjust: exact;font-weight: 300;}
.page {width: 210mm;height: 297mm;padding: 0 20mm;box-sizing: border-box;position: relative;background: #fff;page-break-after: always;}
.header-main {display: flex;justify-content: space-between;align-items: flex-start;margin-bottom: 30px;}
.bank-brand {display: flex;align-items: flex-start;gap: 12px;}
.logo {width: 32px;height: auto;margin-top: 4px;}
.bank-details {font-size: 8.5pt;line-height: 1.1;}
.statement-heading {color: #FFCC00;font-size: 32pt;font-weight: 400;margin: 0 0 10px 0;text-align: right;letter-spacing: -0.5pt;}
.summary-table {width: 280px;border-collapse: collapse;font-size: 10pt;font-weight: 300;float: right;}
.summary-table td {padding: 8px 0;border-top: 1.2pt solid #FFC523;}
.summary-label {font-weight: bold;}
.summary-value {text-align: right;}
.sub-header {display: flex;justify-content: flex-end;padding: 20px 0;position: absolute;top: 12mm;right: 20mm;width: 224px;}
.sub-header-box {width: 224px;}
.sub-header-row {display: flex;justify-content: space-between;padding: 5px 0;border-bottom: 1pt solid #FFC523;font-size: 10.5pt;}
.smart-access {font-size: 22pt;font-weight: bold;margin-top: 40px;}
.yellow-divider {border-top: 1.8pt solid #FFC523;margin: 12px 0;}
.transaction-table {width: 100%;border-collapse: collapse;font-size: 9pt;margin-top: 20px;}
.transaction-table thead tr {background-color: #FFC523;}
.transaction-table th {padding: 6px 8px;text-align: left;font-weight: bold;font-size: 11pt;}
.transaction-table td {padding: 4px 8px;border-bottom: 1.5pt solid #FFC523;vertical-align: top;line-height:1.28;}
.transaction-table td:first-child {width: auto;padding-left: 2px;padding-right: 4px;border-bottom: none;text-align: right;white-space: nowrap;}
.transaction-table th:first-child {width: auto;padding-left: 2px;padding-right: 4px;border-bottom: none;text-align: left;}
.transaction-table td:nth-child(2), .transaction-table th:nth-child(2) {padding-left: 4px;width: 78mm;}
.transaction-table td:nth-child(3), td:nth-child(4), td:nth-child(5),
.transaction-table th:nth-child(3), th:nth-child(4), th:nth-child(5) {text-align: right;padding-right: 2px;}
.transaction-table th:nth-child(3) {width: 37mm;}
.transaction-table th:nth-child(4) {width: 20mm;}
.transaction-table th:nth-child(5) {width: 33mm;}
.bar {position: absolute;top: 34mm;right: 20mm;width: 85mm;height: auto;}
.table-container {position: absolute;left: 20mm;width: 170mm;}
.reference {position: absolute;top: 46mm;left: 20mm;font-size: 10pt;font-weight: bold;}
.address {font-size: 10pt;line-height: 1.2;margin-top: 10px;}
</style>
</head>
<body>`;

// ====================== PAGE 1 — EXACT MATCH TO YOUR SCREENSHOT ======================
html += `
<div class="page" style="padding-top:12mm">
<div class="header-main">
<div class="bank-brand">
<img src="assets/images/Commonwealthlogo.png" alt="Commonwealth Bank Logo" class="logo">
<div class="bank-details">
<strong>Commonwealth Bank</strong><br>
Commonwealth Bank of Australia<br>
ABN 48 123 123 124 AFSL and<br>
Australian credit licence 234945
</div>
</div>
<div>
<h1 class="statement-heading">Your Statement</h1>
<table class="summary-table">
<tr><td class="summary-label">Statement 13</td><td class="summary-value">(Page 1 of 16)</td></tr>
<tr><td class="summary-label">Account Number</td><td class="summary-value">${config.account_number}</td></tr>
<tr><td class="summary-label">Statement<br>Period</td><td class="summary-value" style="vertical-align:middle;">${config.statement_period}</td></tr>
<tr><td class="summary-label">Closing Balance</td><td class="summary-value">$${config.closing_balance.toFixed(2)} CR</td></tr>
<tr><td class="summary-label">Enquiries</td><td class="summary-value">${config.enquiries}</td></tr>
</table>
</div>
</div>
<div class="address">
${config.display_name}<br>
${config.address}
</div>
<div class="reference">${config.reference}</div>
<div class="smart-access">Smart Access</div>
<div class="yellow-divider"></div>
<p style="font-size:10pt;">Enjoy the convenience and security of withdrawing what you need, when you need it. Plus you can have your monthly account fee waived if you deposit at least $2,000 each calendar month.</p>
<p style="font-size:10pt;margin:8px 0"><strong>Name:</strong> ${config.account_holder}</p>
<p style="font-size:9.8pt;line-height:1.35;margin-top:18px"><strong>Note:</strong> Have you checked your statement today? It's easy to find out more information about each of your transactions by logging on to the CommBank App or NetBank. Should you have any questions on fees or see an error please contact us on the details above. Cheque proceeds are available when cleared.</p>
<div class="yellow-divider"></div>
<p style="font-size:8.8pt;color:#444;margin-top:18px">The date of transactions shown here may be different on your other transaction lists (for example, the transaction list that appears on the CommBank app).</p>
<table class="transaction-table">
<thead>
<tr>
<th>Date</th>
<th>Transaction</th>
<th>Debit</th>
<th>Credit</th>
<th>Balance</th>
</tr>
</thead>
<tbody>`;

html += txs.slice(0, 12).map(tx => `
    <tr>
        <td>${tx.date}</td>
        <td style="line-height:1.28">${tx.desc}</td>
        <td>${tx.debit || ''}</td>
        <td>${tx.credit || ''}</td>
        <td>${tx.balance}</td>
    </tr>`).join('');

html += `</tbody></table></div>`;

// Pages 2–16 (same as before)
let remaining = txs.slice(12);
for (let p = 2; p <= config.total_pages; p++) {
  html += `
<div class="page">
    <div class="sub-header">
        <div class="sub-header-box">
            <div class="sub-header-row"><span style="font-weight:600;">Statement 13</span><span>(Page ${p} of 16)</span></div>
            <div class="sub-header-row"><span style="font-weight:600;">Account Number</span><span>${config.account_number}</span></div>
        </div>
    </div>`;
  let tableTop = 37;
  if (p === 2) {
    html += ` <img src="assets/images/barcode.png" class="bar">`;
    tableTop = 74;
  }
  html += `
    <div class="table-container" style="top:${tableTop}mm">
        <table class="transaction-table">
        <thead><tr><th>Date</th><th>Transaction</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
        <tbody>`;
  const rowsThisPage = (p < config.total_pages) ? 15 : remaining.length;
  html += remaining.slice(0, rowsThisPage).map(tx => `
        <tr>
            <td>${tx.date}</td>
            <td style="line-height:1.28">${tx.desc}</td>
            <td>${tx.debit || ''}</td>
            <td>${tx.credit || ''}</td>
            <td>${tx.balance}</td>
        </tr>`).join('');
  html += `</tbody></table></div>`;
  if (p === config.total_pages) {
    html += `
    <div style="position:absolute;bottom:38mm;left:20mm;right:20mm;font-size:9pt;line-height:1.4">
        <strong>Important Information:</strong><br>
        We try to get things right the first time – but if we don’t, we’ll do what we can to fix it.<br>
        You can fix most problems simply by contacting us.<br>
        Write to: CBA Group Customer Relations, Reply Paid 41, Sydney NSW 2001<br>
        Tell us online: commbank.com.au/support/compliments-and-complaints.html<br>
        Call: 1800 805 605 (free call)<br><br>
        You can also contact the Australian Financial Complaints Authority, AFCA, an independent external dispute resolution body approved by ASIC.<br>
        Write to: Australian Financial Complaints Authority, GPO Box 3, Melbourne VIC 3001<br>
        Email: info@afca.org.au<br>
        Call: 1800 931 678, free call Monday to Friday 9am–5pm, AEST
    </div>`;
  }
  html += `</div>`;
  remaining = remaining.slice(rowsThisPage);
}

html += `</body></html>`;

export { generateStatement, config, html };
export type { Transaction, Config, IncomeSource };