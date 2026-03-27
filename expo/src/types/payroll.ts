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
  useExactPay?: boolean;
  exactPayPerPeriod?: number;
  numberOfPayslips?: number;
  includeHECS?: boolean;
  hecsDebt?: number;
  includeMedicareSeparate?: boolean;
  alignPayslipToStatement?: boolean;
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
export type StatementTemplate = 'commbank' | 'suncorp' | 'nab' | 'anz' | 'westpac';

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
  includeMortgageRent: boolean;
  mortgageRentAmount: number;
  mortgageRentLabel: 'mortgage' | 'rent';
  mortgageRentDay: number;
  mortgageRentTransactionName: string;
  dailySpendMin: number;
  dailySpendMax: number;
  incomingTransferMin: number;
  incomingTransferMax: number;
  debitCreditRatio: number;
  suburbs: [string, string, string];
  statementTemplate: StatementTemplate;
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
  superConfig: SuperConfig;
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

export interface SavedProfile {
  id: string;
  name: string;
  config: AppConfig;
  createdAt: string;
  updatedAt: string;
}

export const HECS_BRACKETS_2025: { min: number; max: number; rate: number }[] = [
  { min: 0, max: 54435, rate: 0 },
  { min: 54436, max: 62850, rate: 0.01 },
  { min: 62851, max: 66620, rate: 0.02 },
  { min: 66621, max: 70618, rate: 0.025 },
  { min: 70619, max: 74855, rate: 0.03 },
  { min: 74856, max: 79346, rate: 0.035 },
  { min: 79347, max: 84107, rate: 0.04 },
  { min: 84108, max: 89154, rate: 0.045 },
  { min: 89155, max: 94503, rate: 0.05 },
  { min: 94504, max: 100174, rate: 0.055 },
  { min: 100175, max: 106185, rate: 0.06 },
  { min: 106186, max: 112556, rate: 0.065 },
  { min: 112557, max: 119309, rate: 0.07 },
  { min: 119310, max: 126467, rate: 0.075 },
  { min: 126468, max: 134056, rate: 0.08 },
  { min: 134057, max: 142100, rate: 0.085 },
  { min: 142101, max: 150626, rate: 0.09 },
  { min: 150627, max: 159663, rate: 0.095 },
  { min: 159664, max: Infinity, rate: 0.10 },
];

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
    useExactPay: false,
    exactPayPerPeriod: 0,
    numberOfPayslips: 4,
    includeHECS: false,
    hecsDebt: 0,
    includeMedicareSeparate: false,
    alignPayslipToStatement: false,
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
    includeMortgageRent: false,
    mortgageRentAmount: 1800,
    mortgageRentLabel: 'mortgage',
    mortgageRentDay: 1,
    mortgageRentTransactionName: '',
    dailySpendMin: 14,
    dailySpendMax: 154,
    incomingTransferMin: 50,
    incomingTransferMax: 560,
    debitCreditRatio: 0.5,
    suburbs: ['CABOOLTURE', 'MORAYFIELD', 'BURPENGARY'],
    statementTemplate: 'commbank',
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
