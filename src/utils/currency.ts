export type Currency = 'USD' | 'BDT';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  exchangeRate: number; // Rate to USD
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    exchangeRate: 1,
  },
  BDT: {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    exchangeRate: 110, // 1 USD = 110 BDT (approximate)
  },
};

export const formatCurrency = (
  amount: number,
  currency: Currency = 'USD',
  showSymbol: boolean = true
): string => {
  const config = CURRENCIES[currency];
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return showSymbol ? `${config.symbol}${formattedAmount}` : formattedAmount;
};

export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = CURRENCIES[fromCurrency].exchangeRate;
  const toRate = CURRENCIES[toCurrency].exchangeRate;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
};

export const getCurrencySymbol = (currency: Currency): string => {
  return CURRENCIES[currency].symbol;
};

export const getCurrencyName = (currency: Currency): string => {
  return CURRENCIES[currency].name;
};

export const getAllCurrencies = (): CurrencyConfig[] => {
  return Object.values(CURRENCIES);
};