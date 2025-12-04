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

  // Fee rate for extra payments (4% charge)
  const EXTRA_PAYMENT_FEE_RATE = 0.04; 

  // We loop until balance is effectively zero. 
  // Safety break at 2x tenure to prevent infinite loops in weird edge cases.
  while (balance > 10 && month <= scheduledMonths * 2) {
    const interest = balance * monthlyRate;
    let principalFromEmi = emi - interest;
    
    // Calculate effective principal reduction from extra payment (subtracting fee)
    const effectiveExtra = extraPayment * (1 - EXTRA_PAYMENT_FEE_RATE);
    
    // Total potential principal reduction this month
    const potentialPrincipalReduction = principalFromEmi + effectiveExtra;
    
    // Check if we can close the loan this month
    if (balance <= potentialPrincipalReduction) {
        // CLOSE THE LOAN
        let paymentMade = 0;
        let recordedEMI = 0;
        let recordedExtra = 0;
        let fee = 0;
        let principalComponent = balance;

        // Can the standard EMI portion cover the remaining balance?
        if (balance <= principalFromEmi) {
             // Yes, just pay remaining balance + interest. No extra payment needed, so no fee.
             paymentMade = balance + interest;
             recordedEMI = paymentMade;
             recordedExtra = 0;
             fee = 0;
        } else {
             // No, we need some extra payment to clear the balance.
             const principalNeededFromExtra = balance - principalFromEmi;
             
             // We need 'principalNeededFromExtra' to hit the principal.
             // Since fee is taken out, GrossExtra * (1 - rate) = NetExtra
             // So, GrossExtra = NetExtra / (1 - rate)
             const grossExtraNeeded = principalNeededFromExtra / (1 - EXTRA_PAYMENT_FEE_RATE);
             
             paymentMade = emi + grossExtraNeeded;
             recordedEMI = emi;
             recordedExtra = grossExtraNeeded;
             fee = grossExtraNeeded * EXTRA_PAYMENT_FEE_RATE;
        }

        schedule.push({
            month,
            openingBalance: balance,
            emi: recordedEMI,
            extraPayment: recordedExtra,
            fee: fee,
            totalPayment: paymentMade,
            principalComponent: principalComponent,
            interestComponent: interest,
            closingBalance: 0
        });
        balance = 0;
    } else {
        // NORMAL MONTH
        // We pay full EMI + Full Extra
        // Principal reduced = (EMI - Interest) + (Extra - Fee)
        const totalPrincipalPaid = principalFromEmi + effectiveExtra;
        const currentFee = extraPayment * EXTRA_PAYMENT_FEE_RATE;
        
        schedule.push({
            month,
            openingBalance: balance,
            emi: emi,
            extraPayment: extraPayment,
            fee: currentFee,
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