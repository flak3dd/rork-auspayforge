export type PayFrequency = 'weekly' | 'fortnightly' | 'monthly';
export type PayBasis = 'salary' | 'hourly';
export type DeductionType = 'tax' | 'other';

export interface Employer {
  name: string;
  abn: string;
  address: string;
}

export interface Employee {
  name: string;
  id: string;
  address: string;
  classification: string;
  department: string;
}

export interface PayConfig {
  basis: PayBasis;
  annualSalary: number;
  hourlyRate: number;
  weeklyHours: number;
  frequency: PayFrequency;
  startDate: string;
}

export interface SuperConfig {
  fundName: string;
  memberID: string;
}

export interface Deduction {
  id: string;
  description: string;
  amountPerPeriod: number;
  type: DeductionType;
}

export interface Allowance {
  id: string;
  description: string;
  hours: number;
  multiplier: number;
  fixedAmount: number;
}

export type TransactionDensity = 'low' | 'medium' | 'high';

export interface BankConfig {
  bsb: string;
  accountNumber: string;
  holderName: string;
  openingBalance: number;
  closingBalance: number;
  statementStartDate: string;
  statementLength: 30 | 60 | 90;
  monthlySpendTarget: number;
  transactionDensity: TransactionDensity;
  includePension: boolean;
  includeATM: boolean;
  includeCardlessCash: boolean;
  includeTransfers: boolean;
  dailySpendMin: number;
  dailySpendMax: number;
  incomingTransferMin: number;
  incomingTransferMax: number;
}

export interface LeaveOverride {
  takenHoursAnnual: number;
  takenHoursPersonal: number;
}

export interface AppConfig {
  employer: Employer;
  employee: Employee;
  payConfig: PayConfig;
  superConfig: SuperConfig;
  deductions: Deduction[];
  allowances: Allowance[];
  bankConfig: BankConfig;
  leaveOverrides: LeaveOverride[];
}

export interface PayslipPeriod {
  index: number;
  startDate: Date;
  endDate: Date;
  paymentDate: Date;
}

export interface PayslipEarning {
  description: string;
  hours: number;
  rate: number;
  amount: number;
  ytd: number;
  type: string;
}

export interface PayslipDeduction {
  description: string;
  amount: number;
  ytd: number;
  type: DeductionType;
}

export interface PayslipLeave {
  type: string;
  accruedThisPeriod: number;
  takenThisPeriod: number;
  balance: number;
  ytdAccrued: number;
}

export interface Payslip {
  period: PayslipPeriod;
  employer: Employer;
  employee: Employee;
  earnings: PayslipEarning[];
  grossPay: number;
  ote: number;
  deductions: PayslipDeduction[];
  totalDeductions: number;
  netPay: number;
  superAmount: number;
  superYTD: number;
  leave: PayslipLeave[];
  bankAccount: string;
  paymentRef: string;
  annualRate: number;
  ytdGross: number;
  ytdNet: number;
  ytdTax: number;
}

export interface BankTransaction {
  date: Date;
  description: string;
  credit: number;
  debit: number;
  balance: number;
}

export interface BankStatement {
  bankName: string;
  accountHolder: string;
  bsb: string;
  accountNumber: string;
  statementPeriod: string;
  openingBalance: number;
  closingBalance: number;
  transactions: BankTransaction[];
  pages: BankTransaction[][];
}

export interface GeneratedOutput {
  payslips: Payslip[];
  bankStatement: BankStatement;
  generatedAt: Date;
}

export const DEFAULT_CONFIG: AppConfig = {
  employer: {
    name: 'XYZ Pty Ltd',
    abn: '51824753556',
    address: '123 Collins Street\nMelbourne VIC 3000',
  },
  employee: {
    name: 'Jane Smith',
    id: 'EMP001',
    address: '45 George Street\nSydney NSW 2000',
    classification: 'Software Engineer',
    department: 'Engineering',
  },
  payConfig: {
    basis: 'salary',
    annualSalary: 95000,
    hourlyRate: 51.78,
    weeklyHours: 38,
    frequency: 'fortnightly',
    startDate: new Date().toISOString().split('T')[0],
  },
  superConfig: {
    fundName: 'AustralianSuper',
    memberID: '1234567890',
  },
  deductions: [],
  allowances: [],
  bankConfig: {
    bsb: '062000',
    accountNumber: '12345678',
    holderName: 'Jane Smith',
    openingBalance: 200,
    closingBalance: 1000,
    statementStartDate: new Date().toISOString().split('T')[0],
    statementLength: 30,
    monthlySpendTarget: 2500,
    transactionDensity: 'medium',
    includePension: true,
    includeATM: true,
    includeCardlessCash: true,
    includeTransfers: true,
    dailySpendMin: 14,
    dailySpendMax: 154,
    incomingTransferMin: 50,
    incomingTransferMax: 560,
  },
  leaveOverrides: [
    { takenHoursAnnual: 0, takenHoursPersonal: 0 },
    { takenHoursAnnual: 0, takenHoursPersonal: 0 },
    { takenHoursAnnual: 0, takenHoursPersonal: 0 },
    { takenHoursAnnual: 0, takenHoursPersonal: 0 },
  ],
};

export const CLASSIFICATIONS = [
  'Software Engineer',
  'Accountant',
  'Admin Officer',
  'Project Manager',
  'Sales Representative',
  'Marketing Analyst',
  'HR Coordinator',
  'Data Analyst',
  'Operations Manager',
  'Custom',
];
