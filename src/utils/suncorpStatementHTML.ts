import type { BankStatement, BankTransaction, AppConfig } from '@/types/payroll';
import type { StatementAssets } from '@/utils/statementHTML';

function fmtAmount(n: number): string {
  return Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  const date = new Date(d);
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function balanceStr(bal: number): string {
  if (bal < 0) {
    return `$${fmtAmount(bal)} DR`;
  }
  return `$${fmtAmount(bal)} CR`;
}

function txRow(tx: BankTransaction): string {
  const desc = tx.description.replace(/\n/g, '<br>');
  const isBalanceRow = desc === 'OPENING BALANCE' || desc === 'CLOSING BALANCE' || desc === 'BALANCE CARRIED FORWARD';
  if (isBalanceRow) {
    return `<tr class="balance-row"><td>${fmtDate(tx.date)}</td><td>${desc}</td><td></td><td></td><td>${balanceStr(tx.balance)}</td></tr>`;
  }
  const withdrawal = tx.debit > 0 ? fmtAmount(tx.debit) : '';
  const deposit = tx.credit > 0 ? fmtAmount(tx.credit) : '';
  return `<tr><td>${fmtDate(tx.date)}</td><td style="line-height:1.3">${desc}</td><td>${withdrawal}</td><td>${deposit}</td><td>${balanceStr(tx.balance)}</td></tr>`;
}

export const SUNCORP_FIRST_PAGE_TX = 12;
export const SUNCORP_CONTINUATION_PAGE_TX = 22;

export function generateSuncorpStatementHTML(statement: BankStatement, config: AppConfig, _assets?: StatementAssets): string {
  const totalPages = statement.pages.length;
  const holder = statement.accountHolder;
  const employerAddr = config.employer.address.replace(/\n/g, '<br>');
  const bsbFormatted = statement.bsb;
  const acctNum = statement.accountNumber;

  const totalWithdrawals = statement.transactions.reduce((s, t) => s + t.debit, 0);
  const totalDeposits = statement.transactions.reduce((s, t) => s + t.credit, 0);

  const periodParts = statement.statementPeriod.split(' - ');
  const periodStart = periodParts[0] || '';
  const periodEnd = periodParts[1] || '';

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Suncorp Bank Statement</title>
<style>
@page {size: A4;margin: 0;}
* {box-sizing: border-box;}
body {margin: 0;padding: 0;font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;color: #1A1A1A;-webkit-print-color-adjust: exact;font-weight: 400;font-size: 9pt;}
.page {width: 210mm;height: 297mm;padding: 14mm 18mm 20mm;box-sizing: border-box;position: relative;background: #fff;page-break-after: always;overflow: hidden;}
.page:last-child {page-break-after: avoid;}
.page-content {height: 100%;display: flex;flex-direction: column;overflow: hidden;}

.suncorp-header {display: flex;justify-content: space-between;align-items: flex-start;margin-bottom: 6px;flex-shrink: 0;}
.suncorp-logo-area {display: flex;align-items: center;gap: 6px;}
.suncorp-logo-text {font-size: 18pt;font-weight: 700;color: #004B87;letter-spacing: 0.5pt;}
.suncorp-logo-circle {width: 22px;height: 22px;border-radius: 50%;border: 2.5px solid #D4A843;display: inline-block;margin-left: 4px;}
.suncorp-top-right {text-align: right;font-size: 9pt;line-height: 1.4;}
.suncorp-top-right .bsb {font-weight: 600;}
.suncorp-website {color: #004B87;font-size: 8.5pt;}

.account-title {text-align: center;font-size: 14pt;font-weight: 600;margin: 10px 0 14px;color: #1A1A1A;flex-shrink: 0;}

.account-info-section {margin-bottom: 12px;font-size: 9pt;line-height: 1.5;flex-shrink: 0;}
.account-info-section .holder-name {font-weight: 700;font-size: 9.5pt;}
.account-info-row {display: flex;justify-content: space-between;margin-top: 2px;}
.account-info-label {font-weight: 600;color: #333;}

.summary-section {border-top: 1.5px solid #1A1A1A;border-bottom: 1.5px solid #1A1A1A;padding: 8px 0;margin-bottom: 14px;flex-shrink: 0;}
.summary-grid {display: flex;justify-content: space-between;font-size: 9pt;}
.summary-item {text-align: center;flex: 1;}
.summary-item-label {font-weight: 600;color: #555;font-size: 8pt;text-transform: uppercase;letter-spacing: 0.3pt;margin-bottom: 3px;}
.summary-item-value {font-weight: 700;font-size: 10pt;color: #1A1A1A;}

.promo-box {background: #F5F5F5;border: 1px solid #DDD;border-radius: 3px;padding: 8px 12px;margin-bottom: 14px;font-size: 8.5pt;color: #444;line-height: 1.4;flex-shrink: 0;}

.section-title {font-size: 10pt;font-weight: 700;border-bottom: 1.5px solid #1A1A1A;padding-bottom: 4px;margin-bottom: 0;flex-shrink: 0;}
.section-title-cont {font-size: 10pt;font-weight: 700;border-bottom: 1.5px solid #1A1A1A;padding-bottom: 4px;margin-bottom: 0;margin-top: 6px;flex-shrink: 0;}

.tx-table {width: 100%;border-collapse: collapse;font-size: 8.5pt;margin-top: 0;flex: 0 1 auto;}
.tx-table thead tr {border-bottom: 1px solid #999;}
.tx-table th {padding: 5px 6px;text-align: left;font-weight: 700;font-size: 8.5pt;color: #333;border-bottom: 1px solid #999;}
.tx-table th:nth-child(3),.tx-table th:nth-child(4),.tx-table th:nth-child(5) {text-align: right;}
.tx-table td {padding: 3px 6px;vertical-align: top;border-bottom: 0.5px solid #E0E0E0;line-height: 1.3;}
.tx-table td:first-child {white-space: nowrap;width: 22mm;}
.tx-table td:nth-child(2) {width: 72mm;}
.tx-table td:nth-child(3),.tx-table td:nth-child(4),.tx-table td:nth-child(5) {text-align: right;white-space: nowrap;}
.tx-table td:nth-child(3) {width: 22mm;}
.tx-table td:nth-child(4) {width: 22mm;}
.tx-table td:nth-child(5) {width: 28mm;}
.tx-table tr.balance-row td {font-weight: 700;border-bottom: 1px solid #999;padding-top: 6px;padding-bottom: 6px;}
.tx-table tr {page-break-inside: avoid;break-inside: avoid;}

.balance-forward {text-align: center;font-weight: 700;font-size: 9pt;padding: 8px 0;border-top: 1px solid #999;flex-shrink: 0;}

.page-footer {margin-top: auto;display: flex;justify-content: space-between;align-items: flex-end;font-size: 7.5pt;color: #666;border-top: 0.5px solid #CCC;padding-top: 6px;flex-shrink: 0;}
.page-footer .suncorp-abn {font-size: 7pt;color: #888;max-width: 70%;}
.page-footer .page-num {font-size: 8pt;color: #555;}

.cont-note {font-size: 8pt;color: #666;text-align: center;margin-top: 8px;font-style: italic;flex-shrink: 0;}

.important-info {font-size: 8pt;line-height: 1.5;color: #444;margin-top: 14px;border-top: 1px solid #CCC;padding-top: 10px;flex-shrink: 0;}
.important-info strong {color: #1A1A1A;}

@media screen {
  body {background: #E8E8E8;padding: 20px;}
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
<div class="suncorp-header">
  <div class="suncorp-logo-area">
    <span class="suncorp-logo-text">SUNCORP</span>
    <span class="suncorp-logo-circle"></span>
  </div>
  <div class="suncorp-top-right">
    <span class="bsb">${bsbFormatted} ${acctNum}</span><br>
    <span class="suncorp-website">Suncorp.com.au</span>
  </div>
</div>

<div class="account-title">Everyday Basics Account</div>

<div class="account-info-section">
  <div class="holder-name">${holder.toUpperCase()}</div>
  <div>${employerAddr}</div>
  <div style="margin-top:6px;">
    <div class="account-info-row"><span class="account-info-label">BSB Number</span><span>${bsbFormatted}</span></div>
    <div class="account-info-row"><span class="account-info-label">Account Number</span><span>${acctNum}</span></div>
    <div class="account-info-row"><span class="account-info-label">Statement Period</span><span>${periodStart} - ${periodEnd}</span></div>
  </div>
</div>

<div class="summary-section">
  <div class="summary-grid">
    <div class="summary-item">
      <div class="summary-item-label">Opening Balance</div>
      <div class="summary-item-value">$${fmtAmount(statement.openingBalance)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Total Withdrawals</div>
      <div class="summary-item-value">$${fmtAmount(totalWithdrawals)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Total Deposits</div>
      <div class="summary-item-value">$${fmtAmount(totalDeposits)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Closing Balance</div>
      <div class="summary-item-value">$${fmtAmount(statement.closingBalance)}</div>
    </div>
  </div>
</div>

<div class="promo-box">
  Suncorp Visa Debit Card customers can now use Apple Pay. Simply add your Suncorp Visa Debit Card to your Apple Wallet to make fast, secure payments with your iPhone, Apple Watch, iPad or Mac.
</div>

<div class="section-title">Account Transactions</div>
<table class="tx-table">
<thead><tr><th>Date</th><th>Transaction Details</th><th>Withdrawal</th><th>Deposit</th><th>Balance</th></tr></thead>
<tbody>`;

  const firstPageRows = statement.pages[0] || [];
  firstPageRows.forEach(tx => { html += txRow(tx); });

  html += `</tbody></table>`;

  if (totalPages > 1) {
    html += `<div class="balance-forward">BALANCE CARRIED FORWARD</div>
<div class="cont-note">Details are continued on the back of this page</div>`;
  }

  html += `<div class="page-footer">
  <div class="suncorp-abn">Statement No. 1 &nbsp;&nbsp;&nbsp; Suncorp-Metway Ltd ABN 66 010 831 722 AFSL No 229882 GPO Box 1453 Brisbane Qld 4001.</div>
  <div class="page-num">Page 1 of ${totalPages}</div>
</div>
</div>
</div>`;

  for (let p = 1; p < totalPages; p++) {
    const pageTxs = statement.pages[p] || [];
    html += `<div class="page">
<div class="page-content">
<div class="suncorp-header">
  <div class="suncorp-logo-area">
    <span class="suncorp-logo-text">SUNCORP</span>
    <span class="suncorp-logo-circle"></span>
  </div>
  <div class="suncorp-top-right">
    <span class="bsb">${bsbFormatted} ${acctNum}</span><br>
    <span class="suncorp-website">Suncorp.com.au</span>
  </div>
</div>

<div class="account-title">Everyday Basics Account</div>

<div class="section-title-cont">Account Transactions Continued</div>
<table class="tx-table">
<thead><tr><th>Date</th><th>Transaction Details</th><th>Withdrawal</th><th>Deposit</th><th>Balance</th></tr></thead>
<tbody>`;

    pageTxs.forEach(tx => { html += txRow(tx); });

    html += `</tbody></table>`;

    if (p < totalPages - 1) {
      html += `<div class="balance-forward">BALANCE CARRIED FORWARD</div>
<div class="cont-note">Details are continued on the back of this page</div>`;
    } else {
      html += `<div class="balance-forward">BALANCE CARRIED FORWARD</div>`;
    }

    if (p === totalPages - 1) {
      html += `<div class="important-info">
<strong>Important Information:</strong><br>
If you notice any errors or unauthorised transactions on your statement, please contact Suncorp Bank immediately.<br>
Phone: 13 11 55 &nbsp;|&nbsp; Online: suncorp.com.au<br><br>
Suncorp-Metway Ltd ABN 66 010 831 722. Australian Financial Services Licence No 229882. Australian Credit Licence 229882.<br>
If you have a complaint, you can contact us at the details above or write to:<br>
Customer Relations, Suncorp, GPO Box 1453, Brisbane QLD 4001.<br><br>
You can also contact the Australian Financial Complaints Authority (AFCA).<br>
Write to: Australian Financial Complaints Authority, GPO Box 3, Melbourne VIC 3001<br>
Email: info@afca.org.au &nbsp;|&nbsp; Call: 1800 931 678
</div>`;
    }

    html += `<div class="page-footer">
  <div class="suncorp-abn">Statement No. 1 &nbsp;&nbsp;&nbsp; Suncorp-Metway Ltd ABN 66 010 831 722 AFSL No 229882 GPO Box 1453 Brisbane Qld 4001.</div>
  <div class="page-num">Page ${p + 1} of ${totalPages}</div>
</div>
</div>
</div>`;
  }

  html += `</body></html>`;
  return html;
}
