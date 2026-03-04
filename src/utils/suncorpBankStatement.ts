import { AppConfig, BankStatement, BankTransaction, Payslip } from '@/types/payroll';
import { isWeekend, nextBusinessDay, getMerchantWeight, getATMWeight, getTransferWeight } from './businessDay';

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

const SUNCORP_SENDERS = [
  'M LENARD', 'R PRIOLO', 'S CROSS', 'A BAKHASH', 'R LOTOMAU',
  'K BULLINGHAM', 'J GUY', 'C TALBOT', 'L FLIEDNER', 'D BULLINGHAM',
  'N HARPER', 'S BLAIR', 'J COOK', 'K DEGIOR', 'A BRADLEY',
  'B LEIGH', 'J PASSMORE', 'M IESE', 'J PRES', 'A LIU',
  'C BUTTERWORTH', 'B JOHNSON', 'P GODFREY', 'S BLAIR', 'L SIALE',
  'N HAEV', 'C DICK', 'K DEGIORGIO', 'J MCNAUGHTON', 'K NEWTON',
  'I SUERT', 'T ROSENBERG',
];

const SUNCORP_RECIPIENTS = ['R MILLER', 'T ROSENBERG', 'K TIBBS', 'J SMITH', 'P WILLIAMS'];

const SUNCORP_TRANSFER_MEMOS = [
  'Payment', 'Thanks', 'Rent', 'Bills', 'Groceries', 'Dinner', 'Repayment',
  'Splitting costs', 'For yesterday', 'Cheers', 'Bday', 'Trip money',
];

const SUNCORP_MERCHANT_TEMPLATES: Record<string, string[]> = {
  groceries: [
    'EFTPOS COLES {sub0}',
    'EFTPOS WOOLWORTHS {sub1}',
    'EFTPOS ALDI {sub2}',
    'EFTPOS IGA {sub1}',
    'VISA PURCHASE COLES EXPRESS {sub0}',
    'VISA PURCHASE WOOLWORTHS {sub2}',
  ],
  fuel: [
    'EFTPOS METRO PETROLEUM {sub0}',
    'VISA PURCHASE SHELL {sub1}',
    'VISA PURCHASE BP {sub2}',
    'EFTPOS CALTEX {sub0}',
    'VISA PURCHASE AMPOL {sub1}',
    'EFTPOS UNITED PETROLEUM {sub2}',
  ],
  fast_food: [
    'VISA PURCHASE MCDONALDS {sub0}',
    'EFTPOS KFC {sub1}',
    'VISA PURCHASE SUBWAY {sub2}',
    'VISA PURCHASE DOMINOS {sub0}',
    'EFTPOS HUNGRY JACKS {sub1}',
    'VISA PURCHASE GUZMAN Y GOMEZ {sub2}',
  ],
  liquor: [
    'EFTPOS BWS {sub0}',
    'EFTPOS LIQUORLAND {sub1}',
    'EFTPOS DAN MURPHYS {sub2}',
    'VISA PURCHASE BWS {sub0}',
    'VISA PURCHASE CELLARBRATIONS {sub1}',
  ],
  convenience: [
    'EFTPOS 7-ELEVEN {sub0}',
    'VISA PURCHASE 7-ELEVEN {sub1}',
    'EFTPOS NIGHTOWL {sub2}',
    'VISA PURCHASE SPAR {sub0}',
  ],
  online: [
    'VISA PURCHASE EBAY AUSTRALIA',
    'VISA PURCHASE AMAZON AU',
    'VISA PURCHASE PAYPAL *EBAY',
    'VISA PURCHASE GOOGLE *SERVICES',
    'VISA PURCHASE APPLE.COM/BILL',
    'VISA PURCHASE NETFLIX.COM',
    'VISA PURCHASE SPOTIFY P',
    'VISA PURCHASE KMART ONLINE',
  ],
  utilities: [
    'DIRECT DEBIT ENERGEX',
    'DIRECT DEBIT TELSTRA',
    'DIRECT DEBIT OPTUS',
    'DIRECT DEBIT ORIGIN ENERGY',
    'DIRECT DEBIT AGL ELECTRICITY',
  ],
};

function buildSuncorpMerchants(suburbs: [string, string, string]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [cat, templates] of Object.entries(SUNCORP_MERCHANT_TEMPLATES)) {
    result[cat] = templates.map(t =>
      t.replace(/\{sub0\}/g, suburbs[0])
       .replace(/\{sub1\}/g, suburbs[1])
       .replace(/\{sub2\}/g, suburbs[2])
    );
  }
  return result;
}

const SUNCORP_ATM_TEMPLATES = [
  'ATM WITHDRAWAL SUNCORP {sub0}',
  'ATM WITHDRAWAL CBA {sub1}',
  'ATM WITHDRAWAL WESTPAC {sub2}',
  'ATM WITHDRAWAL ANZ {sub0}',
  'ATM WITHDRAWAL NAB {sub1}',
  'ATM WITHDRAWAL SUNCORP {sub2}',
];

function buildSuncorpATMLocations(suburbs: [string, string, string]): string[] {
  return SUNCORP_ATM_TEMPLATES.map(t =>
    t.replace(/\{sub0\}/g, suburbs[0])
     .replace(/\{sub1\}/g, suburbs[1])
     .replace(/\{sub2\}/g, suburbs[2])
  );
}

const SUNCORP_TRANSFER_ACCOUNTS = ['xx4821', 'xx9033', 'xx1157', 'xx6290'];

const MERCHANT_CATEGORIES = Object.keys(SUNCORP_MERCHANT_TEMPLATES);

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function generateRefCode(rand: () => number, length: number = 12): string {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(rand() * chars.length)];
  }
  return code;
}

export function generateSuncorpBankStatement(config: AppConfig, payslips: Payslip[]): BankStatement {
  const rand = seededRandom(Date.now());
  const txs: BankTransaction[] = [];
  const bc = config.bankConfig;
  const suburbs = bc.suburbs ?? ['CABOOLTURE', 'MORAYFIELD', 'BURPENGARY'];
  const MERCHANTS = buildSuncorpMerchants(suburbs);
  const ATM_LOCATIONS = buildSuncorpATMLocations(suburbs);
  console.log('[SuncorpStatement] Using suburbs:', suburbs);

  const densityMultiplier = bc.transactionDensity === 'low' ? 0.4
    : bc.transactionDensity === 'high' ? 1.4 : 1.0;

  const ratio = bc.debitCreditRatio ?? 0.5;
  const creditBias = ratio;
  const debitBias = 1 - ratio;
  const TARGET_CREDIT_SURPLUS = 0.30;
  console.log('[SuncorpStatement] Debit/Credit ratio:', ratio, '| creditBias:', creditBias.toFixed(2), '| debitBias:', debitBias.toFixed(2));

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

  console.log('[SuncorpStatement] Statement period:', formatDate(spanStart), '-', formatDate(spanEnd));

  let balance = bc.openingBalance;

  txs.push({
    date: spanStart,
    description: 'OPENING BALANCE',
    credit: 0,
    debit: 0,
    balance,
  });

  const paymentDates = new Map<string, number>();
  const payFrequency = config.payConfig.frequency;
  const frequencyDays = payFrequency === 'weekly' ? 7 : payFrequency === 'fortnightly' ? 14 : 30;

  let representativeNetPay = 0;
  const payslipPaymentDates: Date[] = [];
  for (const ps of payslips) {
    const payDate = new Date(ps.period.paymentDate);
    if (isNaN(payDate.getTime())) continue;
    const key = payDate.toISOString().split('T')[0];
    paymentDates.set(key, ps.netPay);
    payslipPaymentDates.push(payDate);
    representativeNetPay = ps.netPay;
  }

  if (payslipPaymentDates.length > 0 && representativeNetPay > 0) {
    payslipPaymentDates.sort((a, b) => a.getTime() - b.getTime());
    const lastPayslipDate = payslipPaymentDates[payslipPaymentDates.length - 1];
    const firstPayslipDate = payslipPaymentDates[0];

    let extraDate = new Date(lastPayslipDate);
    if (payFrequency === 'monthly') {
      extraDate.setMonth(extraDate.getMonth() + 1);
    } else {
      extraDate = addDays(extraDate, frequencyDays);
    }
    while (extraDate <= spanEnd) {
      const key = extraDate.toISOString().split('T')[0];
      if (!paymentDates.has(key)) {
        const noise = Math.round((rand() * 40 - 20) * 100) / 100;
        const noisyPay = Math.round((representativeNetPay + noise) * 100) / 100;
        paymentDates.set(key, noisyPay);
        console.log('[SuncorpStatement] Extended pay forward on', key, 'for $' + noisyPay.toFixed(2));
      }
      if (payFrequency === 'monthly') {
        extraDate.setMonth(extraDate.getMonth() + 1);
      } else {
        extraDate = addDays(extraDate, frequencyDays);
      }
    }

    let backDate = new Date(firstPayslipDate);
    if (payFrequency === 'monthly') {
      backDate.setMonth(backDate.getMonth() - 1);
    } else {
      backDate = addDays(backDate, -frequencyDays);
    }
    while (backDate >= spanStart) {
      const key = backDate.toISOString().split('T')[0];
      if (!paymentDates.has(key)) {
        const noise = Math.round((rand() * 40 - 20) * 100) / 100;
        const noisyPay = Math.round((representativeNetPay + noise) * 100) / 100;
        paymentDates.set(key, noisyPay);
        console.log('[SuncorpStatement] Extended pay backward on', key, 'for $' + noisyPay.toFixed(2));
      }
      if (payFrequency === 'monthly') {
        backDate.setMonth(backDate.getMonth() - 1);
      } else {
        backDate = addDays(backDate, -frequencyDays);
      }
    }
  }

  const payslipDatesInRange = new Set<string>();
  for (const [dateKey] of paymentDates) {
    const d = new Date(dateKey);
    if (d >= spanStart && d <= spanEnd) {
      payslipDatesInRange.add(dateKey);
    }
  }
  console.log('[SuncorpStatement] Pay deposit dates:', Array.from(payslipDatesInRange).sort());

  const spendMin = bc.dailySpendMin ?? 14;
  const spendMax = bc.dailySpendMax ?? 154;
  const transferMin = bc.incomingTransferMin ?? 50;
  const transferMax = bc.incomingTransferMax ?? 560;

  const current = new Date(spanStart);
  current.setDate(current.getDate() + 1);

  while (current <= spanEnd) {
    const dateKey = current.toISOString().split('T')[0];

    if (bc.includeMortgageRent && current.getDate() === (bc.mortgageRentDay ?? 1)) {
      const baseAmount = bc.mortgageRentAmount ?? 1800;
      const noise = Math.round((rand() * 2 - 1) * 100) / 100;
      const mrAmount = Math.round((baseAmount + noise) * 100) / 100;
      const label = bc.mortgageRentLabel === 'rent' ? 'RENT' : 'MORTGAGE';
      const customName = (bc.mortgageRentTransactionName ?? '').trim();
      const payee = customName
        ? customName.toUpperCase()
        : label === 'RENT'
          ? pick(['RAY WHITE PROPERTY MGMT', 'LJ HOOKER TRUST', 'HARCOURTS RENTAL', 'BELLE PROPERTY MGMT'], rand)
          : pick(['SUNCORP HOME LOAN', 'WESTPAC HOME LOAN', 'ANZ HOME LOAN', 'NAB HOUSING LOAN'], rand);
      balance = Math.round((balance - mrAmount) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `DIRECT DEBIT ${payee}\n${label} PAYMENT REF ${generateRefCode(rand, 8)}`,
        credit: 0,
        debit: mrAmount,
        balance,
      });
      console.log('[SuncorpStatement] Added ' + label + ' on ' + dateKey + ' $' + mrAmount.toFixed(2));
    }

    if (bc.includePension && (current.getDay() === 5 || current.getDate() === 8 || current.getDate() === 22)) {
      const income = Math.round((rand() * 560 + 820) * 100) / 100;
      const refCode = generateRefCode(rand, 15);
      balance = Math.round((balance + income) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `DIRECT CREDIT CENTRELINK\nPENSION ${refCode}`,
        credit: income,
        debit: 0,
        balance,
      });
    }

    if (paymentDates.has(dateKey)) {
      if (!isWeekend(current)) {
        const amount = paymentDates.get(dateKey)!;
        balance = Math.round((balance + amount) * 100) / 100;
        const ref = generateRefCode(rand, 10);
        txs.push({
          date: new Date(current),
          description: `DIRECT CREDIT ${config.employer.name.toUpperCase()}\nSALARY ${ref}`,
          credit: amount,
          debit: 0,
          balance,
        });
      } else {
        const shifted = nextBusinessDay(current);
        const shiftedKey = shifted.toISOString().split('T')[0];
        if (!paymentDates.has(shiftedKey)) {
          paymentDates.set(shiftedKey, paymentDates.get(dateKey)!);
          console.log('[SuncorpStatement] Shifted weekend salary from', dateKey, 'to', shiftedKey);
        }
      }
    }

    const dayOfWeek = current.getDay();
    const merchantW = getMerchantWeight(dayOfWeek);
    const atmW = getATMWeight(dayOfWeek);
    const transferW = getTransferWeight(dayOfWeek);

    if (bc.includeTransfers && rand() < 0.72 * densityMultiplier * (creditBias * 1.6 + 0.2) * transferW) {
      const count = Math.floor(rand() * Math.max(1, Math.round(4 * (creditBias * 1.4 + 0.3)))) + 1;
      for (let j = 0; j < count; j++) {
        const range = transferMax - transferMin;
        const amount = Math.round((rand() * range + transferMin) * 100) / 100;
        const sender = pick(SUNCORP_SENDERS, rand);
        const memo = pick(SUNCORP_TRANSFER_MEMOS, rand);
        balance = Math.round((balance + amount) * 100) / 100;
        txs.push({
          date: new Date(current),
          description: `OSKO PAYMENT FROM ${sender}\n${memo}`,
          credit: amount,
          debit: 0,
          balance,
        });
      }
    }

    if (bc.includeTransfers && rand() < 0.3 * densityMultiplier * (creditBias * 1.6 + 0.2) * transferW) {
      const amount = Math.round((rand() * 800 + 200) * 100) / 100;
      const acc = pick(SUNCORP_TRANSFER_ACCOUNTS, rand);
      balance = Math.round((balance + amount) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `INTERNAL TRANSFER FROM ${acc}\nSUNCORP INTERNET BANKING`,
        credit: amount,
        debit: 0,
        balance,
      });
    }

    if (rand() < 0.76 * densityMultiplier * (debitBias * 1.6 + 0.2) * merchantW) {
      const count = Math.floor(rand() * Math.max(1, Math.round(3 * (debitBias * 1.4 + 0.3)))) + 1;
      for (let j = 0; j < count; j++) {
        const category = pick(MERCHANT_CATEGORIES, rand);
        const merchant = pick(MERCHANTS[category], rand);
        const spendRange = spendMax - spendMin;
        const amount = Math.round((rand() * spendRange + spendMin) * 100) / 100;
        if (balance - amount >= 0.01) {
          balance = Math.round((balance - amount) * 100) / 100;
        }
        txs.push({
          date: new Date(current),
          description: merchant,
          credit: 0,
          debit: amount,
          balance,
        });
      }
    }

    if (bc.includeATM && rand() < 0.19 * densityMultiplier * (debitBias * 1.6 + 0.2) * atmW) {
      const amounts = [20, 40, 50, 60, 80, 100, 150, 200, 250, 300];
      const amount = pick(amounts, rand);
      const location = pick(ATM_LOCATIONS, rand);
      if (balance - amount >= 0.01) {
        balance = Math.round((balance - amount) * 100) / 100;
      }
      txs.push({
        date: new Date(current),
        description: location,
        credit: 0,
        debit: amount,
        balance,
      });
    }

    if (bc.includeTransfers && rand() < 0.3 * densityMultiplier * (debitBias * 1.6 + 0.2) * transferW) {
      const amount = Math.round((rand() * 250 + 50) * 100) / 100;
      const recipient = pick(SUNCORP_RECIPIENTS, rand);
      const memo = pick(SUNCORP_TRANSFER_MEMOS, rand);
      if (balance - amount >= 0.01) {
        balance = Math.round((balance - amount) * 100) / 100;
      }
      txs.push({
        date: new Date(current),
        description: `OSKO PAYMENT TO ${recipient}\n${memo}`,
        credit: 0,
        debit: amount,
        balance,
      });
    }

    if (bc.includeCardlessCash && rand() < 0.15 * densityMultiplier * (debitBias * 1.2 + 0.4)) {
      const amount = Math.round((rand() * 400 + 100) * 100) / 100;
      balance = Math.round((balance - amount) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `ATM CARDLESS CASH WITHDRAWAL\nREF ${generateRefCode(rand, 10)}`,
        credit: 0,
        debit: amount,
        balance,
      });
      balance = Math.round((balance + amount) * 100) / 100;
      txs.push({
        date: new Date(current),
        description: `ATM CARDLESS CASH REVERSAL\nREF ${generateRefCode(rand, 10)}`,
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
          description: 'MONTHLY ACCOUNT FEE WAIVED',
          credit: 0,
          debit: 0,
          balance,
        });
      } else {
        balance = Math.round((balance - 5) * 100) / 100;
        txs.push({
          date: new Date(current),
          description: 'MONTHLY ACCOUNT KEEPING FEE',
          credit: 0,
          debit: 5,
          balance,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  const missedPayslipDates = Array.from(payslipDatesInRange).filter(dk => {
    return !txs.some(t => {
      const txKey = t.date.toISOString().split('T')[0];
      return txKey === dk && t.description.includes('SALARY');
    });
  });
  for (const dk of missedPayslipDates) {
    const amount = paymentDates.get(dk)!;
    const d = new Date(dk);
    balance = Math.round((balance + amount) * 100) / 100;
    const ref = generateRefCode(rand, 10);
    txs.push({
      date: d,
      description: `DIRECT CREDIT ${config.employer.name.toUpperCase()}\nSALARY ${ref}`,
      credit: amount,
      debit: 0,
      balance,
    });
    console.log('[SuncorpStatement] Added missed payslip deposit on', dk, 'for $' + amount.toFixed(2));
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
  console.log('[SuncorpStatement] Pre-adjustment - Credits:', totalCreditsPre.toFixed(2), 'Debits:', totalDebitsPre.toFixed(2));

  const desiredCredits = totalDebitsPre * (1 + TARGET_CREDIT_SURPLUS);
  if (totalCreditsPre > 0 && totalDebitsPre > 0) {
    const creditDiff = desiredCredits - totalCreditsPre;
    if (Math.abs(creditDiff) > 1) {
      const payslipCreditTotal = txs
        .filter(t => t.description.includes('SALARY'))
        .reduce((s, t) => s + t.credit, 0);
      const nonPayslipCredits = totalCreditsPre - payslipCreditTotal;
      const neededNonPayslipCredits = desiredCredits - payslipCreditTotal;

      const creditTxs = txs.filter(t =>
        t.credit > 0 &&
        t.description !== 'OPENING BALANCE' &&
        !t.description.includes('SALARY')
      );

      if (creditTxs.length > 0 && nonPayslipCredits > 0) {
        const nonPayslipScale = neededNonPayslipCredits / nonPayslipCredits;
        for (const tx of creditTxs) {
          tx.credit = Math.round(tx.credit * nonPayslipScale * 100) / 100;
          if (tx.credit < 0.01) tx.credit = Math.round((0.5 + rand() * 5) * 100) / 100;
        }
        console.log('[SuncorpStatement] Adjusted credits scale:', nonPayslipScale.toFixed(3));
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

  const FIRST_PAGE_TX = 12;
  const CONTINUATION_PAGE_TX = 22;
  const pages: BankTransaction[][] = [];
  if (txs.length > 0) {
    pages.push(txs.slice(0, FIRST_PAGE_TX));
    let offset = FIRST_PAGE_TX;
    while (offset < txs.length) {
      pages.push(txs.slice(offset, offset + CONTINUATION_PAGE_TX));
      offset += CONTINUATION_PAGE_TX;
    }
  }

  const bsbFormatted = config.bankConfig.bsb.replace(/(\d{3})(\d{3})/, '$1-$2');

  console.log(`[SuncorpStatement] Generated ${txs.length} transactions across ${pages.length} pages`);

  return {
    bankName: 'Suncorp-Metway Ltd',
    accountHolder: config.bankConfig.holderName.toUpperCase(),
    bsb: bsbFormatted,
    accountNumber: config.bankConfig.accountNumber,
    statementPeriod: `${formatDate(spanStart)} - ${formatDate(spanEnd)}`,
    openingBalance: config.bankConfig.openingBalance,
    closingBalance: config.bankConfig.closingBalance,
    transactions: txs,
    pages,
  };
}
