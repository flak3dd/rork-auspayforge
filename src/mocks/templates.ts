import { AppConfig } from '@/types/payroll';

export interface PayrollTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
  config: AppConfig;
}

export const TEMPLATES: PayrollTemplate[] = [
  {
    id: 'corporate-engineer',
    name: 'Corporate Engineer',
    description: 'Salaried software engineer at a mid-size tech company, fortnightly pay cycle',
    icon: 'Monitor',
    accent: '#2D7FF9',
    config: {
      employer: {
        name: 'Axiom Technologies Pty Ltd',
        abn: '51824753556',
        address: '88 Queen Street\nMelbourne VIC 3000',
      },
      employee: {
        name: 'Liam Patterson',
        id: 'AXT0412',
        address: '9/24 Flinders Lane\nMelbourne VIC 3000',
        classification: 'Software Engineer',
        department: 'Engineering',
      },
      payConfig: {
        basis: 'salary',
        annualSalary: 115000,
        hourlyRate: 51.78,
        weeklyHours: 38,
        frequency: 'fortnightly',
        startDate: '2025-07-01',
      },
      superConfig: {
        fundName: 'AustralianSuper',
        memberID: '9038471625',
      },
      deductions: [
        { id: 'sal-sac', description: 'Salary Sacrifice (Super)', amountPerPeriod: 200, type: 'other' },
      ],
      allowances: [],
      bankConfig: {
        bsb: '063021',
        accountNumber: '10482937',
        holderName: 'Liam Patterson',
        openingBalance: 3420.55,
        closingBalance: 4810.30,
      },
      leaveOverrides: [
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 7.6, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
      ],
    },
  },
  {
    id: 'retail-hourly',
    name: 'Retail Worker',
    description: 'Part-time hourly retail assistant with weekend penalty rates',
    icon: 'ShoppingBag',
    accent: '#FF6B6B',
    config: {
      employer: {
        name: 'Harbour Retail Group Pty Ltd',
        abn: '33127459820',
        address: '12 Pitt Street\nSydney NSW 2000',
      },
      employee: {
        name: 'Sophie Nguyen',
        id: 'HRG0287',
        address: '3/17 Crown Street\nSurry Hills NSW 2010',
        classification: 'Sales Representative',
        department: 'Retail Operations',
      },
      payConfig: {
        basis: 'hourly',
        annualSalary: 0,
        hourlyRate: 29.50,
        weeklyHours: 25,
        frequency: 'weekly',
        startDate: '2025-07-07',
      },
      superConfig: {
        fundName: 'REST Industry Super',
        memberID: '4059281736',
      },
      deductions: [],
      allowances: [
        { id: 'sat-pen', description: 'Saturday Penalty', hours: 4, multiplier: 1.5, fixedAmount: 0 },
        { id: 'sun-pen', description: 'Sunday Penalty', hours: 3, multiplier: 2, fixedAmount: 0 },
      ],
      bankConfig: {
        bsb: '082140',
        accountNumber: '55938201',
        holderName: 'Sophie Nguyen',
        openingBalance: 870.20,
        closingBalance: 1245.60,
      },
      leaveOverrides: [
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
      ],
    },
  },
  {
    id: 'construction-trade',
    name: 'Construction Trade',
    description: 'Full-time tradesperson with tool allowance and regular overtime',
    icon: 'Wrench',
    accent: '#FF9500',
    config: {
      employer: {
        name: 'BuildRight Construction Pty Ltd',
        abn: '62438917205',
        address: '440 Boundary Road\nRichlands QLD 4077',
      },
      employee: {
        name: 'Jake Morrison',
        id: 'BRC1059',
        address: '28 Samford Road\nLeichhardt QLD 4305',
        classification: 'Custom',
        department: 'Site Operations',
      },
      payConfig: {
        basis: 'hourly',
        annualSalary: 0,
        hourlyRate: 42.80,
        weeklyHours: 38,
        frequency: 'weekly',
        startDate: '2025-07-07',
      },
      superConfig: {
        fundName: 'Cbus Super',
        memberID: '7024816359',
      },
      deductions: [
        { id: 'union', description: 'CFMEU Union Fees', amountPerPeriod: 22.50, type: 'other' },
      ],
      allowances: [
        { id: 'tool', description: 'Tool Allowance', hours: 0, multiplier: 1, fixedAmount: 35 },
        { id: 'ot-reg', description: 'Regular Overtime', hours: 6, multiplier: 1.5, fixedAmount: 0 },
      ],
      bankConfig: {
        bsb: '034062',
        accountNumber: '29485710',
        holderName: 'Jake Morrison',
        openingBalance: 1580.00,
        closingBalance: 2320.45,
      },
      leaveOverrides: [
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 7.6 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
      ],
    },
  },
  {
    id: 'executive-monthly',
    name: 'Senior Executive',
    description: 'High-salary executive on monthly pay with novated lease deduction',
    icon: 'Briefcase',
    accent: '#8B5CF6',
    config: {
      employer: {
        name: 'Pacific Holdings Ltd',
        abn: '19876543210',
        address: 'Level 42, 200 George Street\nSydney NSW 2000',
      },
      employee: {
        name: 'Rebecca Chen',
        id: 'PHL0008',
        address: 'Penthouse 2, 88 Alfred Street\nMilsons Point NSW 2061',
        classification: 'Operations Manager',
        department: 'Executive Leadership',
      },
      payConfig: {
        basis: 'salary',
        annualSalary: 195000,
        hourlyRate: 0,
        weeklyHours: 38,
        frequency: 'monthly',
        startDate: '2025-07-01',
      },
      superConfig: {
        fundName: 'UniSuper',
        memberID: '3018624795',
      },
      deductions: [
        { id: 'novated', description: 'Novated Lease (Pre-Tax)', amountPerPeriod: 850, type: 'other' },
        { id: 'charity', description: 'Workplace Giving', amountPerPeriod: 50, type: 'other' },
      ],
      allowances: [
        { id: 'car', description: 'Car Allowance', hours: 0, multiplier: 1, fixedAmount: 400 },
      ],
      bankConfig: {
        bsb: '062000',
        accountNumber: '88012345',
        holderName: 'Rebecca Chen',
        openingBalance: 12450.00,
        closingBalance: 18920.75,
      },
      leaveOverrides: [
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 15.2, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 7.6 },
      ],
    },
  },
  {
    id: 'hospitality-casual',
    name: 'Hospitality Casual',
    description: 'Casual hospitality worker with loading, weekly pay',
    icon: 'UtensilsCrossed',
    accent: '#10B981',
    config: {
      employer: {
        name: 'Ember & Oak Restaurant Group',
        abn: '74219568301',
        address: '5 Caxton Street\nBrisbane QLD 4000',
      },
      employee: {
        name: 'Mia Thompson',
        id: 'EOR0194',
        address: '11/8 Vulture Street\nWoolloongabba QLD 4102',
        classification: 'Custom',
        department: 'Front of House',
      },
      payConfig: {
        basis: 'hourly',
        annualSalary: 0,
        hourlyRate: 27.91,
        weeklyHours: 20,
        frequency: 'weekly',
        startDate: '2025-07-07',
      },
      superConfig: {
        fundName: 'Hostplus',
        memberID: '6150928374',
      },
      deductions: [],
      allowances: [
        { id: 'casual-load', description: 'Casual Loading (25%)', hours: 0, multiplier: 1, fixedAmount: 139.55 },
      ],
      bankConfig: {
        bsb: '014210',
        accountNumber: '33920184',
        holderName: 'Mia Thompson',
        openingBalance: 245.00,
        closingBalance: 680.30,
      },
      leaveOverrides: [
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
      ],
    },
  },
  {
    id: 'admin-fortnightly',
    name: 'Office Admin',
    description: 'Salaried admin officer with HECS repayment, fortnightly pay',
    icon: 'FileText',
    accent: '#06B6D4',
    config: {
      employer: {
        name: 'Greenfield Council Services',
        abn: '85301746289',
        address: 'PO Box 400\nBallarat VIC 3350',
      },
      employee: {
        name: 'Daniel Kowalski',
        id: 'GCS0762',
        address: '18 Sturt Street\nBallarat Central VIC 3350',
        classification: 'Admin Officer',
        department: 'Customer Services',
      },
      payConfig: {
        basis: 'salary',
        annualSalary: 62000,
        hourlyRate: 0,
        weeklyHours: 38,
        frequency: 'fortnightly',
        startDate: '2025-07-14',
      },
      superConfig: {
        fundName: 'Vision Super',
        memberID: '5038291746',
      },
      deductions: [
        { id: 'hecs', description: 'HECS-HELP Repayment', amountPerPeriod: 95, type: 'tax' },
      ],
      allowances: [],
      bankConfig: {
        bsb: '013442',
        accountNumber: '47201839',
        holderName: 'Daniel Kowalski',
        openingBalance: 920.00,
        closingBalance: 1540.20,
      },
      leaveOverrides: [
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
        { takenHoursAnnual: 0, takenHoursPersonal: 0 },
      ],
    },
  },
];
