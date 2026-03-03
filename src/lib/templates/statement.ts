import type { ForgeConfig } from '../config';

export function generateHTMLStatement(data: ForgeConfig): string {
  const { transactions = [], ...config } = data;
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
.logo-diamond {width: 32px;height: 32px;background-color: #FFCC00;transform: rotate(45deg);margin-top: 4px;}
.bank-details {font-size: 8.5pt;line-height: 1.1;}
.statement-heading {color: #FFCC00;font-size: 32pt;font-weight: 400;margin: 0 0 10px 0;text-align: right;letter-spacing: -0.5pt;}
.summary-table {width: 280px;border-collapse: collapse;font-size: 10pt;font-weight: 300;float: right;}
.summary-table td {padding: 8px 0;border-top: 1.2pt solid #FFC523;}
.summary-label {font-weight: bold;}
.summary-value {text-align: right;}
.sub-header {display: flex;justify-content: flex-end;padding: 20px 0;position: absolute;top: 12mm;right: 20mm;width: 280px;}
.sub-header-box {width: 280px;}
.sub-header-row {display: flex;justify-content: space-between;padding: 5px 0;border-bottom: 1pt solid #FFC523;font-size: 10.5pt;}
.smart-access {font-size: 22pt;font-weight: bold;margin-top: 40px;}
.yellow-divider {border-top: 1.8pt solid #FFC523;margin: 12px 0;}
.transaction-table {width: 100%;border-collapse: collapse;font-size: 9pt;margin-top: 20px;}
.transaction-table thead tr {background-color: #FFC523;}
.transaction-table th {padding: 6px 8px;text-align: left;font-weight: bold;}
.transaction-table td {padding: 4px 8px;border-bottom: 1.5pt solid #FFC523;vertical-align: top;line-height:1.28;}
.transaction-table td:first-child {width: auto;padding-left: 2px;padding-right: 4px;border-bottom: none;text-align: right;white-space: nowrap;}
.transaction-table th:first-child {width: auto;padding-left: 2px;padding-right: 4px;border-bottom: none;text-align: left;}
.transaction-table td:nth-child(2), .transaction-table th:nth-child(2) {padding-left: 4px;width: 78mm;}
.transaction-table td:nth-child(3), td:nth-child(4), td:nth-child(5), .transaction-table th:nth-child(3), th:nth-child(4), th:nth-child(5) {text-align: right;padding-right: 2px;}
.transaction-table th:nth-child(3) {width: 37mm;}
.transaction-table th:nth-child(4) {width: 20mm;}
.transaction-table th:nth-child(5) {width: 33mm;}
.bar {position: absolute;top: 34mm;left: 20mm;width: 170mm;height: 47mm;background: linear-gradient(90deg, #FFCC00 0%, #FFD633 50%, #FFCC00 100%);box-shadow: 0 4px 8px rgba(0,0,0,0.15);}
.table-container {position: absolute;left: 20mm;width: 170mm;}
.reference {position: absolute;top: 46mm;left: 20mm;font-size: 10pt;font-weight: bold;}
.address {font-size: 10pt;line-height: 1.2;margin-top: 10px;}
</style>
</head>
<body>`;

  // Page 1 — exact match to your screenshot
  html += `<div class="page" style="padding-top:12mm">
<div class="header-main">
<div class="bank-brand">
<div class="logo-diamond"></div>
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
<tr><td class="summary-label">Statement 13</td><td class="summary-value">(Page 1 of ${config.total_pages})</td></tr>
<tr><td class="summary-label">Account Number</td><td class="summary-value">${config.account_number}</td></tr>
<tr><td class="summary-label">Statement<br>Period</td><td class="summary-value">${config.statement_period}</td></tr>
<tr><td class="summary-label">Closing Balance</td><td class="summary-value">$${config.closing_balance.toFixed(2)} CR</td></tr>
<tr><td class="summary-label">Enquiries</td><td class="summary-value">${config.enquiries}</td></tr>
</table>
</div>
</div>
<div class="address">${config.display_name}<br>${config.address}</div>
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

  transactions.slice(0, 12).forEach(tx => {
    html += `<tr><td>${tx.date}</td><td style="line-height:1.28">${tx.desc}</td><td>${tx.debit}</td><td>${tx.credit}</td><td>${tx.balance}</td></tr>`;
  });

  html += `</tbody></table></div>`;

  // Pages 2–16 with CSS yellow bar on page 2
  let remaining = transactions.slice(12);
  for (let p = 2; p <= config.total_pages; p++) {
    html += `<div class="page">
<div class="sub-header">
<div class="sub-header-box">
<div class="sub-header-row"><span style="font-weight:600;">Statement 13</span><span>(Page ${p} of ${config.total_pages})</span></div>
<div class="sub-header-row"><span style="font-weight:600;">Account Number</span><span>${config.account_number}</span></div>
</div>
</div>`;
    if (p === 2) html += `<div class="bar"></div>`;
    const tableTop = p === 2 ? 74 : 37;
    html += `<div class="table-container" style="top:${tableTop}mm">
<table class="transaction-table">
<thead><tr><th>Date</th><th>Transaction</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
<tbody>`;
    const rowsThisPage = p < config.total_pages ? 15 : remaining.length;
    remaining.slice(0, rowsThisPage).forEach(tx => {
      html += `<tr><td>${tx.date}</td><td style="line-height:1.28">${tx.desc}</td><td>${tx.debit}</td><td>${tx.credit}</td><td>${tx.balance}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    if (p === config.total_pages) {
      html += `<div style="position:absolute;bottom:38mm;left:20mm;right:20mm;font-size:9pt;line-height:1.4">
<strong>Important Information:</strong><br>
We try to get things right the first time – but if we don’t, we’ll do what we can to fix it.<br>
You can fix most problems simply by contacting us.<br>
Write to: CBA Group Customer Relations, Reply Paid 41, Sydney NSW 2001<br>
Tell us online: commbank.com.au/support/compliments-and-complaints.html<br>
Call: 1800 805 605 (free call)<br><br>
You can also contact the Australian Financial Complaints Authority, AFCA, an independent external dispute resolution body approved by ASIC.<br>
Call: 1800 931 678, free call Monday to Friday 9am–5pm, AEST
</div>`;
    }
    html += `</div>`;
    remaining = remaining.slice(rowsThisPage);
  }
  html += `</body></html>`;
  return html;
}
