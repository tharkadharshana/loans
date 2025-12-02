import { GoogleGenAI } from "@google/genai";
import { LoanParams } from "../types";
import { calculateEMI, formatCurrency } from "./loanUtils";

// Initialize Gemini Client
// IMPORTANT: The API key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getLoanAdvice = async (params: LoanParams): Promise<string> => {
  const { amount, interestRate, tenureMonths, monthlyBudget } = params;
  const emi = calculateEMI(amount, interestRate, tenureMonths);
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - amount;

  const isOverBudget = monthlyBudget > 0 && emi > monthlyBudget;

  const prompt = `
    Context: I am a Sri Lankan user using a loan calculator based on the Reducing Balance Method used by banks like Commercial Bank, Sampath, HNB, etc.
    
    My Scenario:
    - Loan Amount: ${formatCurrency(amount)}
    - Interest Rate: ${interestRate}% (Annual)
    - Tenure: ${tenureMonths} months
    - Calculated EMI: ${formatCurrency(emi)}
    - My Monthly Budget: ${monthlyBudget > 0 ? formatCurrency(monthlyBudget) : "Not specified"}
    - Total Interest Payable: ${formatCurrency(totalInterest)}

    Task:
    Provide brief, friendly financial advice (max 3-4 sentences). 
    1. Comment on whether this interest rate is typical for current Sri Lankan personal loan market rates (usually 11%-26% range).
    2. ${isOverBudget 
         ? `CRITICAL: The EMI (${formatCurrency(emi)}) exceeds my budget (${formatCurrency(monthlyBudget)}). Strongly suggest increasing the tenure or reducing the loan amount.` 
         : `Highlight the trade-off: Suggest if slightly increasing the installment (shortening tenure) could save significant interest.`}
    3. Use "Rs." for currency.
    4. Format the output as a clean paragraph or bullet points using Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster simple response
      }
    });

    return response.text || "Could not generate advice at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to connect to the financial advisor right now. Please try again later.";
  }
};