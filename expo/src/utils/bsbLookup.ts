const BSB_RANGES: { prefix: string; bank: string; abbr: string }[] = [
  { prefix: '01', bank: 'Australia and New Zealand Banking Group', abbr: 'ANZ' },
  { prefix: '03', bank: 'Westpac Banking Corporation', abbr: 'Westpac' },
  { prefix: '06', bank: 'Commonwealth Bank of Australia', abbr: 'CommBank' },
  { prefix: '08', bank: 'National Australia Bank', abbr: 'NAB' },
  { prefix: '09', bank: 'Reserve Bank of Australia', abbr: 'RBA' },
  { prefix: '10', bank: 'BankSA (Westpac Group)', abbr: 'BankSA' },
  { prefix: '11', bank: 'St.George Bank (Westpac Group)', abbr: 'St.George' },
  { prefix: '12', bank: 'Bank of Queensland', abbr: 'BOQ' },
  { prefix: '13', bank: 'Westpac Banking Corporation', abbr: 'Westpac' },
  { prefix: '14', bank: 'ANZ Banking Group', abbr: 'ANZ' },
  { prefix: '15', bank: 'Town & Country Bank (Bendigo)', abbr: 'Bendigo' },
  { prefix: '17', bank: 'ANZ Banking Group', abbr: 'ANZ' },
  { prefix: '18', bank: 'Macquarie Bank', abbr: 'Macquarie' },
  { prefix: '19', bank: 'Bank of Melbourne (Westpac)', abbr: 'Bank of Melbourne' },
  { prefix: '21', bank: 'JP Morgan Chase', abbr: 'JPMorgan' },
  { prefix: '22', bank: 'BNP Paribas', abbr: 'BNP' },
  { prefix: '23', bank: 'Bank of America', abbr: 'BoA' },
  { prefix: '25', bank: 'BNP Paribas', abbr: 'BNP' },
  { prefix: '30', bank: 'Bankwest (CommBank Group)', abbr: 'Bankwest' },
  { prefix: '33', bank: 'St.George Bank', abbr: 'St.George' },
  { prefix: '34', bank: 'Westpac Banking Corporation', abbr: 'Westpac' },
  { prefix: '35', bank: 'ANZ Banking Group', abbr: 'ANZ' },
  { prefix: '40', bank: 'Commonwealth Bank', abbr: 'CommBank' },
  { prefix: '48', bank: 'Macquarie Bank', abbr: 'Macquarie' },
  { prefix: '51', bank: 'ING Bank', abbr: 'ING' },
  { prefix: '57', bank: 'HSBC Bank Australia', abbr: 'HSBC' },
  { prefix: '61', bank: 'Adelaide Bank (Bendigo)', abbr: 'Adelaide' },
  { prefix: '63', bank: 'Commonwealth Bank', abbr: 'CommBank' },
  { prefix: '73', bank: 'Suncorp-Metway', abbr: 'Suncorp' },
  { prefix: '76', bank: 'Commonwealth Bank', abbr: 'CommBank' },
  { prefix: '80', bank: 'Cuscal Limited', abbr: 'Cuscal' },
  { prefix: '81', bank: 'Cuscal Limited', abbr: 'Cuscal' },
  { prefix: '82', bank: 'National Australia Bank', abbr: 'NAB' },
  { prefix: '91', bank: 'Great Southern Bank', abbr: 'Great Southern' },
  { prefix: '92', bank: 'Indue Limited', abbr: 'Indue' },
  { prefix: '93', bank: 'Bank of Queensland', abbr: 'BOQ' },
];

export function lookupBSB(bsb: string): { bank: string; abbr: string } | null {
  const cleaned = bsb.replace(/-/g, '');
  if (cleaned.length < 2) return null;
  const prefix = cleaned.substring(0, 2);
  const match = BSB_RANGES.find(r => r.prefix === prefix);
  return match ? { bank: match.bank, abbr: match.abbr } : null;
}

export function formatBSB(bsb: string): string {
  const cleaned = bsb.replace(/\D/g, '');
  if (cleaned.length === 6) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
  }
  return bsb;
}
