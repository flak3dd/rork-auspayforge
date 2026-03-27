import { faker } from '@faker-js/faker';
import seedrandom from 'seedrandom';
import { addDays, format, differenceInDays } from 'date-fns';
import { sample } from 'lodash';
import type { ForgeConfig } from './config';

export function generateStatement(config: ForgeConfig) {
  const rng = seedrandom(String(config.seed ?? Date.now()));
  faker.seed(Math.floor(rng() * 1e9));

  const [startStr, endStr] = config.statement_period.split(' - ');
  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  let balance = config.opening_balance;
  let txs: any[] = [];

  // Exact income sources logic from your Python
  config.income_sources.filter(s => s.enabled).forEach(source => {
    let current = new Date(startDate);
    const step = source.frequency === 'weekly' ? 7 : 14;
    while (current <= endDate) {
      const dayMatch = source.frequency === 'weekly' 
        ? current.getDay() === source.day_of_week 
        : source.day_of_month?.includes(current.getDate());
      if (dayMatch) {
        balance += source.amount;
        txs.push({
          date: format(current, 'dd/MM/yy'),
          desc: source.name,
          debit: '',
          credit: source.amount.toFixed(2),
          balance: balance.toFixed(2) + ' CR'
        });
      }
      current = addDays(current, step);
    }
  });

  // Spending to hit monthly target
  const days = differenceInDays(endDate, startDate) || 46;
  const dailySpend = config.monthly_spend_target / 30;
  for (let i = 0; i < days; i++) {
    if (rng() < 0.65) {
      const spend = dailySpend * (0.6 + rng() * 0.8);
      balance -= spend;
      txs.push({
        date: format(addDays(startDate, i), 'dd/MM/yy'),
        desc: sample(['WOOLWORTHS CABOOLTURE', 'COLES EXPRESS', 'BP CABOOLTURE', 'UBER EATS', 'TELSTRA', 'RENT PAY'])!,
        debit: spend.toFixed(2),
        credit: '',
        balance: balance.toFixed(2) + ' CR'
      });
    }
  }

  txs.sort((a, b) => a.date.localeCompare(b.date));
  if (txs.length) txs[txs.length - 1].balance = config.closing_balance.toFixed(2) + ' CR';

  return { ...config, transactions: txs };
}