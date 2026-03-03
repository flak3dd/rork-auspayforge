import type { Payslip } from '@/types/payroll';

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateExecutiveMonthlyPayslipHTML(payslip: Payslip, index: number): string {
  const earningRows = payslip.earnings.map(e => `
    <tr>
      <td>${e.description}</td>
      <td class="r">${e.hours > 0 ? e.hours.toFixed(2) : '—'}</td>
      <td class="r">${e.rate > 0 ? '$' + fmt(e.rate) : '—'}</td>
      <td class="r">$${fmt(e.amount)}</td>
      <td class="r muted">$${fmt(e.ytd)}</td>
    </tr>`).join('');

  const taxDeductions = payslip.deductions.filter(d => d.type === 'tax');
  const otherDeductions = payslip.deductions.filter(d => d.type === 'other');

  const taxRows = taxDeductions.map(d => `
    <tr>
      <td>${d.description}</td>
      <td class="r">$${fmt(d.amount)}</td>
      <td class="r muted">$${fmt(d.ytd)}</td>
    </tr>`).join('');

  const otherRows = otherDeductions.map(d => `
    <tr>
      <td>${d.description}</td>
      <td class="r">$${fmt(d.amount)}</td>
      <td class="r muted">$${fmt(d.ytd)}</td>
    </tr>`).join('');

  const leaveRows = payslip.leave.map(l => `
    <tr>
      <td>${l.type}</td>
      <td class="r">${l.accruedThisPeriod.toFixed(2)}</td>
      <td class="r">${l.takenThisPeriod.toFixed(2)}</td>
      <td class="r">${l.balance.toFixed(2)}</td>
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
            font-family: 'Georgia', 'Times New Roman', serif;
            margin: 0;
            font-size: 11px;
            color: #2c2c2c;
            line-height: 1.6;
        }
        .masthead {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #fff;
            padding: 28px 36px 22px;
        }
        .masthead-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }
        .masthead h1 {
            font-size: 20px;
            font-weight: 400;
            letter-spacing: 3px;
            text-transform: uppercase;
        }
        .masthead .co-name {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 1px;
        }
        .masthead .co-detail {
            font-size: 10px;
            opacity: 0.7;
            margin-top: 2px;
        }
        .gold-bar {
            height: 3px;
            background: linear-gradient(90deg, #c9a84c, #f0d78c, #c9a84c);
        }
        .body-content {
            padding: 24px 36px;
        }
        .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 20px;
        }
        .field-label {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            color: #888;
            font-family: Arial, sans-serif;
            font-weight: 600;
            margin-bottom: 3px;
        }
        .field-value {
            font-size: 11px;
            color: #2c2c2c;
        }
        .field-value strong {
            font-size: 12px;
        }
        .sep {
            border: none;
            border-top: 1px solid #e8e0d0;
            margin: 18px 0;
        }
        .section-head {
            font-family: Arial, sans-serif;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #0f3460;
            margin: 18px 0 10px;
            padding-bottom: 4px;
            border-bottom: 1px solid #0f3460;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        th {
            font-family: Arial, sans-serif;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #777;
            padding: 6px 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            font-weight: 600;
        }
        td {
            padding: 6px 8px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 11px;
        }
        .r { text-align: right; }
        .muted { color: #999; }
        .total-row td {
            font-weight: 700;
            border-top: 2px solid #2c2c2c;
            border-bottom: none;
            padding-top: 8px;
        }
        .net-box {
            background: linear-gradient(135deg, #1a1a2e, #0f3460);
            color: #fff;
            border-radius: 10px;
            padding: 20px 24px;
            margin: 20px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .net-box .label {
            font-family: Arial, sans-serif;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            opacity: 0.7;
        }
        .net-box .amount {
            font-size: 28px;
            font-weight: 700;
            color: #f0d78c;
            letter-spacing: 1px;
        }
        .net-box .bank-detail {
            text-align: right;
            font-size: 10px;
            opacity: 0.7;
        }
        .ytd-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 24px;
        }
        .ytd-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dotted #e0e0e0;
            font-size: 11px;
        }
        .ytd-item .k { color: #666; }
        .ytd-item .v { font-weight: 700; }
        .footer-bar {
            margin-top: 28px;
            padding: 12px 0;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            font-family: Arial, sans-serif;
            font-size: 8px;
            color: #bbb;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>

    <div class="masthead">
        <div class="masthead-top">
            <div>
                <h1>Remuneration Statement</h1>
                <div class="co-detail">Monthly Pay Advice — Period ${index + 1}</div>
            </div>
            <div style="text-align: right;">
                <div class="co-name">${payslip.employer.name}</div>
                <div class="co-detail">${employerLines.join(' · ')}</div>
                <div class="co-detail">ABN ${payslip.employer.abn}</div>
            </div>
        </div>
    </div>
    <div class="gold-bar"></div>

    <div class="body-content">

        <div class="two-col">
            <div>
                <div class="field-label">Employee</div>
                <div class="field-value"><strong>${payslip.employee.name}</strong></div>
                <div class="field-value">${employeeLines.join('<br>')}</div>
                <div class="field-value" style="margin-top:4px;font-size:9px;color:#888;">ID: ${payslip.employee.id} | ${payslip.employee.department}</div>
            </div>
            <div>
                <div class="field-label">Pay Period</div>
                <div class="field-value">${fmtDate(payslip.period.startDate)} — ${fmtDate(payslip.period.endDate)}</div>
                <div class="field-label" style="margin-top: 8px;">Payment Date</div>
                <div class="field-value">${fmtDate(payslip.period.paymentDate)}</div>
            </div>
            <div>
                <div class="field-label">Position</div>
                <div class="field-value">${payslip.employee.classification}</div>
            </div>
            <div>
                <div class="field-label">Annual Remuneration</div>
                <div class="field-value">$${fmt(payslip.annualRate)}</div>
            </div>
        </div>

        <hr class="sep" />

        <div class="section-head">Earnings</div>
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="r">Hours</th>
                    <th class="r">Rate</th>
                    <th class="r">This Period</th>
                    <th class="r">YTD</th>
                </tr>
            </thead>
            <tbody>
                ${earningRows}
                <tr class="total-row">
                    <td colspan="3" class="r">Gross Earnings</td>
                    <td class="r">$${fmt(payslip.grossPay)}</td>
                    <td class="r muted">$${fmt(payslip.ytdGross)}</td>
                </tr>
            </tbody>
        </table>

        ${taxRows ? `
        <div class="section-head">Tax</div>
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="r">This Period</th>
                    <th class="r">YTD</th>
                </tr>
            </thead>
            <tbody>
                ${taxRows}
            </tbody>
        </table>
        ` : ''}

        ${otherRows ? `
        <div class="section-head">Other Deductions</div>
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="r">This Period</th>
                    <th class="r">YTD</th>
                </tr>
            </thead>
            <tbody>
                ${otherRows}
            </tbody>
        </table>
        ` : ''}

        <div class="section-head">Superannuation</div>
        <table>
            <tbody>
                <tr>
                    <td>Superannuation Guarantee (11.5%)<br><span style="font-size:8px;color:#999;">Fund: ${payslip.superConfig.fundName} | Member: ${payslip.superConfig.memberID}</span></td>
                    <td class="r">$${fmt(payslip.superAmount)}</td>
                    <td class="r muted">$${fmt(payslip.superYTD)}</td>
                </tr>
            </tbody>
        </table>

        <div class="net-box">
            <div>
                <div class="label">Net Pay</div>
                <div class="amount">$${fmt(payslip.netPay)}</div>
            </div>
            <div class="bank-detail">
                Deposited to ${payslip.bankAccount}<br>
                Reference: ${payslip.paymentRef}
            </div>
        </div>

        <div class="section-head">Leave Balances</div>
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th class="r">Accrued</th>
                    <th class="r">Taken</th>
                    <th class="r">Balance (hrs)</th>
                </tr>
            </thead>
            <tbody>
                ${leaveRows}
            </tbody>
        </table>

        <div class="section-head">Year to Date Summary</div>
        <div class="ytd-grid">
            <div class="ytd-item"><span class="k">Gross Earnings</span><span class="v">$${fmt(payslip.ytdGross)}</span></div>
            <div class="ytd-item"><span class="k">Tax Withheld</span><span class="v">$${fmt(payslip.ytdTax)}</span></div>
            <div class="ytd-item"><span class="k">Net Payments</span><span class="v">$${fmt(payslip.ytdNet)}</span></div>
            <div class="ytd-item"><span class="k">Superannuation</span><span class="v">$${fmt(payslip.superYTD)}</span></div>
        </div>

        <div class="footer-bar">
            <span>${payslip.employer.name} — Private & Confidential</span>
            <span>Page 1 of 1</span>
            <span>Private & Confidential</span>
        </div>

    </div>

</body>
</html>`;
}
