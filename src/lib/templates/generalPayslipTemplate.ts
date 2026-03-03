import { Payslip } from '@/types/payroll';

function fmt(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtDate(d: Date): string {
  const date = new Date(d);
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function generateGeneralPayslipHTML(payslip: Payslip, periodIndex: number): string {
  const earningsRows = payslip.earnings.map(e => `
    <tr>
      <td>${e.description}</td>
      <td class="num">${e.hours > 0 ? e.hours.toFixed(1) : '-'}</td>
      <td class="num">${e.rate > 0 ? fmt(e.rate) : '-'}</td>
      <td class="num">${fmt(e.amount)}</td>
      <td class="num">${fmt(e.ytd)}</td>
    </tr>`).join('');

  const deductionRows = payslip.deductions.map(d => `
    <tr>
      <td>${d.description}</td>
      <td class="num">${fmt(d.amount)}</td>
      <td class="num">${fmt(d.ytd)}</td>
    </tr>`).join('');

  const leaveRows = payslip.leave.map(l => `
    <tr>
      <td>${l.type}</td>
      <td class="num">${l.accruedThisPeriod.toFixed(2)}</td>
      <td class="num">${l.takenThisPeriod.toFixed(2)}</td>
      <td class="num">${l.balance.toFixed(2)}</td>
      <td class="num">${l.ytdAccrued.toFixed(2)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Payslip - ${payslip.employer.name}</title>
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #1a1a2e;
  background: #fff;
  font-size: 9pt;
  line-height: 1.4;
  -webkit-print-color-adjust: exact;
}
.page {
  width: 210mm;
  min-height: 297mm;
  padding: 18mm 20mm;
  position: relative;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 14px;
  border-bottom: 2.5px solid #1a1a2e;
  margin-bottom: 16px;
}
.company-block h1 {
  font-size: 18pt;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin-bottom: 3px;
}
.company-block .abn {
  font-size: 8.5pt;
  color: #555;
}
.company-block .addr {
  font-size: 8.5pt;
  color: #666;
  margin-top: 2px;
  white-space: pre-line;
}
.payslip-label {
  text-align: right;
}
.payslip-label h2 {
  font-size: 14pt;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #1a1a2e;
}
.payslip-label .period-badge {
  display: inline-block;
  background: #1a1a2e;
  color: #fff;
  font-size: 8pt;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 3px;
  margin-top: 6px;
  letter-spacing: 0.5px;
}
.info-grid {
  display: flex;
  gap: 20px;
  margin-bottom: 18px;
}
.info-box {
  flex: 1;
  background: #f7f7fa;
  border: 1px solid #e4e4ea;
  border-radius: 4px;
  padding: 10px 12px;
}
.info-box .label {
  font-size: 7.5pt;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #888;
  margin-bottom: 3px;
  font-weight: 600;
}
.info-box .value {
  font-size: 10pt;
  font-weight: 600;
  color: #1a1a2e;
}
.info-box .sub {
  font-size: 8.5pt;
  color: #666;
  margin-top: 1px;
}
.section-title {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #1a1a2e;
  border-bottom: 1.5px solid #1a1a2e;
  padding-bottom: 4px;
  margin-bottom: 6px;
  margin-top: 16px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
}
table th {
  text-align: left;
  font-size: 7.5pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  font-weight: 600;
  padding: 4px 6px;
  border-bottom: 1px solid #ddd;
}
table th.num, table td.num {
  text-align: right;
}
table td {
  padding: 5px 6px;
  border-bottom: 1px solid #eee;
  color: #333;
}
.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 6px;
  border-top: 1.5px solid #1a1a2e;
  margin-top: 4px;
}
.total-row .label { font-weight: 700; font-size: 10pt; }
.total-row .amount { font-weight: 700; font-size: 11pt; }
.total-row .amount.green { color: #1a8c3f; }
.total-row .amount.red { color: #cc2233; }
.net-pay-box {
  background: #1a1a2e;
  color: #fff;
  border-radius: 5px;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 18px 0;
}
.net-pay-box .label {
  font-size: 11pt;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.net-pay-box .amount {
  font-size: 18pt;
  font-weight: 700;
}
.super-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 6px;
  font-size: 9pt;
}
.super-row .label { color: #555; }
.super-row .value { font-weight: 600; }
.leave-table th, .leave-table td {
  font-size: 8.5pt;
}
.payment-section {
  background: #f7f7fa;
  border: 1px solid #e4e4ea;
  border-radius: 4px;
  padding: 10px 14px;
  margin-top: 16px;
}
.payment-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 9pt;
}
.payment-row .label { color: #666; }
.payment-row .value { font-weight: 600; }
.ytd-grid {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.ytd-item {
  flex: 1;
  background: #f7f7fa;
  border: 1px solid #e4e4ea;
  border-radius: 4px;
  padding: 8px 12px;
  text-align: center;
}
.ytd-item .label {
  font-size: 7.5pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  margin-bottom: 2px;
}
.ytd-item .value {
  font-size: 10pt;
  font-weight: 700;
  color: #1a1a2e;
}
.footer {
  position: absolute;
  bottom: 18mm;
  left: 20mm;
  right: 20mm;
  text-align: center;
  font-size: 7.5pt;
  color: #aaa;
  border-top: 1px solid #eee;
  padding-top: 8px;
}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="company-block">
      <h1>${payslip.employer.name}</h1>
      <div class="abn">ABN ${payslip.employer.abn}</div>
      <div class="addr">${payslip.employer.address.replace(/\n/g, '<br>')}</div>
    </div>
    <div class="payslip-label">
      <h2>Pay Slip</h2>
      <div class="period-badge">Period ${periodIndex + 1}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">Employee</div>
      <div class="value">${payslip.employee.name}</div>
      <div class="sub">ID: ${payslip.employee.id} &bull; ${payslip.employee.classification}</div>
    </div>
    <div class="info-box">
      <div class="label">Pay Period</div>
      <div class="value">${fmtDate(payslip.period.startDate)} – ${fmtDate(payslip.period.endDate)}</div>
      <div class="sub">Payment: ${fmtDate(payslip.period.paymentDate)}</div>
    </div>
    <div class="info-box">
      <div class="label">Annual Rate</div>
      <div class="value">$${fmt(payslip.annualRate)}</div>
    </div>
  </div>

  <div class="section-title">Earnings</div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Hours</th>
        <th class="num">Rate</th>
        <th class="num">Amount</th>
        <th class="num">YTD</th>
      </tr>
    </thead>
    <tbody>${earningsRows}</tbody>
  </table>
  <div class="total-row">
    <span class="label">Gross Pay</span>
    <span class="amount green">$${fmt(payslip.grossPay)}</span>
  </div>

  <div class="section-title">Deductions</div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Amount</th>
        <th class="num">YTD</th>
      </tr>
    </thead>
    <tbody>${deductionRows}</tbody>
  </table>
  <div class="total-row">
    <span class="label">Total Deductions</span>
    <span class="amount red">–$${fmt(payslip.totalDeductions)}</span>
  </div>

  <div class="net-pay-box">
    <span class="label">Net Pay</span>
    <span class="amount">$${fmt(payslip.netPay)}</span>
  </div>

  <div class="section-title">Superannuation</div>
  <div class="super-row"><span class="label">SG Contribution (12%)</span><span class="value">$${fmt(payslip.superAmount)}</span></div>
  <div class="super-row"><span class="label">YTD Super</span><span class="value">$${fmt(payslip.superYTD)}</span></div>
  <div class="super-row"><span class="label">OTE Base</span><span class="value">$${fmt(payslip.ote)}</span></div>

  <div class="section-title">Leave Balances</div>
  <table class="leave-table">
    <thead>
      <tr>
        <th>Type</th>
        <th class="num">Accrued (hrs)</th>
        <th class="num">Taken (hrs)</th>
        <th class="num">Balance (hrs)</th>
        <th class="num">YTD Accrued</th>
      </tr>
    </thead>
    <tbody>${leaveRows}</tbody>
  </table>

  <div class="payment-section">
    <div class="payment-row"><span class="label">Account</span><span class="value">${payslip.bankAccount}</span></div>
    <div class="payment-row"><span class="label">Reference</span><span class="value">${payslip.paymentRef}</span></div>
  </div>

  <div class="section-title">Year to Date</div>
  <div class="ytd-grid">
    <div class="ytd-item"><div class="label">Gross</div><div class="value">$${fmt(payslip.ytdGross)}</div></div>
    <div class="ytd-item"><div class="label">Tax</div><div class="value">$${fmt(payslip.ytdTax)}</div></div>
    <div class="ytd-item"><div class="label">Net</div><div class="value">$${fmt(payslip.ytdNet)}</div></div>
  </div>

  <div class="footer">
    Simulation — Generated ${new Date().toLocaleDateString('en-AU')} — No Signature Required
  </div>
</div>
</body>
</html>`;
}

export function generateAllGeneralPayslipsHTML(payslips: Payslip[]): string {
  return payslips.map((ps, i) => {
    const singleHTML = generateGeneralPayslipHTML(ps, i);
    const bodyContent = singleHTML.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? '';
    return bodyContent;
  }).join('\n<div style="page-break-before:always"></div>\n');
}
