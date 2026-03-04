import type { BankStatement, BankTransaction, AppConfig } from '@/types/payroll';

export interface StatementAssets {
  logoUri: string;
  barcodeUri: string;
}

function fmtAmount(n: number): string {
  return Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
}

function txRow(tx: BankTransaction): string {
  const desc = tx.description.replace(/\n/g, '<br>');
  const isBalanceRow = desc === 'OPENING BALANCE' || desc === 'CLOSING BALANCE';
  const debit = isBalanceRow ? '' : (tx.debit > 0 ? fmtAmount(tx.debit) : '');
  const credit = isBalanceRow ? '' : (tx.credit > 0 ? fmtAmount(tx.credit) : '');
  const bal = `${fmtAmount(tx.balance)} CR`;
  const style = isBalanceRow ? ' style="font-weight:bold;"' : '';
  return `<tr${style}><td>${fmtDate(tx.date)}</td><td style="line-height:1.28">${desc}</td><td>${debit}</td><td>${credit}</td><td>${bal}</td></tr>`;
}

export const CBA_FIRST_PAGE_TX = 10;
export const CBA_CONTINUATION_PAGE_TX = 22;

export function paginateTransactions(
  txs: BankTransaction[],
  firstPageCount: number,
  continuationPageCount: number
): BankTransaction[][] {
  const pages: BankTransaction[][] = [];
  if (txs.length === 0) return pages;

  const firstPage = txs.slice(0, firstPageCount);
  pages.push(firstPage);

  let offset = firstPageCount;
  while (offset < txs.length) {
    pages.push(txs.slice(offset, offset + continuationPageCount));
    offset += continuationPageCount;
  }
  return pages;
}

export function generateStatementHTML(statement: BankStatement, config: AppConfig, assets?: StatementAssets): string {
  const totalPages = statement.pages.length;
  const bsbAcct = `${statement.bsb} ${statement.accountNumber}`;
  const holder = statement.accountHolder;
  const employerAddr = config.employer.address.replace(/\n/g, '<br>');

  const logoImg = assets?.logoUri
    ? `<img src="${assets.logoUri}" style="height:62px;width:auto;" />`
    : `<div style="display:flex;align-items:flex-start;gap:12px;">
<div class="logo-diamond"></div>
<div class="bank-details">
<strong>Commonwealth Bank</strong><br>
Commonwealth Bank of Australia<br>
ABN 48 123 123 124 AFSL and<br>
Australian credit licence 234945
</div>
</div>`;

  const barcodeImg = assets?.barcodeUri
    ? `<div class="barcode-section"><img src="${assets.barcodeUri}" class="barcode-img" /></div>`
    : '';

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bank Statement</title>
<style>
@page {size: A4;margin: 0;}
* {box-sizing: border-box;}
body {margin: 0;padding: 0;font-family: Helvetica, Arial, sans-serif;color: #1A1A1A;-webkit-print-color-adjust: exact;font-weight: 300;font-size: 9pt;}
.page {width: 210mm;height: 297mm;padding: 12mm 20mm 18mm;box-sizing: border-box;position: relative;background: #fff;page-break-after: always;overflow: hidden;}
.page:last-child {page-break-after: avoid;}
.page-content {height: 100%;display: flex;flex-direction: column;overflow: hidden;}
.header-main {display: flex;justify-content: space-between;align-items: flex-start;margin-bottom: 30px;flex-shrink: 0;}
.bank-brand {display: flex;align-items: flex-start;gap: 12px;}
.logo-diamond {width: 32px;height: 32px;background-color: #FFCC00;transform: rotate(45deg);margin-top: 4px;flex-shrink:0;}
.bank-details {font-size: 8.5pt;line-height: 1.1;}
.statement-heading {color: #FFCC00;font-size: 32pt;font-weight: 400;margin: 0 0 10px 0;text-align: right;letter-spacing: -0.5pt;}
.summary-table {width: 250px;border-collapse: collapse;font-size: 10pt;font-weight: 300;float: right;}
.summary-table td {padding: 8px 0;border-top: 1.2pt solid #FFC523;}
.summary-label {font-weight: bold;}
.summary-value {text-align: right;}
.sub-header {display: flex;justify-content: flex-end;padding: 8px 0;flex-shrink: 0;}
.sub-header-box {width: 250px;}
.sub-header-row {display: flex;justify-content: space-between;padding: 5px 0;border-bottom: 1pt solid #FFC523;font-size: 10.5pt;}
.smart-access {font-size: 22pt;font-weight: 900;margin-top: 40px;flex-shrink: 0;}
.yellow-divider {border-top: 1.8pt solid #FFC523;margin: 12px 0;flex-shrink: 0;}
.transaction-table {width: 100%;border-collapse: collapse;font-size: 9pt;margin-top: 20px;flex: 1;}
.transaction-table thead tr {background-color: #FFC523;}
.transaction-table th {padding: 6px 8px;text-align: left;font-weight: 900;font-size: 10pt;}
.transaction-table td {padding: 4px 8px;border-bottom: 1.5pt solid #FFC523;vertical-align: top;line-height:1.28;}
.transaction-table td:first-child {width: auto;padding-left: 2px;padding-right: 4px;border-bottom: none;text-align: right;white-space: nowrap;}
.transaction-table th:first-child {width: auto;padding-left: 2px;padding-right: 4px;text-align: left;}
.transaction-table td:nth-child(2), .transaction-table th:nth-child(2) {padding-left: 4px;width: 78mm;}
.transaction-table td:nth-child(3), .transaction-table td:nth-child(4), .transaction-table td:nth-child(5),
.transaction-table th:nth-child(3), .transaction-table th:nth-child(4), .transaction-table th:nth-child(5) {text-align: right;padding-right: 2px;}
.transaction-table th:nth-child(3) {width: 37mm;}
.transaction-table th:nth-child(4) {width: 20mm;}
.transaction-table th:nth-child(5) {width: 33mm;}
.transaction-table tr {page-break-inside: avoid;break-inside: avoid;}
.address {font-size: 10pt;line-height: 1.2;margin-top: 10px;flex-shrink: 0;}
.barcode-section {width: 100%;margin: 8px 0 4px 0;display: flex;justify-content: flex-end;flex-shrink: 0;}
.barcode-img {width: 60%;height: auto;display: block;}
.page-footer {margin-top: auto;padding-top: 8px;font-size: 8pt;color: #666;flex-shrink: 0;}
.important-info {font-size: 9pt;line-height: 1.4;margin-top: 20px;flex-shrink: 0;}
@media screen {
  body {background: #e8e8e8;padding: 20px;}
  .page {margin: 0 auto 30px;box-shadow: 0 2px 20px rgba(0,0,0,0.15);border-radius: 2px;}
}
@media print {
  .page {height: 297mm;overflow: hidden;page-break-after: always;}
  .page:last-child {page-break-after: avoid;}
  tr {page-break-inside: avoid;break-inside: avoid;}
}
</style>
</head>
<body>`;

  html += `<div class="page">
<div class="page-content">
<div class="header-main">
<div class="bank-brand">
${logoImg}
</div>
<div>
<h1 class="statement-heading">Your Statement</h1>
<table class="summary-table">
<tr><td class="summary-label">Statement</td><td class="summary-value">(Page 1 of ${totalPages})</td></tr>
<tr><td class="summary-label">Account Number</td><td class="summary-value">${bsbAcct}</td></tr>
<tr><td class="summary-label">Statement<br>Period</td><td class="summary-value" style="vertical-align:middle;">${statement.statementPeriod}</td></tr>
<tr><td class="summary-label">Closing Balance</td><td class="summary-value">$${fmtAmount(statement.closingBalance)} CR</td></tr>
</table>
</div>
</div>
<div class="address">${holder}<br>${employerAddr}</div>
<div class="smart-access">Smart Access</div>
<div class="yellow-divider"></div>
<p style="font-size:10pt;flex-shrink:0;">Enjoy the convenience and security of withdrawing what you need, when you need it. Plus you can have your monthly account fee waived if you deposit at least $2,000 each calendar month.</p>
<p style="font-size:10pt;margin:8px 0;flex-shrink:0;"><strong>Name:</strong> ${holder}</p>
<p style="font-size:9.8pt;line-height:1.35;margin-top:18px;flex-shrink:0;"><strong>Note:</strong> Have you checked your statement today? It's easy to find out more information about each of your transactions by logging on to the CommBank App or NetBank.</p>
<div class="yellow-divider"></div>
<table class="transaction-table">
<thead><tr><th>Date</th><th>Transaction</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
<tbody>`;

  const firstPageRows = statement.pages[0] || [];
  firstPageRows.forEach(tx => { html += txRow(tx); });

  html += `</tbody></table>
</div>
</div>`;

  for (let p = 1; p < totalPages; p++) {
    const pageTxs = statement.pages[p] || [];
    html += `<div class="page">
<div class="page-content">
<div class="sub-header">
<div class="sub-header-box">
<div class="sub-header-row"><span style="font-weight:600;">Statement</span><span>(Page ${p + 1} of ${totalPages})</span></div>
<div class="sub-header-row"><span style="font-weight:600;">Account Number</span><span>${bsbAcct}</span></div>
</div>
</div>
${p === 1 ? barcodeImg : ''}
<table class="transaction-table" style="margin-top:${(p === 1 && barcodeImg) ? '8' : '12'}px;">
<thead><tr><th>Date</th><th>Transaction</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
<tbody>`;
    pageTxs.forEach(tx => { html += txRow(tx); });
    html += `</tbody></table>`;

    if (p === totalPages - 1) {
      html += `<div class="important-info">
<strong>Important Information:</strong><br>
We try to get things right the first time – but if we don't, we'll do what we can to fix it.<br>
You can fix most problems simply by contacting us.<br>
Write to: CBA Group Customer Relations, Reply Paid 41, Sydney NSW 2001<br>
Call: 1800 805 605 (free call)
</div>`;
    }
    html += `</div>
</div>`;
  }

  html += `</body></html>`;
  return html;
}
