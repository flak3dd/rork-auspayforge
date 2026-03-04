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

    const paymentDate = addDays(end, config.payConfig.frequency === 'weekly' ? 3 : 5);

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

function getFYStart(referenceDate: Date): Date {
  const year = referenceDate.getMonth() >= 6 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1;
  return new Date(year, 6, 1);
}

function countPriorPeriods(fyStart: Date, firstPeriodStart: Date, frequency: 'weekly' | 'fortnightly' | 'monthly'): number {
  const diffMs = firstPeriodStart.getTime() - fyStart.getTime();
  if (diffMs <= 0) return 0;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  switch (frequency) {
    case 'weekly': return Math.floor(diffDays / 7);
    case 'fortnightly': return Math.floor(diffDays / 14);
    case 'monthly': {
      let months = (firstPeriodStart.getFullYear() - fyStart.getFullYear()) * 12 + (firstPeriodStart.getMonth() - fyStart.getMonth());
      if (firstPeriodStart.getDate() < fyStart.getDate()) months--;
      return Math.max(0, months);
    }
  }
}

export function generatePayslips(config: AppConfig): Payslip[] {
  const periods = generatePeriods(config);
  const ppy = periodsPerYear(config.payConfig.frequency);

  const annualLeavePerPeriod = 152 / ppy;
  const personalLeavePerPeriod = 76 / ppy;
  const lslPerPeriod = Math.round((6.0769 / ppy) * 100) / 100;

  const firstPeriodStart = new Date(config.payConfig.startDate);
  const fyStart = getFYStart(firstPeriodStart);
  const priorPeriods = countPriorPeriods(fyStart, firstPeriodStart, config.payConfig.frequency);

  const annualRate = config.payConfig.basis === 'salary'
    ? config.payConfig.annualSalary
    : config.payConfig.hourlyRate * config.payConfig.weeklyHours * 52;

  let priorGrossPerPeriod = 0;
  if (config.payConfig.useExactPay && config.payConfig.exactPayPerPeriod > 0) {
    priorGrossPerPeriod = Math.round(config.payConfig.exactPayPerPeriod * 100) / 100;
  } else if (config.payConfig.basis === 'salary') {
    priorGrossPerPeriod = Math.round((config.payConfig.annualSalary / ppy) * 100) / 100;
  } else {
    const hoursMultiplier = config.payConfig.frequency === 'weekly' ? 1 : config.payConfig.frequency === 'fortnightly' ? 2 : 4.33;
    const hours = config.payConfig.weeklyHours * hoursMultiplier;
    priorGrossPerPeriod = Math.round(config.payConfig.hourlyRate * hours * 100) / 100;
  }

  let priorAllowancesPerPeriod = 0;
  let priorOvertimePerPeriod = 0;
  for (const allowance of config.allowances) {
    let amount = allowance.fixedAmount;
    if (allowance.hours > 0 && config.payConfig.basis === 'hourly') {
      amount = allowance.hours * config.payConfig.hourlyRate * allowance.multiplier;
    }
    amount = Math.round(amount * 100) / 100;
    priorAllowancesPerPeriod += amount;
    if (allowance.multiplier > 1) {
      priorOvertimePerPeriod += amount;
    }
  }
  priorGrossPerPeriod += priorAllowancesPerPeriod;

  const priorOtePerPeriod = priorGrossPerPeriod - priorOvertimePerPeriod;
  const priorAnnualProjection = priorGrossPerPeriod * ppy;
  const priorTaxPerPeriod = calculatePeriodTax(priorAnnualProjection, config.payConfig.frequency);
  const priorSuperPerPeriod = Math.round(priorOtePerPeriod * 0.115 * 100) / 100;

  let priorDeductionsPerPeriod = priorTaxPerPeriod;
  for (const ded of config.deductions) {
    priorDeductionsPerPeriod += ded.amountPerPeriod;
  }
  const priorNetPerPeriod = Math.round((priorGrossPerPeriod - priorDeductionsPerPeriod) * 100) / 100;

  let ytdGross = Math.round(priorGrossPerPeriod * priorPeriods * 100) / 100;
  let ytdNet = Math.round(priorNetPerPeriod * priorPeriods * 100) / 100;
  let ytdTax = Math.round(priorTaxPerPeriod * priorPeriods * 100) / 100;
  let ytdSuper = Math.round(priorSuperPerPeriod * priorPeriods * 100) / 100;
  const ytdEarnings: Record<string, number> = {};
  const ytdDeductions: Record<string, number> = {};

  const baseKey = config.payConfig.basis === 'salary' ? 'Base Salary' : 'Ordinary Hours';
  const priorBasePerPeriod = priorGrossPerPeriod - priorAllowancesPerPeriod;
  ytdEarnings[baseKey] = Math.round(priorBasePerPeriod * priorPeriods * 100) / 100;

  for (const allowance of config.allowances) {
    let amount = allowance.fixedAmount;
    if (allowance.hours > 0 && config.payConfig.basis === 'hourly') {
      amount = allowance.hours * config.payConfig.hourlyRate * allowance.multiplier;
    }
    amount = Math.round(amount * 100) / 100;
    const key = allowance.description || 'Allowance';
    ytdEarnings[key] = Math.round(amount * priorPeriods * 100) / 100;
  }

  const taxKey = 'PAYG Withholding';
  ytdDeductions[taxKey] = Math.round(priorTaxPerPeriod * priorPeriods * 100) / 100;
  for (const ded of config.deductions) {
    const key = ded.description || 'Deduction';
    ytdDeductions[key] = Math.round(ded.amountPerPeriod * priorPeriods * 100) / 100;
  }

  let annualLeaveBalance = Math.round(annualLeavePerPeriod * priorPeriods * 100) / 100;
  let personalLeaveBalance = Math.round(personalLeavePerPeriod * priorPeriods * 100) / 100;
  let longServiceLeaveBalance = Math.round(lslPerPeriod * priorPeriods * 100) / 100;
  let ytdAnnualAccrued = annualLeaveBalance;
  let ytdPersonalAccrued = personalLeaveBalance;
  let ytdLSLAccrued = longServiceLeaveBalance;

  console.log('[Payslip] FY start:', fyStart.toISOString(), 'Prior periods:', priorPeriods);

  return periods.map((period, idx) => {
    const earnings: PayslipEarning[] = [];
    let gross = 0;
    let overtimeComponent = 0;

    if (config.payConfig.useExactPay && config.payConfig.exactPayPerPeriod > 0) {
      const base = Math.round(config.payConfig.exactPayPerPeriod * 100) / 100;
      const hoursMultiplier = config.payConfig.frequency === 'weekly' ? 1 : config.payConfig.frequency === 'fortnightly' ? 2 : 4.33;
      const hours = config.payConfig.weeklyHours * hoursMultiplier;
      const impliedRate = Math.round((base / hours) * 100) / 100;
      const key = config.payConfig.basis === 'salary' ? 'Base Salary' : 'Ordinary Hours';
      ytdEarnings[key] = (ytdEarnings[key] || 0) + base;
      earnings.push({
        description: key,
        hours,
        rate: impliedRate,
        amount: base,
        ytd: ytdEarnings[key],
        type: 'ordinary',
      });
      gross += base;
    } else if (config.payConfig.basis === 'salary') {
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

    const superAmount = Math.round(ote * 0.115 * 100) / 100;
    ytdSuper += superAmount;

    ytdGross += gross;
    ytdNet += net;

    const leaveOverride = config.leaveOverrides[idx] || { takenHoursAnnual: 0, takenHoursPersonal: 0 };

    annualLeaveBalance += annualLeavePerPeriod - leaveOverride.takenHoursAnnual;
    personalLeaveBalance += personalLeavePerPeriod - leaveOverride.takenHoursPersonal;
    longServiceLeaveBalance += lslPerPeriod;
    ytdAnnualAccrued += annualLeavePerPeriod;
    ytdPersonalAccrued += personalLeavePerPeriod;
    ytdLSLAccrued += lslPerPeriod;

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
      {
        type: 'Long Service Leave',
        accruedThisPeriod: lslPerPeriod,
        takenThisPeriod: 0,
        balance: Math.round(longServiceLeaveBalance * 100) / 100,
        ytdAccrued: Math.round(ytdLSLAccrued * 100) / 100,
      },
    ];

    const bsbFormatted = config.bankConfig.bsb.replace(/(\d{3})(\d{3})/, '$1-$2');
    const payDateStr = new Date(period.paymentDate).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
    const paymentRef = `${payDateStr}-${String(idx + 1).padStart(3, '0')}`;

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
      superConfig: config.superConfig,
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
