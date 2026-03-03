import type { Payslip } from '@/types/payroll';

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateConstructionPayslipHTML(payslip: Payslip, index: number): string {
  const paymentItems = payslip.earnings.map(e => `
    <div class="payment-item">
        <span class="item-description">${e.description}${e.hours > 0 ? ` (${e.hours.toFixed(2)} hrs @ $${fmt(e.rate)})` : ''}</span>
        <span class="item-amount">$${fmt(e.amount)}</span>
    </div>`).join('');

  const deductionItems = payslip.deductions.map(d => `
    <div class="payment-item">
        <span class="item-description">${d.description}</span>
        <span class="item-amount">$${fmt(d.amount)}</span>
    </div>`).join('');

  const ytdBalances = [
    { key: 'Gross Earnings', value: `$${fmt(payslip.ytdGross)}` },
    { key: 'Tax Withheld', value: `$${fmt(payslip.ytdTax)}` },
    { key: 'Net Pay', value: `$${fmt(payslip.ytdNet)}` },
    { key: 'Superannuation', value: `$${fmt(payslip.superYTD)}` },
  ];

  const ytdRows = ytdBalances.map(b => `
        <tr>
            <td>${b.key}</td>
            <td style="text-align: right;">${b.value}</td>
        </tr>`).join('');

  const leaveRows = payslip.leave.map(l => {
    const days = (l.balance / 7.6).toFixed(2);
    return `
            <tr>
                <td>${l.type}</td>
                <td>${l.balance.toFixed(2)}</td>
                <td>${days}</td>
            </tr>`;
  }).join('');

  const employerLines = payslip.employer.address.split('\n');
  const employeeLines = payslip.employee.address.split('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip - Period ${index + 1}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            font-size: 12px;
            color: #000;
        }
        .header {
            text-align: left;
            margin-bottom: 20px;
        }
        .company-name {
            font-size: 14px;
            font-weight: bold;
        }
        .payslip-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
        }
        .employee-info {
            margin-bottom: 20px;
        }
        .pay-dates {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .payment-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .item-description {
            flex: 1;
            padding-right: 20px;
        }
        .item-amount {
            text-align: right;
            width: 100px;
        }
        .total-amount {
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 10px;
        }
        .balances-table {
            width: 100%;
            margin-top: 10px;
        }
        .balances-table td {
            padding: 5px 0;
        }
        .leave-table {
            width: 50%;
            margin-top: 10px;
        }
        .leave-table th, .leave-table td {
            text-align: left;
            padding: 5px;
        }
        .leave-table th {
            border-bottom: 1px solid #ccc;
        }
        .footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>

    <div class="header">
        ${payslip.employer.name}<br>
        ${employerLines.join('<br>')}<br>
        ABN ${payslip.employer.abn}
    </div>

    <div class="payslip-title">
        Payslip
    </div>

    <div class="company-name">
        ${payslip.employer.name}
    </div>

    <div class="employee-info">
        ${payslip.employee.name}<br>
        ${employeeLines[0] || ''}<br>
        ${employeeLines[1] || ''}<br>
        Australia
    </div>

    <div class="pay-dates">
        <div>
            Pay Day:<br>
            ${fmtDate(payslip.period.paymentDate)}
        </div>
        <div>
            Paid To:<br>
            ${fmtDate(payslip.period.endDate)}
        </div>
    </div>

    <div class="section-title">Payslip Details</div>

    <div class="section-title">Payments</div>
    <div class="payment-item">
        <span class="item-description"></span>
        <span class="item-amount">$${fmt(payslip.grossPay)}</span>
    </div>
    ${paymentItems}

    <div class="section-title">Deductions</div>
    ${deductionItems}

    <div class="payment-item total-amount">
        <span class="item-description">Take Home Pay</span>
        <span class="item-amount">$${fmt(payslip.netPay)}</span>
    </div>

    <div class="section-title">Other Benefits</div>
    <div class="payment-item">
        <span class="item-description">Superannuation Guarantee (12%)</span>
        <span class="item-amount">$${fmt(payslip.superAmount)}</span>
    </div>

    <div class="section-title">Year to Date Balances</div>
    <table class="balances-table">
        ${ytdRows}
    </table>

    <div class="section-title">Leave Balances</div>
    <table class="leave-table">
        <thead>
            <tr>
                <th></th>
                <th>In Hours</th>
                <th>In Days</th>
            </tr>
        </thead>
        <tbody>
            ${leaveRows}
        </tbody>
    </table>

    <div class="footer">
        <span>Page 1 of 1 | Period ${index + 1}</span>
        <span>Generated on ${new Date().toLocaleDateString('en-AU')}</span>
    </div>

</body>
</html>`;
}
