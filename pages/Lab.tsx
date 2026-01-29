import React, { useState } from 'react';
import { Topic } from '../types';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const Lab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Topic>(Topic.MULTIPLICATION);
  
  // Multiplication State
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(4);

  // Fraction State
  const [numerator, setNumerator] = useState(1);
  const [denominator, setDenominator] = useState(2);

  const fractionData = [
      { name: 'Part', value: numerator },
      { name: 'Rest', value: denominator - numerator }
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 text-white">
      <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500 mb-8 text-center">
          🔬 מעבדת מספרים
      </h1>

      {/* Tab Switcher */}
      <div className="flex justify-center mb-12">
          <div className="bg-slate-800 p-1 rounded-2xl flex border border-slate-700">
              <button 
                onClick={() => setActiveTab(Topic.MULTIPLICATION)}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === Topic.MULTIPLICATION ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  כפל ויזואלי
              </button>
              <button 
                onClick={() => setActiveTab(Topic.FRACTIONS)}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === Topic.FRACTIONS ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  חוקר שברים
              </button>
          </div>
      </div>

      {activeTab === Topic.MULTIPLICATION && (
          <div className="grid md:grid-cols-2 gap-12 items-start animate-pop">
            {/* Controls */}
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl">
                <div className="space-y-8">
                    <div>
                        <label className="flex justify-between text-lg font-bold text-cyan-400 mb-4">
                            <span>שורות (Rows)</span>
                            <span className="bg-cyan-900/50 px-3 rounded">{rows}</span>
                        </label>
                        <input 
                            type="range" min="1" max="12" value={rows} 
                            onChange={(e) => setRows(parseInt(e.target.value))}
                            className="w-full h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                    <div>
                        <label className="flex justify-between text-lg font-bold text-purple-400 mb-4">
                            <span>עמודות (Cols)</span>
                            <span className="bg-purple-900/50 px-3 rounded">{cols}</span>
                        </label>
                        <input 
                            type="range" min="1" max="12" value={cols} 
                            onChange={(e) => setCols(parseInt(e.target.value))}
                            className="w-full h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                </div>

                <div className="mt-12 bg-slate-900 p-6 rounded-2xl text-center border border-slate-800">
                    <div className="text-6xl font-black tracking-widest text-white drop-shadow-lg">
                        <span className="text-cyan-400">{rows}</span>
                        <span className="text-slate-600 text-4xl mx-3">×</span>
                        <span className="text-purple-400">{cols}</span>
                        <span className="text-slate-600 text-4xl mx-3">=</span>
                        <span className="text-yellow-400">{rows * cols}</span>
                    </div>
                </div>
            </div>

            {/* Visualization Grid */}
            <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border border-slate-800 min-h-[400px] perspective-[800px]">
                <div className="grid gap-3 transition-all duration-300 transform rotate-x-12" 
                    style={{ 
                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    }}>
                    {Array.from({ length: rows * cols }).map((_, i) => (
                        <div 
                            key={i} 
                            className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg border-b-4 border-orange-700 animate-pop"
                            style={{ animationDelay: `${i * 30}ms` }}
                        ></div>
                    ))}
                </div>
            </div>
          </div>
      )}

      {activeTab === Topic.FRACTIONS && (
          <div className="grid md:grid-cols-2 gap-12 items-center animate-pop">
              {/* Controls */}
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl">
                <div className="space-y-8">
                    <div>
                        <label className="flex justify-between text-lg font-bold text-pink-400 mb-4">
                            <span>מונה (חלקים שיש לנו)</span>
                            <span className="bg-pink-900/50 px-3 rounded">{numerator}</span>
                        </label>
                        <input 
                            type="range" min="0" max={denominator} value={numerator} 
                            onChange={(e) => setNumerator(parseInt(e.target.value))}
                            className="w-full h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>
                    <div>
                        <label className="flex justify-between text-lg font-bold text-blue-400 mb-4">
                            <span>מכנה (סה"כ חלקים)</span>
                            <span className="bg-blue-900/50 px-3 rounded">{denominator}</span>
                        </label>
                        <input 
                            type="range" min="1" max="20" value={denominator} 
                            onChange={(e) => {
                                const newDenom = parseInt(e.target.value);
                                setDenominator(newDenom);
                                if (numerator > newDenom) setNumerator(newDenom);
                            }}
                            className="w-full h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-12 flex justify-center items-center gap-4 text-7xl font-black text-white">
                    <div className="flex flex-col items-center">
                        <span className="text-pink-400 border-b-4 border-white pb-2 px-4">{numerator}</span>
                        <span className="text-blue-400 pt-2">{denominator}</span>
                    </div>
                    <span className="text-4xl text-slate-500">=</span>
                    <span className="text-yellow-400 text-5xl">{(numerator/denominator).toFixed(2)}</span>
                </div>
            </div>

            {/* Pie Chart Visual */}
            <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-center border border-slate-800 min-h-[400px]">
                 <PieChart width={300} height={300}>
                    <Pie
                        data={fractionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell fill="#ec4899" /> {/* Numerator - Pink */}
                        <Cell fill="#334155" /> {/* Rest - Slate */}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#1e293b', borderRadius: '10px', border: 'none'}} itemStyle={{color: '#fff'}} />
                 </PieChart>
            </div>
          </div>
      )}

    </div>
  );
};

export default Lab;