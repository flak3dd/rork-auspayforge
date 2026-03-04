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

export interface BankProfile {
  bankKey: string;
  bankName: string;
  bankFullName: string;
  salaryDesc: (employer: string, ref: string) => string;
  transferInDesc: (sender: string, memo: string) => string;
  transferOutDesc: (recipient: string, memo: string) => string;
  internalTransferDesc: (acc: string) => string;
  atmDesc: (location: string) => string;
  merchantDesc: (merchant: string) => string;
  pensionDesc: (ref: string) => string;
  mortgageDesc: (payee: string, label: string, ref: string) => string;
  cardlessDesc: (ref: string) => string;
  accountFee: number;
  accountFeeName: string;
  feeWaiverName: string;
  txPerPage: number;
  senders: string[];
  recipients: string[];
  memos: string[];
  merchants: Record<string, string[]>;
  atmLocations: string[];
  transferAccounts: string[];
  mortgagePayees: { rent: string[]; mortgage: string[] };
}

const GENERIC_SENDERS = [
  'M LENARD', 'R PRIOLO', 'S CROSS', 'A BAKHASH', 'R LOTOMAU',
  'K BULLINGHAM', 'J GUY', 'C TALBOT', 'L FLIEDNER', 'D BULLINGHAM',
  'N HARPER', 'S BLAIR', 'J COOK', 'K DEGIOR', 'A BRADLEY',
  'B LEIGH', 'J PASSMORE', 'M IESE', 'J PRES', 'A LIU',
];

const GENERIC_RECIPIENTS = ['R MILLER', 'T ROSENBERG', 'K TIBBS', 'J SMITH'];

const GENERIC_MEMOS = [
  'Payment', 'Thanks', 'Rent', 'Bills', 'Groceries', 'Dinner', 'Repayment',
  'Splitting costs', 'Cheers', 'Birthday', 'Trip money',
];

function buildGenericMerchants(suburbs: [string, string, string], prefix: string): Record<string, string[]> {
  return {
    groceries: [
      `${prefix} COLES ${suburbs[0]}`, `${prefix} WOOLWORTHS ${suburbs[1]}`,
      `${prefix} ALDI ${suburbs[2]}`, `${prefix} IGA ${suburbs[1]}`,
    ],
    fuel: [
      `${prefix} SHELL ${suburbs[0]}`, `${prefix} BP ${suburbs[1]}`,
      `${prefix} AMPOL ${suburbs[2]}`, `${prefix} CALTEX ${suburbs[0]}`,
    ],
    fast_food: [
      `${prefix} MCDONALDS ${suburbs[0]}`, `${prefix} KFC ${suburbs[1]}`,
      `${prefix} SUBWAY ${suburbs[2]}`, `${prefix} DOMINOS ${suburbs[0]}`,
    ],
    liquor: [
      `${prefix} BWS ${suburbs[0]}`, `${prefix} DAN MURPHYS ${suburbs[1]}`,
      `${prefix} LIQUORLAND ${suburbs[2]}`,
    ],
    convenience: [
      `${prefix} 7-ELEVEN ${suburbs[0]}`, `${prefix} NIGHTOWL ${suburbs[1]}`,
    ],
    online: [
      `${prefix} AMAZON AU`, `${prefix} EBAY AUSTRALIA`,
      `${prefix} PAYPAL *`, `${prefix} GOOGLE *SERVICES`,
      `${prefix} APPLE.COM/BILL`, `${prefix} NETFLIX.COM`,
    ],
    utilities: [
      'DIRECT DEBIT ENERGEX', 'DIRECT DEBIT TELSTRA',
      'DIRECT DEBIT OPTUS', 'DIRECT DEBIT ORIGIN ENERGY',
    ],
  };
}

function buildGenericATM(suburbs: [string, string, string], bankName: string): string[] {
  return [
    `ATM ${bankName} ${suburbs[0]}`, `ATM ${bankName} ${suburbs[1]}`,
    `ATM CBA ${suburbs[2]}`, `ATM WESTPAC ${suburbs[0]}`,
    `ATM ANZ ${suburbs[1]}`, `ATM NAB ${suburbs[2]}`,
  ];
}

export const NAB_PROFILE: BankProfile = {
  bankKey: 'nab',
  bankName: 'NAB',
  bankFullName: 'National Australia Bank Ltd',
  salaryDesc: (employer, ref) => `CREDIT ${employer}\nSALARY/WAGES REF: ${ref}`,
  transferInDesc: (sender, memo) => `OSKO FROM ${sender}\n${memo}`,
  transferOutDesc: (recipient, memo) => `OSKO TO ${recipient}\n${memo}`,
  internalTransferDesc: (acc) => `TRANSFER FROM ${acc}\nNAB INTERNET BANKING`,
  atmDesc: (location) => `ATM WITHDRAWAL ${location}`,
  merchantDesc: (merchant) => merchant,
  pensionDesc: (ref) => `CREDIT CENTRELINK\nPENSION ${ref}`,
  mortgageDesc: (payee, label, ref) => `DIRECT DEBIT ${payee}\n${label} ${ref}`,
  cardlessDesc: (ref) => `CARDLESS CASH ${ref}`,
  accountFee: 5,
  accountFeeName: 'MONTHLY ACCOUNT SERVICE FEE',
  feeWaiverName: 'MONTHLY ACCOUNT FEE WAIVED',
  txPerPage: 16,
  senders: GENERIC_SENDERS,
  recipients: GENERIC_RECIPIENTS,
  memos: GENERIC_MEMOS,
  merchants: {},
  atmLocations: [],
  transferAccounts: ['xx4821', 'xx9033', 'xx1157', 'xx6290'],
  mortgagePayees: {
    rent: ['RAY WHITE PROPERTY', 'LJ HOOKER', 'HARCOURTS', 'BELLE PROPERTY'],
    mortgage: ['NAB HOME LOAN', 'WESTPAC HOME LOAN', 'ANZ HOME LOAN', 'CBA HOMELOAN'],
  },
};

export const ANZ_PROFILE: BankProfile = {
  bankKey: 'anz',
  bankName: 'ANZ',
  bankFullName: 'Australia and New Zealand Banking Group Limited',
  salaryDesc: (employer, ref) => `CR ${employer}\nSALARY ${ref}`,
  transferInDesc: (sender, memo) => `ANZ OSKO FROM ${sender}\n${memo}`,
  transferOutDesc: (recipient, memo) => `ANZ OSKO TO ${recipient}\n${memo}`,
  internalTransferDesc: (acc) => `TFR FROM ${acc}\nANZ INTERNET BANKING`,
  atmDesc: (location) => `ATM WDL ${location}`,
  merchantDesc: (merchant) => merchant,
  pensionDesc: (ref) => `CR CENTRELINK PENSION\n${ref}`,
  mortgageDesc: (payee, label, ref) => `DD ${payee}\n${label} REF ${ref}`,
  cardlessDesc: (ref) => `CARDLESS CASH WDL ${ref}`,
  accountFee: 5,
  accountFeeName: 'MONTHLY ACCOUNT FEE',
  feeWaiverName: 'MONTHLY FEE WAIVED',
  txPerPage: 17,
  senders: GENERIC_SENDERS,
  recipients: GENERIC_RECIPIENTS,
  memos: GENERIC_MEMOS,
  merchants: {},
  atmLocations: [],
  transferAccounts: ['xx2847', 'xx5019', 'xx3366', 'xx8801'],
  mortgagePayees: {
    rent: ['RAY WHITE PROPERTY', 'LJ HOOKER', 'HARCOURTS', 'MCGRATH ESTATE'],
    mortgage: ['ANZ HOME LOAN', 'WESTPAC HOME LOAN', 'CBA HOMELOAN', 'NAB HOUSING LOAN'],
  },
};

export const WESTPAC_PROFILE: BankProfile = {
  bankKey: 'westpac',
  bankName: 'Westpac',
  bankFullName: 'Westpac Banking Corporation',
  salaryDesc: (employer, ref) => `DEPOSIT ${employer}\nSALARY/WAGES ${ref}`,
  transferInDesc: (sender, memo) => `OSKO PAYMENT FROM ${sender}\n${memo}`,
  transferOutDesc: (recipient, memo) => `OSKO PAYMENT TO ${recipient}\n${memo}`,
  internalTransferDesc: (acc) => `TRANSFER FROM ${acc}\nWESTPAC ONLINE`,
  atmDesc: (location) => `ATM WITHDRAWAL ${location}`,
  merchantDesc: (merchant) => merchant,
  pensionDesc: (ref) => `DEPOSIT CENTRELINK\nPENSION ${ref}`,
  mortgageDesc: (payee, label, ref) => `DIRECT DEBIT ${payee}\n${label} PAYMENT ${ref}`,
  cardlessDesc: (ref) => `CARDLESS CASH ${ref}`,
  accountFee: 4,
  accountFeeName: 'MONTHLY PLAN FEE',
  feeWaiverName: 'MONTHLY PLAN FEE WAIVED',
  txPerPage: 16,
  senders: GENERIC_SENDERS,
  recipients: GENERIC_RECIPIENTS,
  memos: GENERIC_MEMOS,
  merchants: {},
  atmLocations: [],
  transferAccounts: ['xx7721', 'xx3049', 'xx5582', 'xx1190'],
  mortgagePayees: {
    rent: ['RAY WHITE PROPERTY', 'LJ HOOKER TRUST', 'HARCOURTS RENTAL', 'BELLE PROPERTY'],
    mortgage: ['WESTPAC HOME LOAN', 'CBA HOMELOAN', 'ANZ HOME LOAN', 'NAB HOUSING LOAN'],
  },
};

export function getProfileByKey(key: string): BankProfile {
  switch (key) {
    case 'nab': return NAB_PROFILE;
    case 'anz': return ANZ_PROFILE;
    case 'westpac': return WESTPAC_PROFILE;
    default: return NAB_PROFILE;
  }
}

export function generateGenericBankStatement(config: AppConfig, payslips: Payslip[], profile: BankProfile): BankStatement {
  const rand = seededRandom(Date.now());
  const txs: BankTransaction[] = [];
  const bc = config.bankConfig;
  const suburbs = bc.suburbs ?? ['CABOOLTURE', 'MORAYFIELD', 'BURPENGARY'];

  const merchantPrefix = profile.bankKey === 'nab' ? 'VISA DEBIT' :
    profile.bankKey === 'anz' ? 'VISA PURCHASE' : 'EFTPOS';
  const MERCHANTS = buildGenericMerchants(suburbs, merchantPrefix);
  const ATM_LOCATIONS = buildGenericATM(suburbs, profile.bankName);
  console.log(`[${profile.bankName}Statement] Using suburbs:`, suburbs);

  const densityMultiplier = bc.transactionDensity === 'low' ? 0.4
    : bc.transactionDensity === 'high' ? 1.4 : 1.0;

  const ratio = bc.debitCreditRatio ?? 0.5;
  const creditBias = ratio;
  const debitBias = 1 - ratio;
  const TARGET_CREDIT_SURPLUS = 0.30;

  const spanStart = bc.statementStartDate
    ? new Date(bc.statementStartDate)
    : payslips.length > 0
      ? addDays(payslips[0].period.startDate, -7)
      : new Date();
  const spanEnd = bc.statementLength
    ? addDays(spanStart, bc.statementLength)
    : payslips.length > 0
      ? addDays(payslips[payslips.length - 1].period.paymentDate, 7)
      : addDays(spanStart, 30);

  let balance = bc.openingBalance;
  txs.push({ date: spanStart, description: 'OPENING BALANCE', credit: 0, debit: 0, balance });

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
    const lastDate = payslipPaymentDates[payslipPaymentDates.length - 1];
    const firstDate = payslipPaymentDates[0];

    let extraDate = new Date(lastDate);
    if (payFrequency === 'monthly') extraDate.setMonth(extraDate.getMonth() + 1);
    else extraDate = addDays(extraDate, frequencyDays);
    while (extraDate <= spanEnd) {
      const key = extraDate.toISOString().split('T')[0];
      if (!paymentDates.has(key)) {
        const noise = Math.round((rand() * 40 - 20) * 100) / 100;
        paymentDates.set(key, Math.round((representativeNetPay + noise) * 100) / 100);
      }
      if (payFrequency === 'monthly') extraDate.setMonth(extraDate.getMonth() + 1);
      else extraDate = addDays(extraDate, frequencyDays);
    }

    let backDate = new Date(firstDate);
    if (payFrequency === 'monthly') backDate.setMonth(backDate.getMonth() - 1);
    else backDate = addDays(backDate, -frequencyDays);
    while (backDate >= spanStart) {
      const key = backDate.toISOString().split('T')[0];
      if (!paymentDates.has(key)) {
        const noise = Math.round((rand() * 40 - 20) * 100) / 100;
        paymentDates.set(key, Math.round((representativeNetPay + noise) * 100) / 100);
      }
      if (payFrequency === 'monthly') backDate.setMonth(backDate.getMonth() - 1);
      else backDate = addDays(backDate, -frequencyDays);
    }
  }

  const spendMin = bc.dailySpendMin ?? 14;
  const spendMax = bc.dailySpendMax ?? 154;
  const transferMin = bc.incomingTransferMin ?? 50;
  const transferMax = bc.incomingTransferMax ?? 560;

  const current = new Date(spanStart);
  current.setDate(current.getDate() + 1);
  const MERCHANT_CATEGORIES = Object.keys(MERCHANTS);

  while (current <= spanEnd) {
    const dateKey = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay();
    const merchantW = getMerchantWeight(dayOfWeek);
    const atmW = getATMWeight(dayOfWeek);
    const transferW = getTransferWeight(dayOfWeek);

    if (bc.includeMortgageRent && current.getDate() === (bc.mortgageRentDay ?? 1) && !isWeekend(current)) {
      const mrAmount = Math.round(((bc.mortgageRentAmount ?? 1800) + (rand() * 2 - 1)) * 100) / 100;
      const label = bc.mortgageRentLabel === 'rent' ? 'RENT' : 'MORTGAGE';
      const customName = (bc.mortgageRentTransactionName ?? '').trim();
      const payees = label === 'RENT' ? profile.mortgagePayees.rent : profile.mortgagePayees.mortgage;
      const payee = customName ? customName.toUpperCase() : pick(payees, rand);
      if (balance - mrAmount >= 0.01) balance = Math.round((balance - mrAmount) * 100) / 100;
      txs.push({ date: new Date(current), description: profile.mortgageDesc(payee, label, generateRefCode(rand, 8)), credit: 0, debit: mrAmount, balance });
    }

    if (bc.includePension && !isWeekend(current) && (current.getDay() === 5 || current.getDate() === 8 || current.getDate() === 22)) {
      const income = Math.round((rand() * 560 + 820) * 100) / 100;
      balance = Math.round((balance + income) * 100) / 100;
      txs.push({ date: new Date(current), description: profile.pensionDesc(generateRefCode(rand, 15)), credit: income, debit: 0, balance });
    }

    if (paymentDates.has(dateKey)) {
      if (!isWeekend(current)) {
        const amount = paymentDates.get(dateKey)!;
        balance = Math.round((balance + amount) * 100) / 100;
        txs.push({ date: new Date(current), description: profile.salaryDesc(config.employer.name.toUpperCase(), generateRefCode(rand, 10)), credit: amount, debit: 0, balance });
      } else {
        const shifted = nextBusinessDay(current);
        const shiftedKey = shifted.toISOString().split('T')[0];
        if (!paymentDates.has(shiftedKey)) paymentDates.set(shiftedKey, paymentDates.get(dateKey)!);
      }
    }

    if (bc.includeTransfers && rand() < 0.72 * densityMultiplier * (creditBias * 1.6 + 0.2) * transferW) {
      const count = Math.floor(rand() * Math.max(1, Math.round(4 * (creditBias * 1.4 + 0.3)))) + 1;
      for (let j = 0; j < count; j++) {
        const amount = Math.round((rand() * (transferMax - transferMin) + transferMin) * 100) / 100;
        balance = Math.round((balance + amount) * 100) / 100;
        txs.push({ date: new Date(current), description: profile.transferInDesc(pick(profile.senders, rand), pick(profile.memos, rand)), credit: amount, debit: 0, balance });
      }
    }

    if (bc.includeTransfers && rand() < 0.3 * densityMultiplier * (creditBias * 1.6 + 0.2) * transferW) {
      const amount = Math.round((rand() * 800 + 200) * 100) / 100;
      balance = Math.round((balance + amount) * 100) / 100;
      txs.push({ date: new Date(current), description: profile.internalTransferDesc(pick(profile.transferAccounts, rand)), credit: amount, debit: 0, balance });
    }

    if (rand() < 0.76 * densityMultiplier * (debitBias * 1.6 + 0.2) * merchantW) {
      const count = Math.floor(rand() * Math.max(1, Math.round(3 * (debitBias * 1.4 + 0.3)))) + 1;
      for (let j = 0; j < count; j++) {
        const category = pick(MERCHANT_CATEGORIES, rand);
        const merchant = pick(MERCHANTS[category], rand);
        const amount = Math.round((rand() * (spendMax - spendMin) + spendMin) * 100) / 100;
        if (balance - amount >= 0.01) balance = Math.round((balance - amount) * 100) / 100;
        txs.push({ date: new Date(current), description: profile.merchantDesc(merchant), credit: 0, debit: amount, balance });
      }
    }

    if (bc.includeATM && rand() < 0.19 * densityMultiplier * (debitBias * 1.6 + 0.2) * atmW) {
      const amount = pick([20, 40, 50, 60, 80, 100, 150, 200, 250, 300], rand);
      if (balance - amount >= 0.01) balance = Math.round((balance - amount) * 100) / 100;
      txs.push({ date: new Date(current), description: profile.atmDesc(pick(ATM_LOCATIONS, rand)), credit: 0, debit: amount, balance });
    }

    if (bc.includeTransfers && rand() < 0.3 * densityMultiplier * (debitBias * 1.6 + 0.2) * transferW) {
      const amount = Math.round((rand() * 250 + 50) * 100) / 100;
      if (balance - amount >= 0.01) balance = Math.round((balance - amount) * 100) / 100;
      txs.push({ date: new Date(current), description: profile.transferOutDesc(pick(profile.recipients, rand), pick(profile.memos, rand)), credit: 0, debit: amount, balance });
    }

    if (bc.includeCardlessCash && rand() < 0.15 * densityMultiplier * (debitBias * 1.2 + 0.4)) {
      const amount = Math.round((rand() * 400 + 100) * 100) / 100;
      if (balance - amount >= 0.01) balance = Math.round((balance - amount) * 100) / 100;
      txs.push({ date: new Date(current), description: profile.cardlessDesc(generateRefCode(rand, 10)), credit: 0, debit: amount, balance });
      balance = Math.round((balance + amount) * 100) / 100;
      txs.push({ date: new Date(current), description: `${profile.cardlessDesc(generateRefCode(rand, 10))} REVERSAL`, credit: amount, debit: 0, balance });
    }

    if (current.getDate() === 1) {
      const totalCreditsMonth = txs.filter(t => t.date.getMonth() === current.getMonth() && t.credit > 0).reduce((s, t) => s + t.credit, 0);
      if (totalCreditsMonth >= 2000) {
        txs.push({ date: new Date(current), description: profile.feeWaiverName, credit: 0, debit: 0, balance });
      } else {
        balance = Math.round((balance - profile.accountFee) * 100) / 100;
        txs.push({ date: new Date(current), description: profile.accountFeeName, credit: 0, debit: profile.accountFee, balance });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  const openingTx = txs.shift()!;
  const dayGroups = new Map<string, BankTransaction[]>();
  for (const tx of txs) {
    const key = new Date(tx.date).toISOString().split('T')[0];
    if (!dayGroups.has(key)) dayGroups.set(key, []);
    dayGroups.get(key)!.push(tx);
  }
  const sortedKeys = Array.from(dayGroups.keys()).sort();
  const shuffled: BankTransaction[] = [openingTx];
  for (const dk of sortedKeys) {
    const dayTxs = dayGroups.get(dk)!;
    for (let i = dayTxs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [dayTxs[i], dayTxs[j]] = [dayTxs[j], dayTxs[i]];
    }
    shuffled.push(...dayTxs);
  }
  txs.length = 0;
  txs.push(...shuffled);

  let recalcBal = bc.openingBalance;
  for (const tx of txs) {
    if (tx.description === 'OPENING BALANCE') { tx.balance = recalcBal; continue; }
    recalcBal = Math.round((recalcBal + tx.credit - tx.debit) * 100) / 100;
    tx.balance = recalcBal;
  }
  balance = recalcBal;

  const targetClosing = bc.closingBalance;
  const diff = Math.round((targetClosing - balance) * 100) / 100;
  if (Math.abs(diff) > 0.01) {
    const adjustable = txs.filter(t => t.description !== 'OPENING BALANCE' && (t.debit > 0 || t.credit > 0));
    if (adjustable.length > 0) {
      const perTx = diff / adjustable.length;
      let remaining = diff;
      for (let i = 0; i < adjustable.length; i++) {
        const tx = adjustable[i];
        const adj = i === adjustable.length - 1 ? remaining : Math.round((perTx + (rand() - 0.5) * Math.abs(perTx) * 0.4) * 100) / 100;
        if (tx.credit > 0) {
          tx.credit = Math.max(0.01, Math.round((tx.credit + adj) * 100) / 100);
        } else if (tx.debit > 0) {
          tx.debit = Math.max(0.01, Math.round((tx.debit - adj) * 100) / 100);
        }
        remaining = Math.round((remaining - adj) * 100) / 100;
      }
      let runBal = bc.openingBalance;
      for (const tx of txs) {
        if (tx.description === 'OPENING BALANCE') { tx.balance = runBal; continue; }
        runBal = Math.round((runBal + tx.credit - tx.debit) * 100) / 100;
        tx.balance = runBal;
      }
      balance = runBal;
    }
  }

  txs.push({ date: spanEnd, description: 'CLOSING BALANCE', credit: 0, debit: 0, balance: Math.round(balance * 100) / 100 });

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

  const bsbFormatted = bc.bsb.replace(/(\d{3})(\d{3})/, '$1-$2');
  console.log(`[${profile.bankName}Statement] Generated ${txs.length} transactions across ${pages.length} pages`);

  return {
    bankName: profile.bankFullName,
    accountHolder: bc.holderName.toUpperCase(),
    bsb: bsbFormatted,
    accountNumber: bc.accountNumber,
    statementPeriod: `${formatDate(spanStart)} - ${formatDate(spanEnd)}`,
    openingBalance: bc.openingBalance,
    closingBalance: bc.closingBalance,
    transactions: txs,
    pages,
  };
}
