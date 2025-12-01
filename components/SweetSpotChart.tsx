import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  ReferenceArea
} from 'recharts';
import { TenureComparisonPoint } from '../types';
import { Target, MousePointerClick, TrendingDown } from 'lucide-react';
import { calculateEMI } from '../services/loanUtils';

interface SweetSpotChartProps {
  data: TenureComparisonPoint[];
  currentTenure: number;
  actualTenure?: number;
  monthlyBudget?: number;
  budgetOptimalTenure?: number | null;
  onSelectTenure?: (months: number) => void;
}

const CustomEmiDot = (props: any) => {
  const { cx, cy, payload, currentTenure } = props;
  if (payload.tenureMonths === currentTenure) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#4f46e5" stroke="#ffffff" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={12} fill="none" stroke="#4f46e5" strokeWidth={2} opacity={0.4} />
      </g>
    );
  }
  return null;
};

const CustomInterestDot = (props: any) => {
  const { cx, cy, payload, currentTenure } = props;
  if (payload.tenureMonths === currentTenure) {
    return (
      <circle cx={cx} cy={cy} r={5} fill="#f43f5e" stroke="#ffffff" strokeWidth={2} />
    );
  }
  return null;
};

const SweetSpotChart: React.FC<SweetSpotChartProps> = ({ 
    data, 
    currentTenure, 
    actualTenure, 
    monthlyBudget = 0,
    budgetOptimalTenure,
    onSelectTenure 
}) => {

  // 1. Calculate Min/Max for robust domain scaling
  const { minEmi, maxEmi, minInt, maxInt } = useMemo(() => {
    if (!data || data.length === 0) return { minEmi: 0, maxEmi: 0, minInt: 0, maxInt: 0 };
    const emis = data.map(d => d.emi);
    const ints = data.map(d => d.totalInterest);
    
    let maxE = Math.max(...emis);
    // If budget is set and higher than max EMI in current view, expand domain to show it? 
    // Usually budget is lower than max EMI (short tenure), but if budget is huge, we might want to see it.
    if (monthlyBudget > 0) {
        maxE = Math.max(maxE, monthlyBudget);
    }

    return {
      minEmi: Math.min(...emis),
      maxEmi: maxE,
      minInt: Math.min(...ints),
      maxInt: Math.max(...ints)
    };
  }, [data, monthlyBudget]);

  // 2. Define padded domains so the graph looks good and we can calculate visual intersection accurately
  const PADDING = 0.1; // 10% padding top/bottom
  const emiRange = maxEmi - minEmi;
  const intRange = maxInt - minInt;
  
  // Create domains that add breathing room
  const emiDomain = [Math.max(0, minEmi - emiRange * PADDING), maxEmi + emiRange * PADDING];
  const intDomain = [Math.max(0, minInt - intRange * PADDING), maxInt + intRange * PADDING];

  // 3. Find Intersection Tenure (Visual Crossing between EMI and Interest)
  const intersectionTenure = useMemo(() => {
    if (data.length < 2) return null;

    // We normalize values to 0-1 based on the calculated domains
    const normalize = (val: number, min: number, max: number) => (val - min) / (max - min);

    for (let i = 0; i < data.length - 1; i++) {
        const d1 = data[i];
        const d2 = data[i+1];

        // Get normalized Y positions for start and end of segment
        const nE1 = normalize(d1.emi, emiDomain[0], emiDomain[1]);
        const nI1 = normalize(d1.totalInterest, intDomain[0], intDomain[1]);
        
        const nE2 = normalize(d2.emi, emiDomain[0], emiDomain[1]);
        const nI2 = normalize(d2.totalInterest, intDomain[0], intDomain[1]);

        // Check difference (Diff = NormEMI - NormInt)
        const diff1 = nE1 - nI1;
        const diff2 = nE2 - nI2;

        // If signs differ, they crossed
        if (Math.sign(diff1) !== Math.sign(diff2)) {
            // Linear interpolation to find exact X
            const fraction = Math.abs(diff1) / (Math.abs(diff1) + Math.abs(diff2));
            return d1.tenureMonths + fraction * (d2.tenureMonths - d1.tenureMonths);
        }
    }
    return null;
  }, [data, emiDomain, intDomain]);

  const handleChartClick = (e: any) => {
    if (onSelectTenure && e && e.activeLabel) {
      onSelectTenure(Number(e.activeLabel));
    }
  };

  return (
    <div className="h-[500px] w-full bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col relative group">
      
      {/* Header with Smart Actions */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
            <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    Visual Optimization
                    <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MousePointerClick size={12} /> Click graph to select
                    </span>
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                    Trade-off: <span className="text-indigo-600 font-medium">EMI</span> vs <span className="text-rose-500 font-medium">Interest</span>
                </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
                {/* Budget Logic Action */}
                {monthlyBudget > 0 && budgetOptimalTenure && budgetOptimalTenure !== currentTenure && (
                     <button 
                        onClick={() => onSelectTenure && onSelectTenure(budgetOptimalTenure)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border border-amber-200 transition-colors animate-in fade-in zoom-in shadow-sm"
                    >
                        <TrendingDown size={14} />
                        Apply Budget Fit ({budgetOptimalTenure}m)
                    </button>
                )}

                {/* Sweet Spot Action */}
                {!monthlyBudget && intersectionTenure && (
                    <button 
                        onClick={() => onSelectTenure && onSelectTenure(Math.round(intersectionTenure))}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-colors animate-in fade-in zoom-in"
                    >
                        <Target size={14} />
                        Apply Sweet Spot ({Math.round(intersectionTenure)}m)
                    </button>
                )}
                
                {actualTenure && actualTenure < currentTenure && (
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100 animate-in fade-in zoom-in duration-300">
                        Payoff accelerated to {actualTenure}m
                    </div>
                )}
            </div>
      </div>
      
      <div className="flex-1 w-full min-h-0 cursor-crosshair">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            onClick={handleChartClick}
          >
            <defs>
              <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
              <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                 <line x1="0" y1="0" x2="0" y2="8" style={{stroke:'#f59e0b', strokeWidth:1, opacity: 0.2}} />
              </pattern>
            </defs>
            
            <XAxis 
              dataKey="tenureMonths" 
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 12, fill: '#94a3b8'}}
              dy={10}
              tickFormatter={(val) => `${val/12}y`}
              padding={{ left: 30, right: 30 }}
            />
            
            <YAxis 
              yAxisId="left"
              orientation="left" 
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
              tick={{fontSize: 12, fill: '#6366f1', fontWeight: 500}}
              width={40}
              domain={emiDomain}
              allowDataOverflow={false}
            />
            
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value/100000).toFixed(1)}L`}
              tick={{fontSize: 12, fill: '#f43f5e', fontWeight: 500}}
              width={40}
              domain={intDomain}
              allowDataOverflow={false}
            />

            <Tooltip 
              cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
              formatter={(value: number, name: string) => [
                  new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(value),
                  name === 'emi' ? 'Monthly Payment' : 'Total Interest'
              ]}
              labelFormatter={(label) => {
                const years = (Number(label) / 12).toFixed(1);
                return `${Number(label).toFixed(0)} Months (${years} Years)`;
              }}
              contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                  borderRadius: '16px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  padding: '12px 16px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px'
              }}
            />

            {/* --- BUDGET VISUALIZATION START --- */}
            {monthlyBudget > 0 && (
                <>
                    {/* The Line */}
                    <ReferenceLine
                        y={monthlyBudget}
                        yAxisId="left"
                        stroke="#f59e0b"
                        strokeDasharray="5 2"
                        strokeWidth={2}
                        ifOverflow="extendDomain"
                    >
                        <Label 
                            value={`Max Budget: ${(monthlyBudget/1000).toFixed(1)}k`} 
                            position="insideTopRight"
                            fill="#d97706"
                            fontSize={11}
                            fontWeight="bold"
                            className="bg-white/90"
                        />
                    </ReferenceLine>
                    
                    {/* The Unaffordable Zone (Area above budget line) */}
                    {/* Since Recharts doesn't strictly do 'Area Above', we can approximate or just rely on the line. 
                        Better: Shade the ReferenceArea where Tenure results in EMI > Budget. 
                        Usually EMI > Budget happens at LOW Tenure (Left side).
                        We can find the tenure where EMI crosses Budget.
                    */}
                    {budgetOptimalTenure && (
                         <ReferenceArea 
                            x1={data[0].tenureMonths} 
                            x2={budgetOptimalTenure} 
                            yAxisId="left"
                            fill="url(#diagonalHatch)"
                            ifOverflow='hidden'
                         >
                            <Label 
                                value="Unaffordable"
                                position="center"
                                fill="#d97706"
                                opacity={0.5}
                                angle={-45}
                                fontSize={14}
                                fontWeight="bold"
                            />
                         </ReferenceArea>
                    )}

                    {/* The Budget Optimal Point */}
                    {budgetOptimalTenure && (
                        <ReferenceLine 
                            x={budgetOptimalTenure}
                            yAxisId="left"
                            stroke="#f59e0b"
                            strokeWidth={1}
                            strokeDasharray="2 2"
                        >
                            <Label 
                                value="Best Fit"
                                position="insideBottom"
                                fill="#d97706"
                                fontSize={10}
                                fontWeight="bold"
                                offset={10}
                            />
                        </ReferenceLine>
                    )}
                </>
            )}
            {/* --- BUDGET VISUALIZATION END --- */}
            
            {/* Visual Equilibrium Intersection (Original Sweet Spot) - Only show if Budget is not overriding logic */}
            {(!monthlyBudget && intersectionTenure) && (
                <ReferenceLine 
                    x={intersectionTenure} 
                    stroke="#8b5cf6" 
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    yAxisId="left"
                    ifOverflow="extendDomain"
                >
                   <Label 
                      value={`Sweet Spot: ${Math.round(intersectionTenure)}m`}
                      position="insideTop"
                      fill="#8b5cf6"
                      fontSize={11}
                      fontWeight="bold"
                      offset={10}
                      className="bg-white/80 backdrop-blur-sm"
                   />
                </ReferenceLine>
            )}

            {/* User Selected Tenure */}
            <ReferenceLine 
                x={currentTenure} 
                stroke="#cbd5e1" 
                strokeDasharray="3 3" 
                yAxisId="left" 
            >
                <Label 
                    value="Selected" 
                    position="insideTopLeft" 
                    fill="#94a3b8" 
                    fontSize={10} 
                    fontWeight="bold" 
                    offset={10}
                />
            </ReferenceLine>

            {/* Actual Payoff Reference (Green) */}
            {actualTenure && actualTenure < currentTenure && (
                 <ReferenceLine 
                    x={actualTenure} 
                    stroke="#10b981" 
                    strokeDasharray="4 2" 
                    yAxisId="left"
                    strokeWidth={2}
                 >
                    <Label 
                        value="Actual Payoff" 
                        position="insideTopRight" 
                        fill="#10b981" 
                        fontSize={10} 
                        fontWeight="bold" 
                        offset={10}
                    />
                 </ReferenceLine>
            )}

            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="totalInterest" 
              fill="url(#colorInterest)" 
              stroke="#f43f5e" 
              strokeWidth={3}
              name="Total Interest Cost"
              animationDuration={500}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
              dot={(props) => <CustomInterestDot {...props} currentTenure={currentTenure} />}
            />
            
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="emi" 
              stroke="#4f46e5" 
              strokeWidth={4}
              dot={(props) => <CustomEmiDot {...props} currentTenure={currentTenure} />}
              activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5' }}
              name="Monthly EMI"
              animationDuration={500}
            />
            
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SweetSpotChart;