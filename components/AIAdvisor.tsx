import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, MessageSquareQuote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LoanParams } from '../types';
import { getLoanAdvice } from '../services/geminiService';

interface AIAdvisorProps {
  params: LoanParams;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ params }) => {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  // Reset fetched state when params change so user knows advice might be stale
  useEffect(() => {
    if (hasFetched && advice) {
       // Optional: We could auto-fetch or just indicate it's ready to update
    }
  }, [params]);

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    setLoading(true);
    const result = await getLoanAdvice(params);
    setAdvice(result);
    setLoading(false);
    setHasFetched(true);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="relative group rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200/50 overflow-hidden transition-all duration-300">
      
      {/* Header / Trigger */}
      <div 
        onClick={toggleOpen}
        className="cursor-pointer p-4 flex items-center justify-between text-white"
      >
        <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Sparkles size={18} className="text-indigo-100" />
            </div>
            <div>
                <h3 className="font-bold text-sm tracking-wide">AI Financial Advisor</h3>
                {!isOpen && !loading && (
                    <p className="text-[10px] text-indigo-100 opacity-80">Tap to analyze your loan scenario</p>
                )}
            </div>
        </div>
        <div className="flex items-center gap-2">
            {!hasFetched && !loading && isOpen && (
                <button 
                    onClick={handleAnalyze}
                    className="text-xs bg-white text-indigo-600 px-3 py-1.5 rounded-full font-bold shadow-sm hover:bg-indigo-50 active:scale-95 transition-all"
                >
                    Analyze Now
                </button>
            )}
            {isOpen ? <ChevronUp size={20} className="opacity-70" /> : <ChevronDown size={20} className="opacity-70" />}
        </div>
      </div>

      {/* Expandable Content */}
      <div className={`bg-white transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 border-t border-slate-100">
            
            {!hasFetched && !loading && (
                <div className="text-center py-4 space-y-3">
                    <p className="text-slate-500 text-sm">
                        Get personalized insights on your interest rate, tenure, and savings potential specifically for the Sri Lankan market.
                    </p>
                    <button 
                        onClick={handleAnalyze}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md active:scale-95 text-sm flex items-center justify-center gap-2"
                    >
                        <Sparkles size={14} />
                        Generate Analysis
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-8 text-indigo-600">
                    <Loader2 className="animate-spin mb-3" size={28} />
                    <span className="text-xs font-semibold animate-pulse uppercase tracking-wider">Analyzing Market Rates...</span>
                </div>
            )}

            {advice && !loading && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="prose prose-sm prose-slate text-slate-600 leading-relaxed mb-4">
                        <ReactMarkdown>{advice}</ReactMarkdown>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-50">
                        <button onClick={handleAnalyze} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                            <MessageSquareQuote size={14}/>
                            Refresh Advice
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;