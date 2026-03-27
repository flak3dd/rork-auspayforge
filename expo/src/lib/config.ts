export interface IncomeSource {
  name: string;
  amount: number;
  frequency: 'weekly' | 'fortnightly';
  day_of_week?: number;
  day_of_month?: number[];
  enabled: boolean;
}

export interface ForgeConfig {
  account_number: string;
  account_holder: string;
  display_name: string;
  address: string;
  opening_balance: number;
  closing_balance: number;
  statement_period: string;
  total_pages: number;
  enquiries: string;
  reference: string;
  income_sources: IncomeSource[];
  monthly_spend_target: number;
  realismPreset: 'low' | 'medium' | 'high' | 'very-high';
  seed?: number;
}

export const DEFAULT_CONFIG: ForgeConfig = {
  account_number: "06 3097 3865 4102",
  account_holder: "SHELAM DRIVIS LEE SANDFORD",
  display_name: "MR SD SANDFORD",
  address: "UNIT 4 14-16 TORRENS RD<br>CABOOLTURE SOUTH QLD 4510",
  opening_balance: 189.18,
  closing_balance: 360.93,
  statement_period: "2 Feb 2025 - 20 Mar 2025",
  total_pages: 16,
  enquiries: "13 2221",
  reference: "036",
  income_sources: [
    { name: "WAGE JOHN HOLLAND", amount: 1200.00, frequency: "weekly", day_of_week: 5, enabled: true },
    { name: "PENSION", amount: 950.00, frequency: "fortnightly", day_of_month: [8, 22], enabled: true }
  ],
  monthly_spend_target: 2500.00,
  realismPreset: 'medium',
  seed: Date.now()
};