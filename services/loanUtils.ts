import { AmortizationRow, TenureComparisonPoint, PrepaymentScenario } from "../types";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateEMI = (principal: number, annualRate: number, months: number): number => {
  if (months <= 0) return 0;
  if (annualRate === 0) return principal / months;

  const monthlyRate = annualRate / 12 / 100;
  // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  
  return numerator / denominator;
};

// New: Calculate how much one can borrow based on max EMI (Budget)
export const calculateMaxLoanAmount = (budget: number, annualRate: number, months: number): number => {
  if (months <= 0 || budget <= 0) return 0;
  if (annualRate === 0) return budget * months;

  const monthlyRate = annualRate / 12 / 100;
  // Formula derived from EMI: P = E * ((1+r)^n - 1) / (r * (1+r)^n)
  const numerator = Math.pow(1 + monthlyRate, months) - 1;
  const denominator = monthlyRate * Math.pow(1 + monthlyRate, months);
  
  return budget * (numerator / denominator);
};

// New: Find the shortest tenure (lowest interest) where EMI fits the budget
export const findOptimalTenureForBudget = (
    principal: number, 
    annualRate: number, 
    budget: number
): number | null => {
    if (budget <= 0) return null;
    
    // We search from 6 months up to 360 months (30 years) to find the "Sweet Spot"
    // We want the smallest months where EMI <= budget
    for (let m = 6; m <= 360; m++) {
        const emi = calculateEMI(principal, annualRate, m);
        if (emi <= budget) {
            return m;
        }
    }
    return null; // Budget is too low even for 30 years
};

export const generateAmortizationSchedule = (
  principal: number,
  annualRate: number,
  scheduledMonths: number,
  extraPayment: number = 0
): AmortizationRow[] => {
  const emi = calculateEMI(principal, annualRate, scheduledMonths);
  const monthlyRate = annualRate / 12 / 100;
  let balance = principal;
  const schedule: AmortizationRow[] = [];
  let month = 1;

  // We loop until balance is effectively zero. 
  // Safety break at 2x tenure to prevent infinite loops in weird edge cases.
  while (balance > 10 && month <= scheduledMonths * 2) {
    const interest = balance * monthlyRate;
    let principalFromEmi = emi - interest;
    
    // Total monthly outflow capability
    const maxMonthlyPayment = emi + extraPayment;
    
    // Check if we can close the loan this month
    // We need to pay: Current Balance + Interest for this month
    const amountToClose = balance + interest;

    if (amountToClose <= maxMonthlyPayment) {
        // CLOSE THE LOAN
        const paymentMade = amountToClose;
        const principalComponent = balance;
        // In this final month, the extra payment is whatever is needed above EMI, or 0 if EMI covers it.
        // Actually, we usually say we pay EMI + Extra. If that's too much, we just pay what's needed.
        // Let's breakdown strictly for table:
        
        // How much of the payment is "EMI" vs "Extra"?
        // Usually EMI is fixed. If amountToClose < EMI, we just pay amountToClose.
        // If amountToClose > EMI, the excess is "Extra".
        
        let recordedEMI = 0;
        let recordedExtra = 0;

        if (paymentMade <= emi) {
            recordedEMI = paymentMade;
            recordedExtra = 0;
        } else {
            recordedEMI = emi;
            recordedExtra = paymentMade - emi;
        }

        schedule.push({
            month,
            openingBalance: balance,
            emi: recordedEMI,
            extraPayment: recordedExtra,
            totalPayment: paymentMade,
            principalComponent: principalComponent,
            interestComponent: interest,
            closingBalance: 0
        });
        balance = 0;
    } else {
        // NORMAL MONTH
        // We pay full EMI + Full Extra
        // Principal reduced = (EMI - Interest) + Extra
        const totalPrincipalPaid = principalFromEmi + extraPayment;
        
        schedule.push({
            month,
            openingBalance: balance,
            emi: emi,
            extraPayment: extraPayment,
            totalPayment: emi + extraPayment,
            principalComponent: totalPrincipalPaid,
            interestComponent: interest,
            closingBalance: balance - totalPrincipalPaid
        });
        balance -= totalPrincipalPaid;
    }
    month++;
  }

  return schedule;
};

export const generateSweetSpotData = (
  principal: number,
  annualRate: number,
  minMonths: number = 6,
  maxMonths: number = 120 
): TenureComparisonPoint[] => {
  const data: TenureComparisonPoint[] = [];
  
  // Generate data points for every 6 months to keep chart clean
  for (let m = minMonths; m <= maxMonths; m += 6) {
    const emi = calculateEMI(principal, annualRate, m);
    const totalPayment = emi * m;
    const totalInterest = totalPayment - principal;

    data.push({
      tenureMonths: m,
      emi,
      totalInterest,
      totalPayment
    });
  }
  return data;
};

export const generatePrepaymentScenarios = (
    principal: number,
    annualRate: number,
    tenureMonths: number
): PrepaymentScenario[] => {
    // Baseline
    const baseSchedule = generateAmortizationSchedule(principal, annualRate, tenureMonths, 0);
    const baseTotalInterest = baseSchedule.reduce((sum, r) => sum + r.interestComponent, 0);
    const baseEmi = calculateEMI(principal, annualRate, tenureMonths);

    // Define scenarios based on EMI percentage
    // 1. Conservative: +10% of EMI (rounded to nearest 500)
    // 2. Balanced: +25% of EMI
    // 3. Aggressive: +50% of EMI
    
    const scenarios: { label: string, factor: number }[] = [
        { label: 'Conservative', factor: 0.10 },
        { label: 'Balanced', factor: 0.25 },
        { label: 'Aggressive', factor: 0.50 }
    ];

    return scenarios.map(sc => {
        let extra = baseEmi * sc.factor;
        // Round to clean number (e.g. 2341 -> 2500)
        extra = Math.ceil(extra / 500) * 500;

        const newSchedule = generateAmortizationSchedule(principal, annualRate, tenureMonths, extra);
        const newTotalInterest = newSchedule.reduce((sum, r) => sum + r.interestComponent, 0);
        const newTenure = newSchedule.length;

        return {
            label: sc.label,
            extraAmount: extra,
            newTenure: newTenure,
            interestSaved: baseTotalInterest - newTotalInterest,
            timeSavedMonths: tenureMonths - newTenure,
            totalPayment: principal + newTotalInterest
        };
    });
};