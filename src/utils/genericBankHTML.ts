import type { BankStatement, BankTransaction, AppConfig } from '@/types/payroll';
import type { StatementAssets } from '@/utils/statementHTML';

interface BankBranding {
  primaryColor: string;
  secondaryColor: string;
  bankName: string;
  bankFullName: string;
  abn: string;
  afsl: string;
  accountType: string;
  promoText: string;
  contactPhone: string;
  contactAddress: string;
}

const BANK_BRANDS: Record<string, BankBranding> = {
  nab: {
    primaryColor: '#C8102E',
    secondaryColor: '#1A1A1A',
    bankName: 'NAB',
    bankFullName: 'National Australia Bank Limited',
    abn: 'ABN 12 004 044 937',
    afsl: 'AFSL and Australian Credit Licence 230686',
    accountType: 'NAB Classic Banking',
    promoText: 'NAB customers can now use Google Pay and Apple Pay for fast, secure contactless payments.',
    contactPhone: '13 22 65',
    contactAddress: 'NAB Customer Resolution, Reply Paid 2870, Melbourne VIC 3001',
  },
  anz: {
    primaryColor: '#003366',
    secondaryColor: '#007DBA',
    bankName: 'ANZ',
    bankFullName: 'Australia and New Zealand Banking Group Limited',
    abn: 'ABN 11 005 357 522',
    afsl: 'AFSL No. 234527',
    accountType: 'ANZ Access Advantage',
    promoText: 'ANZ customers enjoy fee-free transactions when you deposit $2,000 or more each month.',
    contactPhone: '13 13 14',
    contactAddress: 'ANZ Customer Resolution Centre, GPO Box 1874, Melbourne VIC 3001',
  },
  westpac: {
    primaryColor: '#D5002B',
    secondaryColor: '#1F1F1F',
    bankName: 'Westpac',
    bankFullName: 'Westpac Banking Corporation',
    abn: 'ABN 33 007 457 141',
    afsl: 'AFSL and Australian Credit Licence 233714',
    accountType: 'Westpac Choice',
    promoText: 'Westpac Choice customers can have their monthly plan fee waived when you deposit $2,000 or more each month.',
    contactPhone: '13 20 32',
    contactAddress: 'Westpac Customer Solutions, Reply Paid 5265, Sydney NSW 2001',
  },
};

function fmtAmount(n: number): string {
  return Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date | string): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[date.getMonth()]}`;
}

function balanceStr(bal: number): string {
  if (bal < 0) return `$${fmtAmount(bal)} DR`;
  return `$${fmtAmount(bal)} CR`;
}

function txRow(tx: BankTransaction): string {
  const desc = tx.description.replace(/\n/g, '<br>');
  const isBalRow = desc === 'OPENING BALANCE' || desc === 'CLOSING BALANCE';
  if (isBalRow) {
    return `<tr class="bal-row"><td>${fmtDate(tx.date)}</td><td>${desc}</td><td></td><td></td><td>${balanceStr(tx.balance)}</td></tr>`;
  }
  const debit = tx.debit > 0 ? fmtAmount(tx.debit) : '';
  const credit = tx.credit > 0 ? fmtAmount(tx.credit) : '';
  return `<tr><td>${fmtDate(tx.date)}</td><td style="line-height:1.3">${desc}</td><td>${debit}</td><td>${credit}</td><td>${balanceStr(tx.balance)}</td></tr>`;
}

export const GENERIC_FIRST_PAGE_TX = 12;
export const GENERIC_CONTINUATION_PAGE_TX = 22;

export function generateGenericStatementHTML(statement: BankStatement, config: AppConfig, bankKey: string, _assets?: StatementAssets): string {
  const brand = BANK_BRANDS[bankKey] || BANK_BRANDS.nab;
  const totalPages = statement.pages.length;
  const holder = statement.accountHolder;
  const employerAddr = config.employer.address.replace(/\n/g, '<br>');
  const bsbAcct = `${statement.bsb} ${statement.accountNumber}`;

  const totalWithdrawals = statement.transactions.reduce((s, t) => s + t.debit, 0);
  const totalDeposits = statement.transactions.reduce((s, t) => s + t.credit, 0);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${brand.bankName} Statement</title>
<style>
@page {size: A4;margin: 0;}
* {box-sizing: border-box;}
body {margin: 0;padding: 0;font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;color: #1A1A1A;-webkit-print-color-adjust: exact;font-weight: 400;font-size: 9pt;}
.page {width: 210mm;height: 297mm;padding: 14mm 18mm 20mm;box-sizing: border-box;position: relative;background: #fff;page-break-after: always;overflow: hidden;}
.page:last-child {page-break-after: avoid;}
.page-content {height: 100%;display: flex;flex-direction: column;overflow: hidden;}
.header {display: flex;justify-content: space-between;align-items: flex-start;margin-bottom: 8px;padding-bottom: 8px;border-bottom: 3px solid ${brand.primaryColor};flex-shrink: 0;}
.logo-text {font-size: 22pt;font-weight: 700;color: ${brand.primaryColor};letter-spacing: 0.5pt;}
.top-right {text-align: right;font-size: 9pt;line-height: 1.4;}
.top-right .bsb {font-weight: 600;}
.acct-title {font-size: 13pt;font-weight: 600;margin: 10px 0 12px;color: ${brand.primaryColor};flex-shrink: 0;}
.info-section {margin-bottom: 10px;font-size: 9pt;line-height: 1.5;flex-shrink: 0;}
.info-section .name {font-weight: 700;font-size: 10pt;}
.info-row {display: flex;justify-content: space-between;margin-top: 2px;}
.info-label {font-weight: 600;color: #333;}
.summary {border-top: 2px solid ${brand.primaryColor};border-bottom: 2px solid ${brand.primaryColor};padding: 8px 0;margin-bottom: 12px;flex-shrink: 0;}
.summary-grid {display: flex;justify-content: space-between;font-size: 9pt;}
.summary-item {text-align: center;flex: 1;}
.summary-item-label {font-weight: 600;color: #555;font-size: 8pt;text-transform: uppercase;letter-spacing: 0.3pt;margin-bottom: 3px;}
.summary-item-value {font-weight: 700;font-size: 10pt;}
.promo {background: #F5F5F5;border-left: 3px solid ${brand.primaryColor};padding: 8px 12px;margin-bottom: 12px;font-size: 8.5pt;color: #444;line-height: 1.4;flex-shrink: 0;}
.section-title {font-size: 10pt;font-weight: 700;color: ${brand.primaryColor};border-bottom: 1.5px solid #1A1A1A;padding-bottom: 4px;margin-bottom: 0;flex-shrink: 0;}
.tx-table {width: 100%;border-collapse: collapse;font-size: 8.5pt;margin-top: 0;flex: 0 1 auto;}
.tx-table thead tr {border-bottom: 1px solid #999;}
.tx-table th {padding: 5px 6px;text-align: left;font-weight: 700;font-size: 8.5pt;color: #333;border-bottom: 1px solid #999;}
.tx-table th:nth-child(3),.tx-table th:nth-child(4),.tx-table th:nth-child(5) {text-align: right;}
.tx-table td {padding: 3px 6px;vertical-align: top;border-bottom: 0.5px solid #E0E0E0;line-height: 1.3;}
.tx-table td:first-child {white-space: nowrap;width: 18mm;}
.tx-table td:nth-child(2) {width: 72mm;}
.tx-table td:nth-child(3),.tx-table td:nth-child(4),.tx-table td:nth-child(5) {text-align: right;white-space: nowrap;}
.tx-table tr.bal-row td {font-weight: 700;border-bottom: 1px solid #999;padding-top: 6px;padding-bottom: 6px;}
.tx-table tr {page-break-inside: avoid;break-inside: avoid;}
.page-footer {margin-top: auto;display: flex;justify-content: space-between;font-size: 7.5pt;color: #666;border-top: 1px solid ${brand.primaryColor};padding-top: 6px;flex-shrink: 0;}
.footer-abn {font-size: 7pt;color: #888;max-width: 70%;}
.footer-page {font-size: 8pt;color: #555;}
.important {font-size: 8pt;line-height: 1.5;color: #444;margin-top: 14px;border-top: 1px solid #CCC;padding-top: 10px;flex-shrink: 0;}
.important strong {color: #1A1A1A;}
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
<div class="header">
  <span class="logo-text">${brand.bankName}</span>
  <div class="top-right">
    <span class="bsb">${bsbAcct}</span><br>
    <span style="color:${brand.primaryColor};font-size:8.5pt;">${brand.bankFullName.split(' ').slice(0, 2).join(' ')}</span>
  </div>
</div>
<div class="acct-title">${brand.accountType}</div>
<div class="info-section">
  <div class="name">${holder}</div>
  <div>${employerAddr}</div>
  <div style="margin-top:6px;">
    <div class="info-row"><span class="info-label">BSB Number</span><span>${statement.bsb}</span></div>
    <div class="info-row"><span class="info-label">Account Number</span><span>${statement.accountNumber}</span></div>
    <div class="info-row"><span class="info-label">Statement Period</span><span>${statement.statementPeriod}</span></div>
  </div>
</div>
<div class="summary">
  <div class="summary-grid">
    <div class="summary-item"><div class="summary-item-label">Opening Balance</div><div class="summary-item-value">$${fmtAmount(statement.openingBalance)}</div></div>
    <div class="summary-item"><div class="summary-item-label">Total Withdrawals</div><div class="summary-item-value">$${fmtAmount(totalWithdrawals)}</div></div>
    <div class="summary-item"><div class="summary-item-label">Total Deposits</div><div class="summary-item-value">$${fmtAmount(totalDeposits)}</div></div>
    <div class="summary-item"><div class="summary-item-label">Closing Balance</div><div class="summary-item-value">$${fmtAmount(statement.closingBalance)}</div></div>
  </div>
</div>
<div class="promo">${brand.promoText}</div>
<div class="section-title">Account Transactions</div>
<table class="tx-table">
<thead><tr><th>Date</th><th>Transaction Details</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
<tbody>`;

  (statement.pages[0] || []).forEach(tx => { html += txRow(tx); });

  html += `</tbody></table>
<div class="page-footer">
  <div class="footer-abn">${brand.bankFullName} ${brand.abn} ${brand.afsl}</div>
  <div class="footer-page">Page 1 of ${totalPages}</div>
</div>
</div>
</div>`;

  for (let p = 1; p < totalPages; p++) {
    html += `<div class="page">
<div class="page-content">
<div class="header">
  <span class="logo-text">${brand.bankName}</span>
  <div class="top-right">
    <span class="bsb">${bsbAcct}</span>
  </div>
</div>
<div class="section-title" style="margin-top:4px;">Account Transactions Continued</div>
<table class="tx-table">
<thead><tr><th>Date</th><th>Transaction Details</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
<tbody>`;

    (statement.pages[p] || []).forEach(tx => { html += txRow(tx); });
    html += `</tbody></table>`;

    if (p === totalPages - 1) {
      html += `<div class="important">
<strong>Important Information:</strong><br>
Please check your statement carefully. If you notice any errors or unauthorised transactions, contact ${brand.bankName} immediately.<br>
Phone: ${brand.contactPhone}<br>
Write to: ${brand.contactAddress}<br><br>
${brand.bankFullName} ${brand.abn}. ${brand.afsl}.<br>
You can also contact the Australian Financial Complaints Authority (AFCA).<br>
Write to: AFCA, GPO Box 3, Melbourne VIC 3001 | Call: 1800 931 678
</div>`;
    }

    html += `<div class="page-footer">
  <div class="footer-abn">${brand.bankFullName} ${brand.abn} ${brand.afsl}</div>
  <div class="footer-page">Page ${p + 1} of ${totalPages}</div>
</div>
</div>
</div>`;
  }

  html += `</body></html>`;
  return html;
}
