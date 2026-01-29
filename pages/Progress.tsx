import React, { useState } from 'react';
import { UserStats } from '../types';
import { generatePersonalizedAnalysis } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Award, TrendingUp, Calendar, Trash2, Sparkles, Loader2 } from 'lucide-react';

interface ProgressProps {
  stats: UserStats;
  onReset: () => void;
}

const Progress: React.FC<ProgressProps> = ({ stats, onReset }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Convert topic stats to chart data
  const data = Object.entries(stats.topicPerformance).map(([topic, data]) => ({
      name: topic,
      score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  }));

  const handleAnalysis = async () => {
    setAnalyzing(true);
    const result = await generatePersonalizedAnalysis(stats);
    setAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">ההתקדמות שלי</h1>
        <button 
            onClick={onReset}
            className="flex items-center text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-red-200"
        >
            <Trash2 size={18} className="ml-2" />
            אפס נתונים
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-yellow-400 flex items-center">
            <div className="p-4 bg-yellow-100 rounded-full ml-4 text-yellow-600">
                <Award size={32} />
            </div>
            <div>
                <p className="text-gray-500 text-sm">סה"כ מטבעות</p>
                <p className="text-3xl font-bold text-gray-800">{stats.coins}</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-green-400 flex items-center">
            <div className="p-4 bg-green-100 rounded-full ml-4 text-green-600">
                <TrendingUp size={32} />
            </div>
            <div>
                <p className="text-gray-500 text-sm">תשובות נכונות</p>
                <p className="text-3xl font-bold text-gray-800">{stats.correctAnswers}</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border-b-4 border-indigo-400 flex items-center">
            <div className="p-4 bg-indigo-100 rounded-full ml-4 text-indigo-600">
                <Calendar size={32} />
            </div>
            <div>
                <p className="text-gray-500 text-sm">משחקים ששיחקת</p>
                <p className="text-3xl font-bold text-gray-800">{stats.gamesPlayed}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Main Chart Section */}
        <div className="bg-white p-8 rounded-3xl shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-700">הצלחה לפי נושאים (%)</h2>
            <div className="h-[300px] w-full dir-ltr">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f3f4f6'}}
                    />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                        {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#22c55e' : entry.score > 50 ? '#facc15' : '#ef4444'} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* AI Analysis Section */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col">
             <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} /></div>
             
             <h2 className="text-2xl font-bold mb-4 relative z-10">דוח ביצועים חכם 🤖</h2>
             <p className="opacity-90 mb-6 relative z-10">
                 הרובוט שלנו יכול לנתח את הביצועים שלך, לזהות איפה אתה חזק ואיפה כדאי להתאמן עוד.
             </p>

             {!analysis && !analyzing && (
                 <button 
                    onClick={handleAnalysis}
                    className="mt-auto bg-white text-indigo-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-100 transition-colors shadow-md flex items-center justify-center relative z-10"
                 >
                     <Sparkles className="ml-2" size={20} />
                     נתח את ההתקדמות שלי
                 </button>
             )}

             {analyzing && (
                 <div className="mt-auto flex items-center justify-center text-white relative z-10">
                     <Loader2 className="animate-spin ml-2" />
                     הרובוט חושב...
                 </div>
             )}

             {analysis && (
                 <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 overflow-y-auto max-h-[200px] text-sm relative z-10 animate-fade-in-up whitespace-pre-line">
                     {analysis}
                 </div>
             )}
        </div>

      </div>
    </div>
  );
};

export default Progress;