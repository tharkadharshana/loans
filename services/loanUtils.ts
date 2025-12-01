import { AmortizationRow, TenureComparisonPoint } from "../types";

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
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  
  return numerator / denominator;
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

  // We loop until balance is cleared or we hit a safety limit (e.g. 2x tenure)
  while (balance > 1 && month <= scheduledMonths * 2) {
    const interest = balance * monthlyRate;
    let principalComponent = emi - interest;
    
    // If principal component < 0, it means interest > emi (negative amortization), 
    // but for standard bank loans we assume EMI covers interest.
    
    // Calculate total potential payment this month
    let currentExtra = extraPayment;
    
    // Check if this payment clears the loan
    // Balance needed to close = balance
    // Payment covering interest + remaining balance
    if ((principalComponent + currentExtra) >= balance) {
       principalComponent = balance;
       currentExtra = Math.max(0, (balance + interest) - emi); // Adjust extra if needed, though strictly we just pay balance
       // Simpler: The last payment is Balance + Interest.
       // We record it as EMI (up to limit) + Extra.
       const finalPayment = balance + interest;
       const recordedEMI = Math.min(finalPayment, emi);
       const recordedExtra = Math.max(0, finalPayment - emi);
       
       schedule.push({
         month,
         openingBalance: balance,
         emi: recordedEMI,
         extraPayment: recordedExtra,
         totalPayment: finalPayment,
         principalComponent: balance,
         interestComponent: interest,
         closingBalance: 0
       });
       balance = 0;
    } else {
       // Normal month
       const totalPrincipalPaid = principalComponent + currentExtra;
       
       schedule.push({
         month,
         openingBalance: balance,
         emi,
         extraPayment: currentExtra,
         totalPayment: emi + currentExtra,
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