export function validateABN(abn: string): boolean {
  const cleaned = abn.replace(/\s/g, '');
  if (cleaned.length !== 11 || !/^\d{11}$/.test(cleaned)) return false;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const digits = cleaned.split('').map(Number);
  digits[0] -= 1;
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  return sum % 89 === 0;
}

export function validateBSB(bsb: string): boolean {
  return /^\d{6}$/.test(bsb.replace(/-/g, ''));
}

export function validateAccountNumber(acc: string): boolean {
  return /^\d{6,10}$/.test(acc);
}

export function validateMemberID(id: string): boolean {
  return /^\d{6,12}$/.test(id);
}

export function validateEmployeeID(id: string): boolean {
  return /^[A-Za-z0-9]+$/.test(id);
}

export function isConfigValid(config: {
  employer: { name: string; abn: string };
  employee: { name: string; id: string };
  payConfig: { basis: string; annualSalary: number; hourlyRate: number; weeklyHours: number };
  superConfig: { fundName: string; memberID: string };
  bankConfig: { bsb: string; accountNumber: string };
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.employer.name.trim()) errors.push('Employer name required');
  if (!validateABN(config.employer.abn)) errors.push('Invalid ABN');
  if (!config.employee.name.trim()) errors.push('Employee name required');
  if (!validateEmployeeID(config.employee.id)) errors.push('Invalid Employee ID');

  if (config.payConfig.basis === 'salary') {
    if (config.payConfig.annualSalary <= 0) errors.push('Annual salary must be positive');
  } else {
    if (config.payConfig.hourlyRate <= 0) errors.push('Hourly rate must be positive');
    if (config.payConfig.weeklyHours <= 0) errors.push('Weekly hours must be positive');
  }

  if (!config.superConfig.fundName.trim()) errors.push('Super fund name required');
  if (!validateMemberID(config.superConfig.memberID)) errors.push('Invalid member ID');
  if (!validateBSB(config.bankConfig.bsb)) errors.push('Invalid BSB');
  if (!validateAccountNumber(config.bankConfig.accountNumber)) errors.push('Invalid account number');

  return { valid: errors.length === 0, errors };
}
