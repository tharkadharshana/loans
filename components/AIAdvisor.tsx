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

  // When params change heavily, we might want to reset, but let's keep it manual to avoid spamming API
  useEffect(() => {
     // Optional: Reset advice if critical params change drastically? 
     // For now, keeping user in control.
  }, [params.amount]);

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) setIsOpen(true); // Open if closed
    setLoading(true);
    const result = await getLoanAdvice(params);
    setAdvice(result);
    setLoading(false);
    setHasFetched(true);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      
      {/* Header / Trigger */}
      <div 
        onClick={toggleOpen}
        className="cursor-pointer p-4 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white transition-all hover:brightness-110"
      >
        <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <Sparkles size={16} className="text-indigo-50" />
            </div>
            <div>
                <h3 className="font-bold text-sm tracking-wide">AI Financial Advisor</h3>
                {!isOpen && !loading && !hasFetched && (
                     <p className="text-[10px] text-indigo-100 opacity-90 font-medium">Get smart insights for this loan</p>
                )}
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            {/* If closed and not fetched, show 'Analyze' button directly in header */}
            {!isOpen && !hasFetched && !loading && (
                 <button 
                    onClick={handleAnalyze}
                    className="text-[10px] bg-white text-indigo-700 px-3 py-1 rounded-full font-bold shadow-sm hover:bg-indigo-50"
                >
                    Analyze
                </button>
            )}
            {isOpen ? <ChevronUp size={18} className="opacity-80" /> : <ChevronDown size={18} className="opacity-80" />}
        </div>
      </div>

      {/* Expandable Content */}
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5">
            
            {!hasFetched && !loading && (
                <div className="text-center py-2 space-y-3">
                    <p className="text-slate-500 text-xs leading-relaxed">
                        Tap below to generate a personalized analysis of your loan scenario using Gemini AI. 
                        We'll check if your rate is fair and suggest optimization tips.
                    </p>
                    <button 
                        onClick={handleAnalyze}
                        className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-2 rounded-xl transition-all border border-slate-200 text-sm flex items-center justify-center gap-2"
                    >
                        <Sparkles size={14} className="text-purple-600" />
                        Generate Analysis
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-6 text-indigo-600">
                    <Loader2 className="animate-spin mb-2" size={24} />
                    <span className="text-xs font-semibold animate-pulse uppercase tracking-wider">Analyzing...</span>
                </div>
            )}

            {advice && !loading && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="prose prose-sm prose-slate text-slate-600 leading-relaxed text-xs mb-3">
                        <ReactMarkdown>{advice}</ReactMarkdown>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-50">
                        <button onClick={handleAnalyze} className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
                            <MessageSquareQuote size={12}/>
                            Regenerate
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