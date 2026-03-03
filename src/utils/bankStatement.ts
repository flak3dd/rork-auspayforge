import { AppConfig, BankStatement, BankTransaction, Payslip } from '@/types/payroll';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const SENDERS = [
  'MR MICHAEL LENARD BYR', 'REBEKAH PRIOLO', 'SUSAN CROSS', 'ALEXA BAKHASH', 'ROPATI LOTOMAU',
  'KIONA BULLINGHAM', 'MR JASON MICHAEL GUY', 'CORY TALBOT', 'LISA FLIEDNER', 'DANIEL BULLINGHAM',
  'NAOMI ANNE HARPER', 'STACEY MAREE BLAIR', 'JIMMY COOK', 'KYLIE G DEGIOR', 'ASHEIGH BRADLEY',
  'BRENNAN RAMONA LEIGH', 'JADE PASSMORE', 'MULUFUAINA IESE', 'MR JAMES ANTHONY PRES', 'AO LIU',
  'CHELSEA BUTTERWORTH', 'BEAUDINE JOHNSON', 'PETA-JANE GODFREY', 'Stacey Decee Blair', 'LUSEANE SIALE',
  'MR NICKOLAS ADAM HAEV', 'CINDY L DICK', 'Kylie G Degiorgio', 'JULIE MCNAUGHTON', 'Kylie Jayne Newton',
  'MRS IRENE CYRIL SUERT', 'TIMOTHY ROSENBERG',
];

const RECIPIENTS = ['R MILLER', 'TIMOTHY ROSENBERG', 'KYLIE TIBBS'];

const INCOMING_MEMOS = [
  'CREDIT TO ACCOUNT', 'Crabs', 'fish', 'coins', 'ebay', 'shopping', 'i love you', 'cheers', 'away!',
  'coin', 'the trip', 'TRIP', 'PAYMENT', 'dan', 'ta', 'Happy Birthday', 'Y', '0', 'Dad', 'chinese',
  'superhero', 'Beaudine', 'Tnx', 'coin sets',
];

const MERCHANT_TEMPLATES: Record<string, string[]> = {
  groceries: ['COLES EXPRESS', 'WOOLWORTHS', 'ALDI STORES', 'IGA MARKET', 'SPAR {sub1} ROAD {sub2} AU AUS', 'SPAR {sub1}'],
  fuel: ['METRO PETROLEUM {sub0}', 'SHELL SERVICE', 'BP FUEL STOP', 'CALTEX', 'METRO PETROLEUM {sub0} {sub1} SOAU', 'AMPOL {sub2} 11620F {sub1} AU'],
  fast_food: ['MCDONALDS {sub0}', 'KFC DRIVE-THRU', 'SUBWAY EAT FRESH', 'DOMINOS PIZZA', 'Hungry Jacks {sub1} AU', 'KFC {sub2} AU', 'MCDONALDS {sub1} {sub1} VICAU'],
  liquor: ['BWS', 'LIQUORLAND', 'DAN MURPHYS', 'BWS 2432 {sub2} QL AUS', '{sub1} Cellars {sub2} SoAU', 'Celebrations {sub1} AU'],
  convenience: ['7-ELEVEN', 'SPAR {sub1}', 'NIGHTOWL CONVENIENCE', '7-ELEVEN 4216 {sub2} QL AUS'],
  online: ['eBay O*', 'AMAZON AU', 'ALIEXPRESS', 'ETSY SHOP', 'eBay O*22-12677-33273', 'eBay O*05-12685-86930', 'Google Cashman Casino Barangaroo AU AUS', 'bluemousesafepay.com 0031202993444 GB GB'],
  utilities: ['ENERGEX ELECTRICITY', 'TELSTRA MOBILE', 'OPTUS BROADBAND', 'WATER CORP BILL'],
};

function buildMerchants(suburbs: [string, string, string]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [cat, templates] of Object.entries(MERCHANT_TEMPLATES)) {
    result[cat] = templates.map(t =>
      t.replace(/\{sub0\}/g, suburbs[0])
       .replace(/\{sub1\}/g, suburbs[1])
       .replace(/\{sub2\}/g, suburbs[2])
    );
  }
  return result;
}

const ATM_LOCATION_TEMPLATES = [
  'WBC WESTPAC {sub1}', 'ANZ ATM {sub0}', 'CBA BRANCH {sub2}', 'NAB ATM {sub2}',
  'ETX {sub1} TAVERN {sub1}', 'ETX SUNDOWNER {sub2} {sub2}', 'Red NP-Banana Bender {sub1}',
  'ETX {sub0} TAV {sub0}',
];

function buildATMLocations(suburbs: [string, string, string]): string[] {
  return ATM_LOCATION_TEMPLATES.map(t =>
    t.replace(/\{sub0\}/g, suburbs[0])
     .replace(/\{sub1\}/g, suburbs[1])
     .replace(/\{sub2\}/g, suburbs[2])
  );
}

const TRANSFER_ACCOUNTS = ['xx3885', 'xx7400', 'xx400', 'xx7400'];
const CARDLESS_MEMOS = ['coins', 'coin'];

const MERCHANT_CATEGORIES = Object.keys(MERCHANT_TEMPLATES);

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function formatDateSlash(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function generatePensionCode(rand: () => number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 15; i++) {
    code += chars[Math.floor(rand() * chars.length)];
  }
  return code;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateBankStatement(config: AppConfig, payslips: Payslip[]): BankStatement {
  const rand = seededRandom(Date.now());
  const txs: BankTransaction[] = [];
  const bc = config.bankConfig;
  const suburbs = bc.suburbs ?? ['CABOOLTURE', 'MORAYFIELD', 'BURPENGARY'];
  const MERCHANTS = buildMerchants(suburbs);
  const ATM_LOCATIONS = buildATMLocations(suburbs);
  console.log('[BankStatement] Using suburbs:', suburbs);

  const densityMultiplier = bc.transactionDensity === 'low' ? 0.4
    : bc.transactionDensity === 'high' ? 1.4 : 1.0;

  const ratio = bc.debitCreditRatio ?? 0.5;
  const creditBias = ratio;
  const debitBias = 1 - ratio;
  const TARGET_CREDIT_SURPLUS = 0.30;
  console.log('[BankStatement] Debit/Credit ratio:', ratio, '| creditBias:', creditBias.toFixed(2), '| debitBias:', debitBias.toFixed(2));
  console.log('[BankStatement] Target: credits ~30% more than debits');

  const hasCustomDates = bc.statementStartDate && bc.statementLength;
  const hasPayslips = payslips.length > 0;
  const spanStart = hasCustomDates
    ? new Date(bc.statementStartDate)
    : hasPayslips
      ? addDays(payslips[0].period.startDate, -7)
      : new Date();
  const spanEnd = hasCustomDates
    ? addDays(spanStart, bc.statementLength)
    : hasPayslips
      ? addDays(payslips[payslips.length - 1].period.paymentDate, 7)
      : addDays(spanStart, 30);

  console.log('[BankStatement] Statement period:', formatDate(spanStart), '-', formatDate(spanEnd), `(${bc.statementLength} days)`);
  console.log('[BankStatement] Density:', bc.transactionDensity, '| Pension:', bc.includePension, '| ATM:', bc.includeATM, '| Cardless:', bc.includeCardlessCash, '| Transfers:', bc.includeTransfers);

  let balance = bc.openingBalance;

  txs.push({
    date: spanStart,
    description: 'OPENING BALANCE',
    credit: 0,
    debit: 0,
    balance,
  });

  const paymentDates = new Map<string, number>();
  for (const ps of payslips) {
    const payDate = new Date(ps.period.paymentDate);
    if (isNaN(payDate.getTime())) {
      console.warn('[BankStatement] Invalid paymentDate for payslip, skipping:', ps.period.paymentDate);
      continue;
    }
    const key = payDate.toISOString().split('T')[0];
    paymentDates.set(key, ps.netPay);
  }

  const payslipDatesInRange = new Set<string>();
  for (const [dateKey] of paymentDates) {
    const d = new Date(dateKey);
    if (d >= spanStart && d <= spanEnd) {
      payslipDatesInRange.add(dateKey);
    }
  }
  console.log('[BankStatement] Payslip dates within statement range:', Array.from(payslipDatesInRange));

  const spendMin = bc.dailySpendMin ?? 14;
  const spendMax = bc.dailySpendMax ?? 154;
  const transferMin = bc.incomingTransferMin ?? 50;
  const transferMax = bc.incomingTransferMax ?? 560;

  const current = new Date(spanStart);
  current.setDate(current.getDate() + 1);

  while (current <= spanEnd) {
    const dateKey = current.toISOString().split('T')[0];

    if (bc.includePension && (current.getDay() === 5 || current.getDate() === 8 || current.getDate() === 22)) {
      const income = Math.round((rand() * 560 + 820) * 100) / 100;
      const code = generatePensionCode(rand);
      balance = Math.round((balance + income) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `Direct Credit Pension 015884\n${code}`,
        credit: income,
        debit: 0,
        balance,
      });
    }

    if (paymentDates.has(dateKey)) {
      const amount = paymentDates.get(dateKey)!;
      balance = Math.round((balance + amount) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `Direct Credit ${config.employer.name.toUpperCase()} Salary/Wages`,
        credit: amount,
        debit: 0,
        balance,
      });
    }

    if (bc.includeTransfers && rand() < 0.72 * densityMultiplier * (creditBias * 1.6 + 0.2)) {
      const count = Math.floor(rand() * Math.max(1, Math.round(4 * (creditBias * 1.4 + 0.3)))) + 1;
      for (let j = 0; j < count; j++) {
        const range = transferMax - transferMin;
        const amount = Math.round((rand() * range + transferMin) * 100) / 100;
        const sender = pick(SENDERS, rand);
        const memo = pick(INCOMING_MEMOS, rand);
        balance = Math.round((balance + amount) * 100) / 100;
        txs.push({
          date: new Date(current),
          description: `Fast Transfer From ${sender}\nto PayID Phone\n${memo}`,
          credit: amount,
          debit: 0,
          balance,
        });
      }
    }

    if (bc.includeTransfers && rand() < 0.3 * densityMultiplier * (creditBias * 1.6 + 0.2)) {
      const amount = Math.round((rand() * 800 + 200) * 100) / 100;
      const acc = pick(TRANSFER_ACCOUNTS, rand);
      balance = Math.round((balance + amount) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `Transfer from ${acc} CommBank app`,
        credit: amount,
        debit: 0,
        balance,
      });
    }

    if (rand() < 0.76 * densityMultiplier * (debitBias * 1.6 + 0.2)) {
      const count = Math.floor(rand() * Math.max(1, Math.round(3 * (debitBias * 1.4 + 0.3)))) + 1;
      for (let j = 0; j < count; j++) {
        const category = pick(MERCHANT_CATEGORIES, rand);
        const merchant = pick(MERCHANTS[category], rand);
        const spendRange = spendMax - spendMin;
        const amount = Math.round((rand() * spendRange + spendMin) * 100) / 100;
        const priorDate = addDays(current, -Math.floor(rand() * 5));
        let desc: string;
        if (category === 'online') {
          if (merchant.includes('bluemousesafepay')) {
            desc = `${merchant}\nCard xx1043 AUD ${amount.toFixed(2)}\nValue Date: ${formatDateSlash(priorDate)}`;
          } else {
            desc = `${merchant} Sydney AU AUS\nCard xx1043\nValue Date: ${formatDateSlash(priorDate)}`;
          }
        } else {
          const suburb = pick(suburbs, rand);
          desc = `${merchant} ${suburb} QLD AUS\nCard xx1043\nValue Date: ${formatDateSlash(priorDate)}`;
        }
        balance = Math.round((balance - amount) * 100) / 100;
        txs.push({
          date: new Date(current),
          description: desc,
          credit: 0,
          debit: amount,
          balance,
        });
      }
    }

    if (bc.includeATM && rand() < 0.19 * densityMultiplier * (debitBias * 1.6 + 0.2)) {
      const amounts = [20, 40, 50, 60, 80, 100, 150, 200, 250, 300];
      const amount = pick(amounts, rand);
      const location = pick(ATM_LOCATIONS, rand);
      balance = Math.round((balance - amount) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `Wdl ATM ${location}`,
        credit: 0,
        debit: amount,
        balance,
      });
    }

    if (bc.includeTransfers && rand() < 0.3 * densityMultiplier * (debitBias * 1.6 + 0.2)) {
      const amount = Math.round((rand() * 250 + 50) * 100) / 100;
      const recipient = pick(RECIPIENTS, rand);
      const memo = pick(INCOMING_MEMOS, rand);
      balance = Math.round((balance - amount) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `Transfer To ${recipient}\nPayID Phone from CommBank App\n${memo}`,
        credit: 0,
        debit: amount,
        balance,
      });
    }

    if (bc.includeCardlessCash && rand() < 0.15 * densityMultiplier * (debitBias * 1.2 + 0.4)) {
      const amount = Math.round((rand() * 400 + 100) * 100) / 100;
      const memo = pick(CARDLESS_MEMOS, rand);
      balance = Math.round((balance - amount) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `Cardless Cash for collection\n${memo}`,
        credit: 0,
        debit: amount,
        balance,
      });
      balance = Math.round((balance + amount) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `Cardless Cash return\n${memo}`,
        credit: amount,
        debit: 0,
        balance,
      });
    }

    if (current.getDate() === 1) {
      const totalCreditsThisMonth = txs
        .filter(t => t.date.getMonth() === current.getMonth() && t.credit > 0)
        .reduce((s, t) => s + t.credit, 0);
      if (totalCreditsThisMonth >= 2000) {
        txs.push({
          date: new Date(current),
          description: 'Monthly Account Fee Waiver',
          credit: 0,
          debit: 0,
          balance,
        });
      } else {
        balance = Math.round((balance - 4) * 100) / 100;
        txs.push({
          date: new Date(current),
          description: 'Monthly Account Fee',
          credit: 0,
          debit: 4,
          balance,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  const missedPayslipDates = Array.from(payslipDatesInRange).filter(dk => {
    return !txs.some(t => {
      const txKey = t.date.toISOString().split('T')[0];
      return txKey === dk && t.description.includes('Salary/Wages');
    });
  });
  for (const dk of missedPayslipDates) {
    const amount = paymentDates.get(dk)!;
    const d = new Date(dk);
    balance = Math.round((balance + amount) * 100) / 100;
    txs.push({
      date: d,
      description: `Direct Credit ${config.employer.name.toUpperCase()} Salary/Wages`,
      credit: amount,
      debit: 0,
      balance,
    });
    console.log('[BankStatement] Added missed payslip deposit on', dk, 'for $' + amount.toFixed(2));
  }

  const openingTx = txs.shift()!;
  const dayGroups = new Map<string, BankTransaction[]>();
  for (const tx of txs) {
    const txDate = new Date(tx.date);
    const key = txDate.toISOString().split('T')[0];
    if (!dayGroups.has(key)) dayGroups.set(key, []);
    dayGroups.get(key)!.push(tx);
  }
  const sortedDayKeys = Array.from(dayGroups.keys()).sort();
  const shuffledTxs: BankTransaction[] = [openingTx];
  for (const dayKey of sortedDayKeys) {
    const dayTxs = dayGroups.get(dayKey)!;
    for (let i = dayTxs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [dayTxs[i], dayTxs[j]] = [dayTxs[j], dayTxs[i]];
    }
    shuffledTxs.push(...dayTxs);
  }
  txs.length = 0;
  txs.push(...shuffledTxs);

  let recalcBal = config.bankConfig.openingBalance;
  for (const tx of txs) {
    if (tx.description === 'OPENING BALANCE') {
      tx.balance = recalcBal;
      continue;
    }
    recalcBal = Math.round((recalcBal + tx.credit - tx.debit) * 100) / 100;
    tx.balance = recalcBal;
  }
  balance = recalcBal;

  let totalCreditsPre = 0;
  let totalDebitsPre = 0;
  for (const tx of txs) {
    if (tx.description === 'OPENING BALANCE') continue;
    totalCreditsPre += tx.credit;
    totalDebitsPre += tx.debit;
  }
  console.log('[BankStatement] Pre-adjustment totals - Credits:', totalCreditsPre.toFixed(2), 'Debits:', totalDebitsPre.toFixed(2));

  const desiredCredits = totalDebitsPre * (1 + TARGET_CREDIT_SURPLUS);
  if (totalCreditsPre > 0 && totalDebitsPre > 0) {
    const creditDiff = desiredCredits - totalCreditsPre;
    if (Math.abs(creditDiff) > 1) {
      const payslipCreditTotal = txs
        .filter(t => t.description.includes('Salary/Wages'))
        .reduce((s, t) => s + t.credit, 0);
      const nonPayslipCredits = totalCreditsPre - payslipCreditTotal;
      const neededNonPayslipCredits = desiredCredits - payslipCreditTotal;

      const creditTxs = txs.filter(t =>
        t.credit > 0 &&
        t.description !== 'OPENING BALANCE' &&
        !t.description.includes('Salary/Wages')
      );

      if (creditTxs.length > 0 && nonPayslipCredits > 0) {
        const nonPayslipScale = neededNonPayslipCredits / nonPayslipCredits;
        for (const tx of creditTxs) {
          tx.credit = Math.round(tx.credit * nonPayslipScale * 100) / 100;
          if (tx.credit < 0.01) tx.credit = Math.round((0.5 + rand() * 5) * 100) / 100;
        }
        console.log('[BankStatement] Adjusted credits to enforce ~30% surplus. Scale:', nonPayslipScale.toFixed(3));
      }
    }
  }

  let runBal2 = config.bankConfig.openingBalance;
  for (const tx of txs) {
    if (tx.description === 'OPENING BALANCE') {
      tx.balance = runBal2;
      continue;
    }
    runBal2 = Math.round((runBal2 + tx.credit - tx.debit) * 100) / 100;
    tx.balance = runBal2;
  }
  balance = runBal2;

  let totalCreditsPost = 0;
  let totalDebitsPost = 0;
  for (const tx of txs) {
    totalCreditsPost += tx.credit;
    totalDebitsPost += tx.debit;
  }
  console.log('[BankStatement] Post-adjustment totals - Credits:', totalCreditsPost.toFixed(2), 'Debits:', totalDebitsPost.toFixed(2),
    '| Surplus:', totalDebitsPost > 0 ? ((totalCreditsPost / totalDebitsPost - 1) * 100).toFixed(1) + '%' : 'N/A');

  const targetClosing = config.bankConfig.closingBalance;
  const currentDiff = Math.round((targetClosing - balance) * 100) / 100;
  if (Math.abs(currentDiff) > 0.01) {
    const adjustableTxs = txs.filter(t =>
      t.description !== 'OPENING BALANCE' &&
      (t.debit > 0 || t.credit > 0)
    );
    if (adjustableTxs.length > 0) {
      const perTxAdjust = currentDiff / adjustableTxs.length;
      let remaining = currentDiff;
      for (let i = 0; i < adjustableTxs.length; i++) {
        const tx = adjustableTxs[i];
        let adj: number;
        if (i === adjustableTxs.length - 1) {
          adj = remaining;
        } else {
          adj = Math.round((perTxAdjust + (rand() - 0.5) * Math.abs(perTxAdjust) * 0.4) * 100) / 100;
          adj = Math.min(adj, remaining);
        }
        if (tx.credit > 0) {
          tx.credit = Math.round((tx.credit + adj) * 100) / 100;
          if (tx.credit < 0.01) tx.credit = Math.round((0.5 + rand() * 2) * 100) / 100;
        } else if (tx.debit > 0) {
          tx.debit = Math.round((tx.debit - adj) * 100) / 100;
          if (tx.debit < 0.01) tx.debit = Math.round((0.5 + rand() * 2) * 100) / 100;
        }
        remaining = Math.round((remaining - adj) * 100) / 100;
      }
      let runBal = config.bankConfig.openingBalance;
      for (const tx of txs) {
        if (tx.description === 'OPENING BALANCE') {
          tx.balance = runBal;
          continue;
        }
        runBal = Math.round((runBal + tx.credit - tx.debit) * 100) / 100;
        tx.balance = runBal;
      }
      balance = runBal;
    }
  }

  txs.push({
    date: spanEnd,
    description: 'CLOSING BALANCE',
    credit: 0,
    debit: 0,
    balance: Math.round(balance * 100) / 100,
  });

  const TX_PER_PAGE = 15;
  const pages: BankTransaction[][] = [];
  for (let i = 0; i < txs.length; i += TX_PER_PAGE) {
    pages.push(txs.slice(i, i + TX_PER_PAGE));
  }

  const bsbFormatted = config.bankConfig.bsb.replace(/(\d{3})(\d{3})/, '$1-$2');

  console.log(`[BankStatement] Generated ${txs.length} transactions across ${pages.length} pages`);

  return {
    bankName: 'Commonwealth Bank of Australia',
    accountHolder: config.bankConfig.holderName,
    bsb: bsbFormatted,
    accountNumber: config.bankConfig.accountNumber,
    statementPeriod: `${formatDate(spanStart)} - ${formatDate(spanEnd)}`,
    openingBalance: config.bankConfig.openingBalance,
    closingBalance: config.bankConfig.closingBalance,
    transactions: txs,
    pages,
  };
}
