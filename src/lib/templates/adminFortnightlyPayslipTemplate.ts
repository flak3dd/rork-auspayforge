import type { Payslip } from '@/types/payroll';

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateAdminFortnightlyPayslipHTML(payslip: Payslip, index: number): string {
  const earningRows = payslip.earnings.map(e => `
    <tr>
      <td>${e.description}</td>
      <td class="right">${e.hours > 0 ? e.hours.toFixed(2) : ''}</td>
      <td class="right">${e.rate > 0 ? '$' + fmt(e.rate) : ''}</td>
      <td class="right">$${fmt(e.amount)}</td>
    </tr>`).join('');

  const deductionRows = payslip.deductions.map(d => `
    <tr>
      <td>${d.description}</td>
      <td class="right" colspan="2">${d.type === 'tax' ? 'Statutory' : 'Voluntary'}</td>
      <td class="right">$${fmt(d.amount)}</td>
    </tr>`).join('');

  const leaveRows = payslip.leave.map(l => `
    <tr>
      <td>${l.type}</td>
      <td class="right">${l.accruedThisPeriod.toFixed(2)} hrs</td>
      <td class="right">${l.takenThisPeriod.toFixed(2)} hrs</td>
      <td class="right">${l.balance.toFixed(2)} hrs</td>
    </tr>`).join('');

  const employerLines = payslip.employer.address.split('\n');
  const employeeLines = payslip.employee.address.split('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip - Period ${index + 1}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 30px;
            font-size: 11px;
            color: #1a1a1a;
            line-height: 1.5;
        }
        .header-bar {
            background: #0066cc;
            color: #fff;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: -30px -30px 20px -30px;
        }
        .header-bar h1 {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .header-bar .period-badge {
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-block label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #666;
            font-weight: 600;
        }
        .info-block p {
            font-size: 11px;
            margin-top: 2px;
            color: #1a1a1a;
        }
        .divider {
            border: none;
            border-top: 1px solid #e0e0e0;
            margin: 16px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        th {
            background: #f5f7fa;
            padding: 8px 10px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #555;
            border-bottom: 2px solid #ddd;
        }
        td {
            padding: 7px 10px;
            border-bottom: 1px solid #eee;
            font-size: 11px;
        }
        .right { text-align: right; }
        .section-title {
            font-size: 12px;
            font-weight: 700;
            color: #0066cc;
            margin: 16px 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-box {
            background: #f0f6ff;
            border: 1px solid #cce0ff;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .summary-box .net-label {
            font-size: 10px;
            text-transform: uppercase;
            color: #555;
            letter-spacing: 0.5px;
        }
        .summary-box .net-amount {
            font-size: 22px;
            font-weight: 800;
            color: #0066cc;
        }
        .summary-box .bank-info {
            text-align: right;
            font-size: 10px;
            color: #666;
        }
        .ytd-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 11px;
        }
        .ytd-row .label { color: #555; }
        .ytd-row .value { font-weight: 600; }
        .footer {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #999;
        }
    </style>
</head>
<body>

    <div class="header-bar">
        <h1>PAYSLIP</h1>
        <span class="period-badge">Period ${index + 1} — Fortnightly</span>
    </div>

    <div class="info-grid">
        <div class="info-block">
            <label>Employer</label>
            <p><strong>${payslip.employer.name}</strong></p>
            <p>${employerLines.join('<br>')}</p>
            <p>ABN ${payslip.employer.abn}</p>
        </div>
        <div class="info-block">
            <label>Employee</label>
            <p><strong>${payslip.employee.name}</strong></p>
            <p>${employeeLines.join('<br>')}</p>
            <p style="margin-top:2px;font-size:10px;color:#666;">ID: ${payslip.employee.id} | ${payslip.employee.department} — ${payslip.employee.classification}</p>
        </div>
        <div class="info-block">
            <label>Pay Period</label>
            <p>${fmtDate(payslip.period.startDate)} — ${fmtDate(payslip.period.endDate)}</p>
        </div>
        <div class="info-block">
            <label>Payment Date</label>
            <p>${fmtDate(payslip.period.paymentDate)}</p>
        </div>
    </div>

    <hr class="divider" />

    <div class="section-title">Earnings</div>
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th class="right">Hours</th>
                <th class="right">Rate</th>
                <th class="right">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${earningRows}
            <tr style="font-weight: 700; border-top: 2px solid #333;">
                <td colspan="3" class="right">Gross Pay</td>
                <td class="right">$${fmt(payslip.grossPay)}</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">Deductions</div>
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th class="right" colspan="2">Type</th>
                <th class="right">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${deductionRows}
            <tr style="font-weight: 700; border-top: 2px solid #333;">
                <td colspan="3" class="right">Total Deductions</td>
                <td class="right">$${fmt(payslip.totalDeductions)}</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">Superannuation</div>
    <table>
        <tbody>
            <tr>
                <td>Superannuation Guarantee (11.5%)<br><span style="font-size:9px;color:#888;">Fund: ${payslip.superConfig.fundName} | Member: ${payslip.superConfig.memberID}</span></td>
                <td class="right">$${fmt(payslip.superAmount)}</td>
            </tr>
        </tbody>
    </table>

    <div class="summary-box">
        <div>
            <div class="net-label">Net Pay</div>
            <div class="net-amount">$${fmt(payslip.netPay)}</div>
        </div>
        <div class="bank-info">
            Paid to: ${payslip.bankAccount}<br>
            Ref: ${payslip.paymentRef}
        </div>
    </div>

    <hr class="divider" />

    <div class="section-title">Leave Balances</div>
    <table>
        <thead>
            <tr>
                <th>Type</th>
                <th class="right">Accrued</th>
                <th class="right">Taken</th>
                <th class="right">Balance</th>
            </tr>
        </thead>
        <tbody>
            ${leaveRows}
        </tbody>
    </table>

    <div class="section-title">Year to Date</div>
    <div class="ytd-row"><span class="label">Gross Earnings</span><span class="value">$${fmt(payslip.ytdGross)}</span></div>
    <div class="ytd-row"><span class="label">Tax Withheld</span><span class="value">$${fmt(payslip.ytdTax)}</span></div>
    <div class="ytd-row"><span class="label">Net Payments</span><span class="value">$${fmt(payslip.ytdNet)}</span></div>
    <div class="ytd-row"><span class="label">Superannuation</span><span class="value">$${fmt(payslip.superYTD)}</span></div>

    <div class="footer">
        <span>${payslip.employer.name} — Confidential</span>
        <span>Page 1 of 1</span>
        <span>This document is confidential</span>
    </div>

</body>
</html>`;
}
