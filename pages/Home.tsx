import React from 'react';
import { Page } from '../types';
import { Play, Brain, Trophy, ChevronLeft, Rocket, Grid } from 'lucide-react';

interface HomeProps {
  setPage: (page: Page) => void;
}

const Home: React.FC<HomeProps> = ({ setPage }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-8 md:p-16 text-white shadow-[0_0_50px_rgba(79,70,229,0.2)] relative overflow-hidden mb-16 border border-white/10 group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 p-12 opacity-20 animate-pulse">
            <Rocket size={200} />
        </div>

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight drop-shadow-xl dir-rtl">
            ברוכים הבאים <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">למספרייה!</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-10 font-light leading-relaxed dir-rtl">
             כאן לומדים חשבון ונהנים. משחקים, צוברים מטבעות ומתקדמים בקצב שלכם.
          </p>
          <button 
            onClick={() => setPage('game')}
            className="bg-yellow-500 text-slate-900 font-black py-4 px-10 rounded-2xl text-xl shadow-[0_0_20px_rgba(234,179,8,0.5)] hover:bg-yellow-400 hover:scale-105 transition-all duration-200 flex items-center btn-3d border-yellow-700"
          >
            <Play className="ml-3 fill-current" />
            בואו נשחק
          </button>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Card 1: Game */}
        <div onClick={() => setPage('game')} className="glass-card p-8 rounded-3xl hover:bg-slate-800 transition-all cursor-pointer group hover:-translate-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 text-red-400 group-hover:rotate-12 transition-transform">
            <Grid size={36} />
          </div>
          <h3 className="text-2xl font-black text-white mb-3">משחקים</h3>
          <p className="text-slate-400 mb-6 leading-relaxed">נחש חשבון, מגן החלל, משחק הזיכרון ועוד המון אתגרים.</p>
          <span className="text-red-400 font-bold flex items-center text-sm tracking-wider">שחק עכשיו <ChevronLeft size={16} /></span>
        </div>

        {/* Card 2: AI Tutor */}
        <div onClick={() => setPage('tutor')} className="glass-card p-8 rounded-3xl hover:bg-slate-800 transition-all cursor-pointer group hover:-translate-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:rotate-12 transition-transform">
            <Brain size={36} />
          </div>
          <h3 className="text-2xl font-black text-white mb-3">עוזר אישי</h3>
          <p className="text-slate-400 mb-6 leading-relaxed">צריכים עזרה בתרגיל? מספרי הבוט כאן בשבילכם.</p>
          <span className="text-purple-400 font-bold flex items-center text-sm tracking-wider">צ'אט <ChevronLeft size={16} /></span>
        </div>

         {/* Card 3: Lab */}
         <div onClick={() => setPage('lab')} className="glass-card p-8 rounded-3xl hover:bg-slate-800 transition-all cursor-pointer group hover:-translate-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 text-green-400 group-hover:rotate-12 transition-transform">
             <Trophy size={36} />
          </div>
          <h3 className="text-2xl font-black text-white mb-3">מעבדה</h3>
          <p className="text-slate-400 mb-6 leading-relaxed">לראות איך מספרים עובדים עם הדמיות תלת-ממדיות.</p>
          <span className="text-green-400 font-bold flex items-center text-sm tracking-wider">כנסו למעבדה <ChevronLeft size={16} /></span>
        </div>

      </div>
    </div>
  );
};

export default Home;