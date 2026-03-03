import {
  AppConfig,
  Payslip,
  PayslipPeriod,
  PayslipEarning,
  PayslipDeduction,
  PayslipLeave,
} from '@/types/payroll';
import { calculatePeriodTax, periodsPerYear } from './tax';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function generatePeriods(config: AppConfig): PayslipPeriod[] {
  const periods: PayslipPeriod[] = [];
  let start = new Date(config.payConfig.startDate);

  for (let i = 0; i < 4; i++) {
    let end: Date;
    switch (config.payConfig.frequency) {
      case 'weekly':
        end = addDays(start, 6);
        break;
      case 'fortnightly':
        end = addDays(start, 13);
        break;
      case 'monthly':
        end = addDays(addMonths(start, 1), -1);
        break;
    }

    const paymentDate = addDays(end, 5);

    periods.push({ index: i, startDate: start, endDate: end, paymentDate });

    switch (config.payConfig.frequency) {
      case 'weekly':
        start = addDays(start, 7);
        break;
      case 'fortnightly':
        start = addDays(start, 14);
        break;
      case 'monthly':
        start = addMonths(start, 1);
        break;
    }
  }

  return periods;
}

export function generatePayslips(config: AppConfig): Payslip[] {
  const periods = generatePeriods(config);
  const ppy = periodsPerYear(config.payConfig.frequency);

  let ytdGross = 0;
  let ytdNet = 0;
  let ytdTax = 0;
  let ytdSuper = 0;
  const ytdEarnings: Record<string, number> = {};
  const ytdDeductions: Record<string, number> = {};
  let annualLeaveBalance = 0;
  let personalLeaveBalance = 0;
  let ytdAnnualAccrued = 0;
  let ytdPersonalAccrued = 0;

  const annualLeavePerPeriod = 152 / ppy;
  const personalLeavePerPeriod = 76 / ppy;

  const annualRate = config.payConfig.basis === 'salary'
    ? config.payConfig.annualSalary
    : config.payConfig.hourlyRate * config.payConfig.weeklyHours * 52;

  return periods.map((period, idx) => {
    const earnings: PayslipEarning[] = [];
    let gross = 0;
    let overtimeComponent = 0;

    if (config.payConfig.basis === 'salary') {
      const base = Math.round((config.payConfig.annualSalary / ppy) * 100) / 100;
      const key = 'Base Salary';
      ytdEarnings[key] = (ytdEarnings[key] || 0) + base;
      earnings.push({
        description: key,
        hours: config.payConfig.weeklyHours * (config.payConfig.frequency === 'weekly' ? 1 : config.payConfig.frequency === 'fortnightly' ? 2 : 4.33),
        rate: Math.round((config.payConfig.annualSalary / 52 / config.payConfig.weeklyHours) * 100) / 100,
        amount: base,
        ytd: ytdEarnings[key],
        type: 'ordinary',
      });
      gross += base;
    } else {
      const hoursMultiplier = config.payConfig.frequency === 'weekly' ? 1 : config.payConfig.frequency === 'fortnightly' ? 2 : 4.33;
      const hours = config.payConfig.weeklyHours * hoursMultiplier;
      const base = Math.round(config.payConfig.hourlyRate * hours * 100) / 100;
      const key = 'Ordinary Hours';
      ytdEarnings[key] = (ytdEarnings[key] || 0) + base;
      earnings.push({
        description: key,
        hours,
        rate: config.payConfig.hourlyRate,
        amount: base,
        ytd: ytdEarnings[key],
        type: 'ordinary',
      });
      gross += base;
    }

    for (const allowance of config.allowances) {
      let amount = allowance.fixedAmount;
      if (allowance.hours > 0 && config.payConfig.basis === 'hourly') {
        amount = allowance.hours * config.payConfig.hourlyRate * allowance.multiplier;
      }
      amount = Math.round(amount * 100) / 100;
      const key = allowance.description || 'Allowance';
      ytdEarnings[key] = (ytdEarnings[key] || 0) + amount;

      if (allowance.multiplier > 1) {
        overtimeComponent += amount;
      }

      earnings.push({
        description: key,
        hours: allowance.hours,
        rate: config.payConfig.basis === 'hourly' ? config.payConfig.hourlyRate * allowance.multiplier : 0,
        amount,
        ytd: ytdEarnings[key],
        type: allowance.multiplier > 1 ? 'overtime' : 'allowance',
      });
      gross += amount;
    }

    const ote = gross - overtimeComponent;

    const annualProjection = gross * ppy;
    const periodTax = calculatePeriodTax(annualProjection, config.payConfig.frequency);

    ytdTax += periodTax;

    const deductions: PayslipDeduction[] = [];
    let totalDeductions = periodTax;

    const taxKey = 'PAYG Withholding';
    ytdDeductions[taxKey] = (ytdDeductions[taxKey] || 0) + periodTax;
    deductions.push({
      description: taxKey,
      amount: periodTax,
      ytd: ytdDeductions[taxKey],
      type: 'tax',
    });

    for (const ded of config.deductions) {
      const key = ded.description || 'Deduction';
      ytdDeductions[key] = (ytdDeductions[key] || 0) + ded.amountPerPeriod;
      deductions.push({
        description: key,
        amount: ded.amountPerPeriod,
        ytd: ytdDeductions[key],
        type: ded.type,
      });
      totalDeductions += ded.amountPerPeriod;
    }

    const net = Math.round((gross - totalDeductions) * 100) / 100;

    const superAmount = Math.round(ote * 0.12 * 100) / 100;
    ytdSuper += superAmount;

    ytdGross += gross;
    ytdNet += net;

    const leaveOverride = config.leaveOverrides[idx] || { takenHoursAnnual: 0, takenHoursPersonal: 0 };

    annualLeaveBalance += annualLeavePerPeriod - leaveOverride.takenHoursAnnual;
    personalLeaveBalance += personalLeavePerPeriod - leaveOverride.takenHoursPersonal;
    ytdAnnualAccrued += annualLeavePerPeriod;
    ytdPersonalAccrued += personalLeavePerPeriod;

    const leave: PayslipLeave[] = [
      {
        type: 'Annual Leave',
        accruedThisPeriod: Math.round(annualLeavePerPeriod * 100) / 100,
        takenThisPeriod: leaveOverride.takenHoursAnnual,
        balance: Math.round(annualLeaveBalance * 100) / 100,
        ytdAccrued: Math.round(ytdAnnualAccrued * 100) / 100,
      },
      {
        type: 'Personal Leave',
        accruedThisPeriod: Math.round(personalLeavePerPeriod * 100) / 100,
        takenThisPeriod: leaveOverride.takenHoursPersonal,
        balance: Math.round(personalLeaveBalance * 100) / 100,
        ytdAccrued: Math.round(ytdPersonalAccrued * 100) / 100,
      },
    ];

    const bsbFormatted = config.bankConfig.bsb.replace(/(\d{3})(\d{3})/, '$1-$2');
    const paymentRef = `PAY${String(idx + 1).padStart(3, '0')}-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    return {
      period,
      employer: config.employer,
      employee: config.employee,
      earnings,
      grossPay: Math.round(gross * 100) / 100,
      ote: Math.round(ote * 100) / 100,
      deductions,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netPay: net,
      superAmount,
      superYTD: Math.round(ytdSuper * 100) / 100,
      leave,
      bankAccount: `${bsbFormatted} ${config.bankConfig.accountNumber}`,
      paymentRef,
      annualRate: Math.round(annualRate * 100) / 100,
      ytdGross: Math.round(ytdGross * 100) / 100,
      ytdNet: Math.round(ytdNet * 100) / 100,
      ytdTax: Math.round(ytdTax * 100) / 100,
    };
  });
}
