export interface LoanParams {
  amount: number;
  interestRate: number;
  tenureMonths: number;
  extraPayment: number;
  monthlyBudget: number; // New field for Affordability Calculator
}

export interface AmortizationRow {
  month: number;
  openingBalance: number;
  emi: number;
  extraPayment: number;
  totalPayment: number;
  principalComponent: number;
  interestComponent: number;
  closingBalance: number;
}

export interface TenureComparisonPoint {
  tenureMonths: number;
  emi: number;
  totalInterest: number;
  totalPayment: number;
}

export interface AIAnalysis {
  advice: string;
  loading: boolean;
  error: string | null;
}

export interface PrepaymentScenario {
  label: string;
  extraAmount: number;
  newTenure: number;
  interestSaved: number;
  timeSavedMonths: number;
  totalPayment: number;
}