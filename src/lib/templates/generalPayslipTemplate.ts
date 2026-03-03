import type { Payslip } from '@/types/payroll';

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateGeneralPayslipHTML(payslip: Payslip, index: number): string {
  const salaryWagesRows = payslip.earnings.map(e => `
    <tr>
      <td>${e.description}</td>
      <td>${e.hours > 0 ? e.hours.toFixed(2) : ''}</td>
      <td class="right-align">${e.rate > 0 ? 'RATE ' + fmt(e.rate) : ''}</td>
      <td class="right-align">${fmt(e.amount)}</td>
      <td class="right-align">${fmt(e.ytd)}</td>
    </tr>`).join('');

  const taxRows = payslip.deductions
    .filter(d => d.type === 'tax')
    .map(d => `
    <tr>
      <td>${d.description}</td>
      <td colspan="2"></td>
      <td class="right-align">${fmt(d.amount)}</td>
      <td class="right-align">${fmt(d.ytd)}</td>
    </tr>`).join('');

  const otherDeductionRows = payslip.deductions
    .filter(d => d.type === 'other')
    .map(d => `
    <tr>
      <td>${d.description}</td>
      <td colspan="2"></td>
      <td class="right-align">${fmt(d.amount)}</td>
      <td class="right-align">${fmt(d.ytd)}</td>
    </tr>`).join('');

  const taxTotal = payslip.deductions.filter(d => d.type === 'tax').reduce((s, d) => s + d.amount, 0);
  const taxTotalYtd = payslip.deductions.filter(d => d.type === 'tax').reduce((s, d) => s + d.ytd, 0);

  const leaveRows = payslip.leave.map(l => `
    <tr>
      <td>${l.type}</td>
      <td class="right-align">${l.accruedThisPeriod.toFixed(2)}</td>
      <td class="right-align">${l.takenThisPeriod.toFixed(2)}</td>
      <td class="right-align">${l.balance.toFixed(2)}</td>
    </tr>`).join('');

  const employerLines = payslip.employer.address.split('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip - Period ${index + 1}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm 15mm 20mm 15mm;
        }
        html, body {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: Arial, sans-serif;
            padding: 20mm 15mm;
            line-height: 1.4;
            color: #000;
            font-size: 12px;
            box-sizing: border-box;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .company-info {
            text-align: center;
            font-size: 12px;
        }
        .employee-info {
            margin: 20px 0;
        }
        .pay-period {
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
        }
        .totals {
            text-align: right;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        .right-align {
            text-align: right;
        }
        .center-align {
            text-align: center;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
        }
        .section-label {
            font-weight: bold;
            background-color: #fafafa;
        }
        .total-row td {
            font-weight: bold;
            border-top: 2px solid #333;
        }
    </style>
</head>
<body>

    <div class="header">
        <div class="logo">${payslip.employer.name}</div>
        <div class="company-info">
            PAID BY<br>
            ${payslip.employer.name}<br>
            ${employerLines.join('<br>')}<br>
            ABN ${payslip.employer.abn}
        </div>
    </div>

    <div class="employee-info">
        ${payslip.employee.name}<br>
        ${payslip.employee.address.split('\n').join('<br>')}<br>
        Employee No: ${payslip.employee.id}<br>
        Department: ${payslip.employee.department} — ${payslip.employee.classification}
    </div>

    <div style="margin: 20px 0;">
        EMPLOYMENT DETAILS<br>
        Pay Frequency: ${payslip.period.endDate ? (Math.round((new Date(payslip.period.endDate).getTime() - new Date(payslip.period.startDate).getTime()) / 86400000) <= 7 ? 'Weekly' : Math.round((new Date(payslip.period.endDate).getTime() - new Date(payslip.period.startDate).getTime()) / 86400000) <= 14 ? 'Fortnightly' : 'Monthly') : 'Fortnightly'}<br>
        Annual Salary: ${fmt(payslip.annualRate)}
    </div>

    <div class="pay-period">
        <div>
            Pay Period: ${fmtDate(payslip.period.startDate)} - ${fmtDate(payslip.period.endDate)}<br>
            Payment Date: ${fmtDate(payslip.period.paymentDate)}
        </div>
        <div class="totals">
            Total Earnings: $${fmt(payslip.grossPay)}<br>
            Net Pay: $${fmt(payslip.netPay)}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th colspan="3"></th>
                <th class="center-align">THIS PAY</th>
                <th class="center-align">YTD</th>
            </tr>
        </thead>
        <tbody>
            <tr class="section-label">
                <td colspan="5">SALARY &amp; WAGES</td>
            </tr>
            ${salaryWagesRows}
            <tr class="total-row">
                <td colspan="3" class="right-align">TOTAL</td>
                <td class="right-align">${fmt(payslip.grossPay)}</td>
                <td class="right-align">${fmt(payslip.ytdGross)}</td>
            </tr>
            <tr class="section-label">
                <td colspan="5">TAX</td>
            </tr>
            ${taxRows}
            <tr class="total-row">
                <td colspan="3" class="right-align">TOTAL</td>
                <td class="right-align">${fmt(taxTotal)}</td>
                <td class="right-align">${fmt(taxTotalYtd)}</td>
            </tr>
            ${otherDeductionRows ? `
            <tr class="section-label">
                <td colspan="5">OTHER DEDUCTIONS</td>
            </tr>
            ${otherDeductionRows}
            ` : ''}
            <tr class="section-label">
                <td colspan="5">SUPERANNUATION</td>
            </tr>
            <tr>
                <td>Superannuation Guarantee (11.5%)</td>
                <td colspan="2"></td>
                <td class="right-align">${fmt(payslip.superAmount)}</td>
                <td class="right-align">${fmt(payslip.superYTD)}</td>
            </tr>
            <tr>
                <td colspan="3" style="font-size:10px;color:#666;">Fund: ${payslip.superConfig.fundName} | Member: ${payslip.superConfig.memberID}</td>
                <td></td>
                <td></td>
            </tr>
            <tr class="total-row">
                <td colspan="3" class="right-align">TOTAL</td>
                <td class="right-align">${fmt(payslip.superAmount)}</td>
                <td class="right-align">${fmt(payslip.superYTD)}</td>
            </tr>
        </tbody>
    </table>

    <table>
        <thead>
            <tr>
                <th>LEAVE</th>
                <th class="right-align">ACCRUED</th>
                <th class="right-align">USED</th>
                <th class="right-align">BALANCE</th>
            </tr>
        </thead>
        <tbody>
            ${leaveRows}
        </tbody>
    </table>

    <div style="margin-top: 20px;">
        PAYMENT DETAILS<br>
        ${payslip.bankAccount} ${payslip.employee.name.toLowerCase()}<br>
        REFERENCE ${payslip.paymentRef}<br>
        AMOUNT $${fmt(payslip.netPay)}
    </div>

    <div style="margin-top: 30px; font-size: 10px; color: #999; text-align: center;">
        This document is confidential and intended for the named recipient only.
    </div>

</body>
</html>`;
}
