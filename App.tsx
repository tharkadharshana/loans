import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Wallet, TrendingUp, Calendar, Table2, Info, PiggyBank, Clock } from 'lucide-react';
import LoanControls from './components/LoanControls';
import SweetSpotChart from './components/SweetSpotChart';
import AIAdvisor from './components/AIAdvisor';
import AmortizationTable from './components/AmortizationTable';
import { LoanParams } from './types';
import { calculateEMI, formatCurrency, generateAmortizationSchedule, generateSweetSpotData } from './services/loanUtils';

const App: React.FC = () => {
  const [params, setParams] = useState<LoanParams>({
    amount: 1000000,
    interestRate: 22,
    tenureMonths: 60,
    extraPayment: 0,
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
  const chartData = useMemo(() => generateSweetSpotData(params.amount, params.interestRate), [params.amount, params.interestRate]);

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
            <AIAdvisor params={params} />
            
            {/* Savings Cards (Show only if extra payment is active) */}
            {params.extraPayment > 0 && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-4 rounded-2xl shadow-lg shadow-emerald-100 border border-emerald-100">
                        <div className="bg-emerald-100 w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 mb-2">
                            <PiggyBank size={18} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Interest Saved</p>
                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(interestSaved)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-lg shadow-indigo-100 border border-indigo-100">
                        <div className="bg-indigo-100 w-8 h-8 flex items-center justify-center rounded-lg text-indigo-600 mb-2">
                            <Clock size={18} />
                        </div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time Saved</p>
                        <p className="text-lg font-bold text-indigo-600">
                            {Math.floor(timeSavedMonths / 12)}y {timeSavedMonths % 12}m
                        </p>
                    </div>
                </div>
            )}
          </div>

          {/* Right Column: Visualization & Stats */}
          <div className="lg:col-span-8 space-y-6">
            
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
                        {params.extraPayment > 0 && (
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
                <div className="text-xs font-medium text-slate-400 mt-1">{(actualTotalInterest / params.amount * 100).toFixed(1)}% of Principal</div>
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