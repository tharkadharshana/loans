import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Wallet, TrendingUp, Calendar, Table2, Info, PiggyBank, Clock, Briefcase, ChevronRight, Calculator } from 'lucide-react';
import LoanControls from './components/LoanControls';
import SweetSpotChart from './components/SweetSpotChart';
import AIAdvisor from './components/AIAdvisor';
import AmortizationTable from './components/AmortizationTable';
import PrepaymentStrategy from './components/PrepaymentStrategy';
import { LoanParams } from './types';
import { calculateEMI, formatCurrency, generateAmortizationSchedule, generateSweetSpotData, calculateMaxLoanAmount, findOptimalTenureForBudget } from './services/loanUtils';

const App: React.FC = () => {
  const [params, setParams] = useState<LoanParams>({
    amount: 1000000,
    interestRate: 22,
    tenureMonths: 60,
    extraPayment: 0,
    monthlyBudget: 0, // Default 0 means disabled
  });

  const [isTableOpen, setIsTableOpen] = useState(false);

  // 1. Base Calculations (Standard EMI)
  const baseEmi = useMemo(() => calculateEMI(params.amount, params.interestRate, params.tenureMonths), [params.amount, params.interestRate, params.tenureMonths]);
  
  // 2. Generate Schedules
  // Baseline: No extra payment
  const baselineSchedule = useMemo(() => 
    generateAmortizationSchedule(params.amount, params.interestRate, params.tenureMonths, 0),
    [params.amount, params.interestRate, params.tenureMonths]
  );

  // Actual: With extra payment
  const actualSchedule = useMemo(() => 
    generateAmortizationSchedule(params.amount, params.interestRate, params.tenureMonths, params.extraPayment),
    [params]
  );

  // 3. Derived Metrics
  const baselineTotalInterest = baselineSchedule.reduce((sum, row) => sum + row.interestComponent, 0);
  const actualTotalInterest = actualSchedule.reduce((sum, row) => sum + row.interestComponent, 0);
  const actualTotalPayment = actualSchedule.reduce((sum, row) => sum + row.totalPayment, 0);
  
  const interestSaved = baselineTotalInterest - actualTotalInterest;
  const actualTenureMonths = actualSchedule.length;
  const timeSavedMonths = params.tenureMonths - actualTenureMonths;

  // Chart Data (Based on parameters, not extra payment simulation, to show the "Sweet Spot" curve)
  // We may need to extend the chart max months if the budget is very tight (requiring long tenure)
  const chartMaxMonths = useMemo(() => {
     if (params.monthlyBudget > 0) {
        // If budget is tight, ensure we look further out, up to 20 years
        return 240; 
     }
     return 120;
  }, [params.monthlyBudget]);

  const chartData = useMemo(() => generateSweetSpotData(params.amount, params.interestRate, 6, chartMaxMonths), [params.amount, params.interestRate, chartMaxMonths]);

  // --- NEW: Affordability Calculations ---
  
  // A. Borrowing Power: How much can I borrow at THIS tenure with THIS budget?
  const borrowingPower = useMemo(() => {
    if (params.monthlyBudget <= 0) return 0;
    return calculateMaxLoanAmount(params.monthlyBudget, params.interestRate, params.tenureMonths);
  }, [params.monthlyBudget, params.interestRate, params.tenureMonths]);

  // B. Budget Optimal Tenure: If I want THIS amount, what is the best tenure for my budget?
  const budgetOptimalTenure = useMemo(() => {
    if (params.monthlyBudget <= 0) return null;
    return findOptimalTenureForBudget(params.amount, params.interestRate, params.monthlyBudget);
  }, [params.amount, params.interestRate, params.monthlyBudget]);

  const applyBorrowingPower = () => {
      if (borrowingPower > 0) {
          // Round to nearest 10k
          const roundedAmount = Math.floor(borrowingPower / 10000) * 10000;
          setParams(prev => ({...prev, amount: roundedAmount}));
      }
  };

  const applyOptimalTenure = () => {
      if (budgetOptimalTenure) {
          setParams(prev => ({...prev, tenureMonths: budgetOptimalTenure}));
      }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 bg-grid-slate-100 font-sans text-slate-900 pb-24 md:pb-12 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
               <LayoutDashboard className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                  Lankan<span className="text-indigo-600">Loan</span>
                </h1>
                <span className="text-xs font-medium text-slate-500 tracking-wide mt-0.5">Smart Financial Optimizer</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50/50 text-emerald-700 rounded-full border border-emerald-100/50 shadow-sm">
            <Info size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Reducing Balance Method</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls & AI */}
          <div className="lg:col-span-4 space-y-6">
            <LoanControls params={params} onChange={setParams} baseEmi={baseEmi} />
            
            {/* Savings Cards (Show only if extra payment is active) */}
            {params.extraPayment > 0 && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-600">
                             <PiggyBank size={60} />
                        </div>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Interest Saved</p>
                        <p className="text-xl font-bold text-emerald-700">{formatCurrency(interestSaved)}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-3 opacity-10 text-indigo-600">
                             <Clock size={60} />
                        </div>
                         <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-1">Time Saved</p>
                        <p className="text-xl font-bold text-indigo-700">
                            {Math.floor(timeSavedMonths / 12)}y {timeSavedMonths % 12}m
                        </p>
                    </div>
                </div>
            )}
            
            <AIAdvisor params={params} />
          </div>

          {/* Right Column: Visualization & Stats */}
          <div className="lg:col-span-8 space-y-6">

            {/* --- NEW: BORROWING POWER CARD --- */}
            {params.monthlyBudget > 0 && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-1 shadow-lg shadow-orange-200 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-white rounded-[20px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Borrowing Power</h3>
                                <p className="text-sm text-slate-500">
                                    With a budget of <span className="font-bold text-amber-600">{formatCurrency(params.monthlyBudget)}</span>...
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            {/* Option 1: Apply Max Loan Amount */}
                            <div className="flex-1 bg-amber-50 p-3 rounded-xl border border-amber-100 flex flex-col items-center text-center">
                                <span className="text-[10px] font-bold text-amber-600 uppercase">You can borrow up to</span>
                                <span className="text-xl font-bold text-slate-800 my-1">{formatCurrency(borrowingPower)}</span>
                                <button 
                                    onClick={applyBorrowingPower}
                                    className="text-[10px] bg-white border border-amber-200 text-amber-700 px-3 py-1 rounded-full font-bold hover:bg-amber-100 transition-colors"
                                >
                                    Apply Amount
                                </button>
                            </div>
                            
                            {/* Option 2: Suggest Best Tenure for current amount */}
                            {budgetOptimalTenure && budgetOptimalTenure !== params.tenureMonths && (
                                <div className="flex-1 bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex flex-col items-center text-center">
                                     <span className="text-[10px] font-bold text-indigo-600 uppercase">Best Tenure Fit</span>
                                     <span className="text-xl font-bold text-slate-800 my-1">{Math.floor(budgetOptimalTenure/12)}y {budgetOptimalTenure%12}m</span>
                                     <button 
                                        onClick={applyOptimalTenure}
                                        className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full font-bold hover:bg-indigo-100 transition-colors"
                                    >
                                        Optimize
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hero Metric: EMI */}
              <div className="sm:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-600 p-8 rounded-3xl shadow-xl shadow-indigo-200 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/3 -translate-y-1/3 group-hover:translate-x-1/4 transition-transform duration-500">
                    <Wallet size={200} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-indigo-100">
                            <Wallet size={20} />
                            <span className="text-sm font-semibold uppercase tracking-wider">Total Monthly Payment</span>
                        </div>
                        <div className="text-4xl sm:text-5xl font-bold tracking-tight">
                            {formatCurrency(baseEmi + params.extraPayment)}
                        </div>
                        {/* Budget Status Indicator */}
                        {params.monthlyBudget > 0 && (
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 ${baseEmi + params.extraPayment > params.monthlyBudget ? 'bg-rose-500/20 text-rose-100' : 'bg-emerald-500/20 text-emerald-100'}`}>
                                {baseEmi + params.extraPayment > params.monthlyBudget ? (
                                    <>
                                        <TrendingUp size={12} /> Exceeds Budget by {formatCurrency((baseEmi + params.extraPayment) - params.monthlyBudget)}
                                    </>
                                ) : (
                                    <>
                                        <PiggyBank size={12} /> Within Budget
                                    </>
                                )}
                            </div>
                        )}
                        {params.extraPayment > 0 && params.monthlyBudget === 0 && (
                            <div className="text-indigo-200 text-sm mt-1 font-medium">
                                (Base: {formatCurrency(baseEmi)} + Extra: {formatCurrency(params.extraPayment)})
                            </div>
                        )}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 text-xs font-medium">
                        Payoff in {actualTenureMonths} months
                    </div>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-rose-50 rounded-2xl text-rose-500">
                        <TrendingUp size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Interest</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(actualTotalInterest)}</div>
                <div className="text-xs font-medium text-slate-400 mt-1">
                    {(actualTotalInterest / params.amount * 100).toFixed(1)}% of Principal
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-slate-100 rounded-2xl text-slate-600">
                        <Calendar size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Cost</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(actualTotalPayment)}</div>
                <div className="text-xs font-medium text-slate-400 mt-1">Principal + Interest</div>
              </div>
            </div>

            {/* Chart */}
            <SweetSpotChart 
                data={chartData} 
                currentTenure={params.tenureMonths} 
                actualTenure={params.extraPayment > 0 ? actualTenureMonths : undefined}
                monthlyBudget={params.monthlyBudget}
                budgetOptimalTenure={budgetOptimalTenure}
                onSelectTenure={(months) => setParams(prev => ({...prev, tenureMonths: months}))}
            />

            {/* Prepayment Strategy - New Component */}
            <PrepaymentStrategy 
                params={params} 
                onApply={(extra) => setParams(p => ({...p, extraPayment: extra}))} 
            />

            {/* Action Block */}
            <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Deep Dive</h3>
                    <p className="text-sm text-slate-500">See exactly how every rupee is allocated each month.</p>
                </div>
                <button 
                    onClick={() => setIsTableOpen(true)}
                    className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-900 font-bold rounded-xl transition-all active:scale-95 w-full sm:w-auto justify-center"
                >
                    <Table2 size={20} />
                    View Full Schedule
                </button>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Mobile Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 p-4 lg:hidden z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Monthly</p>
                <p className="text-xl font-bold text-indigo-600">{formatCurrency(baseEmi + params.extraPayment)}</p>
            </div>
             <button 
                    onClick={() => setIsTableOpen(true)}
                    className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-300 active:scale-95 transition-transform"
                >
                    Details
            </button>
        </div>
      </div>

      <AmortizationTable 
        schedule={actualSchedule} 
        isOpen={isTableOpen} 
        onClose={() => setIsTableOpen(false)} 
      />
    </div>
  );
};

export default App;