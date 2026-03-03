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

export function generateConstructionPayslipHTML(payslip: Payslip, periodIndex: number): string {
  const ordinaryEarnings = payslip.earnings.filter(e => e.type === 'ordinary');
  const overtimeEarnings = payslip.earnings.filter(e => e.type === 'overtime');
  const allowanceEarnings = payslip.earnings.filter(e => e.type === 'allowance');

  const makeEarningRows = (items: typeof payslip.earnings) => items.map(e => `
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

  const hasOvertime = overtimeEarnings.length > 0;
  const hasAllowances = allowanceEarnings.length > 0;

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
  color: #1c1c1c;
  background: #fff;
  font-size: 9pt;
  line-height: 1.4;
  -webkit-print-color-adjust: exact;
}
.page {
  width: 210mm;
  min-height: 297mm;
  padding: 16mm 18mm;
  position: relative;
}
.header-bar {
  background: #FF9500;
  border-radius: 5px;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
  color: #fff;
}
.header-bar h1 {
  font-size: 16pt;
  font-weight: 800;
  letter-spacing: -0.3px;
}
.header-bar .abn {
  font-size: 8pt;
  opacity: 0.85;
  margin-top: 2px;
}
.header-bar .addr {
  font-size: 8pt;
  opacity: 0.75;
  margin-top: 1px;
  white-space: pre-line;
}
.header-right {
  text-align: right;
}
.header-right .slip-label {
  font-size: 10pt;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 3px;
}
.header-right .period-num {
  display: inline-block;
  background: rgba(255,255,255,0.25);
  font-size: 8pt;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 3px;
  margin-top: 4px;
}
.warning-strip {
  background: #FFF3E0;
  border-left: 4px solid #FF9500;
  padding: 6px 12px;
  font-size: 7.5pt;
  color: #8B5E00;
  margin-bottom: 14px;
  border-radius: 0 3px 3px 0;
}
.info-row {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}
.info-card {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 9px 12px;
}
.info-card .lbl {
  font-size: 7pt;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #999;
  font-weight: 600;
  margin-bottom: 2px;
}
.info-card .val {
  font-size: 10pt;
  font-weight: 600;
  color: #1c1c1c;
}
.info-card .sub {
  font-size: 8pt;
  color: #777;
  margin-top: 1px;
}
.section-head {
  font-size: 7.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #FF9500;
  border-bottom: 2px solid #FF9500;
  padding-bottom: 3px;
  margin-bottom: 6px;
  margin-top: 14px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
}
table th {
  text-align: left;
  font-size: 7pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #999;
  font-weight: 600;
  padding: 4px 5px;
  border-bottom: 1px solid #ddd;
}
table th.num, table td.num {
  text-align: right;
}
table td {
  padding: 4px 5px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}
.sub-section {
  font-size: 7.5pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #666;
  padding: 6px 5px 3px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}
.total-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 5px;
  border-top: 2px solid #1c1c1c;
  margin-top: 4px;
}
.total-line .lbl { font-weight: 700; font-size: 9.5pt; }
.total-line .amt { font-weight: 700; font-size: 10.5pt; }
.total-line .amt.pos { color: #1a8c3f; }
.total-line .amt.neg { color: #cc2233; }
.net-box {
  background: linear-gradient(135deg, #FF9500, #E68600);
  color: #fff;
  border-radius: 5px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
}
.net-box .lbl {
  font-size: 10pt;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.net-box .amt {
  font-size: 17pt;
  font-weight: 800;
}
.super-line {
  display: flex;
  justify-content: space-between;
  padding: 3px 5px;
  font-size: 8.5pt;
}
.super-line .lbl { color: #666; }
.super-line .val { font-weight: 600; }
.pay-details {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 9px 12px;
  margin-top: 14px;
}
.pay-details-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 8.5pt;
}
.pay-details-row .lbl { color: #777; }
.pay-details-row .val { font-weight: 600; }
.ytd-row {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
.ytd-box {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 7px 10px;
  text-align: center;
}
.ytd-box .lbl {
  font-size: 7pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #999;
  margin-bottom: 2px;
}
.ytd-box .val {
  font-size: 9.5pt;
  font-weight: 700;
  color: #1c1c1c;
}
.footer-note {
  position: absolute;
  bottom: 16mm;
  left: 18mm;
  right: 18mm;
  text-align: center;
  font-size: 7pt;
  color: #bbb;
  border-top: 1px solid #eee;
  padding-top: 6px;
}
</style>
</head>
<body>
<div class="page">
  <div class="header-bar">
    <div>
      <h1>${payslip.employer.name}</h1>
      <div class="abn">ABN ${payslip.employer.abn}</div>
      <div class="addr">${payslip.employer.address.replace(/\n/g, '<br>')}</div>
    </div>
    <div class="header-right">
      <div class="slip-label">Pay Slip</div>
      <div class="period-num">Period ${periodIndex + 1}</div>
    </div>
  </div>

  <div class="warning-strip">
    Construction Industry Award — All rates inclusive of applicable loadings per Fair Work Australia
  </div>

  <div class="info-row">
    <div class="info-card">
      <div class="lbl">Employee</div>
      <div class="val">${payslip.employee.name}</div>
      <div class="sub">ID: ${payslip.employee.id} &bull; ${payslip.employee.department}</div>
    </div>
    <div class="info-card">
      <div class="lbl">Pay Period</div>
      <div class="val">${fmtDate(payslip.period.startDate)} – ${fmtDate(payslip.period.endDate)}</div>
      <div class="sub">Payment: ${fmtDate(payslip.period.paymentDate)}</div>
    </div>
    <div class="info-card">
      <div class="lbl">Annual Rate</div>
      <div class="val">$${fmt(payslip.annualRate)}</div>
    </div>
  </div>

  <div class="section-head">Earnings</div>
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
    <tbody>
      <tr class="sub-section"><td colspan="5">Ordinary Time</td></tr>
      ${makeEarningRows(ordinaryEarnings)}
      ${hasOvertime ? `<tr class="sub-section"><td colspan="5">Overtime</td></tr>${makeEarningRows(overtimeEarnings)}` : ''}
      ${hasAllowances ? `<tr class="sub-section"><td colspan="5">Allowances</td></tr>${makeEarningRows(allowanceEarnings)}` : ''}
    </tbody>
  </table>
  <div class="total-line">
    <span class="lbl">Gross Pay</span>
    <span class="amt pos">$${fmt(payslip.grossPay)}</span>
  </div>

  <div class="section-head">Deductions</div>
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
  <div class="total-line">
    <span class="lbl">Total Deductions</span>
    <span class="amt neg">–$${fmt(payslip.totalDeductions)}</span>
  </div>

  <div class="net-box">
    <span class="lbl">Net Pay</span>
    <span class="amt">$${fmt(payslip.netPay)}</span>
  </div>

  <div class="section-head">Superannuation</div>
  <div class="super-line"><span class="lbl">SG Contribution (12%)</span><span class="val">$${fmt(payslip.superAmount)}</span></div>
  <div class="super-line"><span class="lbl">YTD Super</span><span class="val">$${fmt(payslip.superYTD)}</span></div>
  <div class="super-line"><span class="lbl">OTE Base</span><span class="val">$${fmt(payslip.ote)}</span></div>

  <div class="section-head">Leave Balances</div>
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

  <div class="pay-details">
    <div class="pay-details-row"><span class="lbl">Account</span><span class="val">${payslip.bankAccount}</span></div>
    <div class="pay-details-row"><span class="lbl">Reference</span><span class="val">${payslip.paymentRef}</span></div>
  </div>

  <div class="section-head">Year to Date</div>
  <div class="ytd-row">
    <div class="ytd-box"><div class="lbl">Gross</div><div class="val">$${fmt(payslip.ytdGross)}</div></div>
    <div class="ytd-box"><div class="lbl">Tax</div><div class="val">$${fmt(payslip.ytdTax)}</div></div>
    <div class="ytd-box"><div class="lbl">Net</div><div class="val">$${fmt(payslip.ytdNet)}</div></div>
  </div>

  <div class="footer-note">
    Simulation — Generated ${new Date().toLocaleDateString('en-AU')} — No Signature Required
  </div>
</div>
</body>
</html>`;
}

export function generateAllConstructionPayslipsHTML(payslips: Payslip[]): string {
  return payslips.map((ps, i) => {
    const singleHTML = generateConstructionPayslipHTML(ps, i);
    const bodyContent = singleHTML.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? '';
    return bodyContent;
  }).join('\n<div style="page-break-before:always"></div>\n');
}
