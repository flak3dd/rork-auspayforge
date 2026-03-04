import { HECS_BRACKETS_2025 } from '@/types/payroll';

export function calculatePAYGOnly(annualIncome: number): number {
  const brackets: { min: number; max: number; rate: number; base: number }[] = [
    { min: 0, max: 18200, rate: 0, base: 0 },
    { min: 18201, max: 45000, rate: 0.16, base: 0 },
    { min: 45001, max: 135000, rate: 0.30, base: 4288 },
    { min: 135001, max: 190000, rate: 0.37, base: 31288 },
    { min: 190001, max: Infinity, rate: 0.45, base: 51638 },
  ];

  let tax = 0;
  for (const bracket of brackets) {
    if (annualIncome >= bracket.min) {
      if (annualIncome <= bracket.max) {
        tax = bracket.base + (annualIncome - bracket.min) * bracket.rate;
        break;
      }
    }
  }
  return Math.floor(tax);
}

export function calculateMedicare(annualIncome: number): number {
  if (annualIncome <= 26000) return 0;
  if (annualIncome <= 32500) {
    return Math.round((annualIncome - 26000) * 0.10);
  }
  return Math.round(annualIncome * 0.02);
}

export function calculateHECS(annualIncome: number): number {
  for (const bracket of HECS_BRACKETS_2025) {
    if (annualIncome >= bracket.min && annualIncome <= bracket.max) {
      return Math.round(annualIncome * bracket.rate);
    }
  }
  return 0;
}

export function calculatePAYG(annualIncome: number): number {
  return calculatePAYGOnly(annualIncome) + calculateMedicare(annualIncome);
}

export function periodsPerYear(frequency: 'weekly' | 'fortnightly' | 'monthly'): number {
  switch (frequency) {
    case 'weekly': return 52;
    case 'fortnightly': return 26;
    case 'monthly': return 12;
  }
}

export function calculatePeriodTax(annualIncome: number, frequency: 'weekly' | 'fortnightly' | 'monthly'): number {
  const annualTax = calculatePAYG(annualIncome);
  return Math.round((annualTax / periodsPerYear(frequency)) * 100) / 100;
}

export function calculatePeriodPAYGOnly(annualIncome: number, frequency: 'weekly' | 'fortnightly' | 'monthly'): number {
  const annualTax = calculatePAYGOnly(annualIncome);
  return Math.round((annualTax / periodsPerYear(frequency)) * 100) / 100;
}

export function calculatePeriodMedicare(annualIncome: number, frequency: 'weekly' | 'fortnightly' | 'monthly'): number {
  const annualMedicare = calculateMedicare(annualIncome);
  return Math.round((annualMedicare / periodsPerYear(frequency)) * 100) / 100;
}

export function calculatePeriodHECS(annualIncome: number, frequency: 'weekly' | 'fortnightly' | 'monthly'): number {
  const annualHECS = calculateHECS(annualIncome);
  return Math.round((annualHECS / periodsPerYear(frequency)) * 100) / 100;
}
