import React from 'react';
import { Page } from '../types';
import { Play, Brain, Trophy, ChevronLeft, Rocket } from 'lucide-react';

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
          <div className="inline-block bg-yellow-500/20 text-yellow-300 px-4 py-1 rounded-full text-sm font-bold mb-4 border border-yellow-500/50">
              🚀 NEW SEASON: MATH MASTERS
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight drop-shadow-xl">
            GAME ON. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">LEVEL UP.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-10 font-light leading-relaxed">
             הצטרפו לארקייד החשבון הגדול. שחקו, צברו XP, שברו שיאים ופתחו הישגים חדשים בעזרת ה-AI.
          </p>
          <button 
            onClick={() => setPage('game')}
            className="bg-yellow-500 text-slate-900 font-black py-4 px-10 rounded-2xl text-xl shadow-[0_0_20px_rgba(234,179,8,0.5)] hover:bg-yellow-400 hover:scale-105 transition-all duration-200 flex items-center btn-3d border-yellow-700"
          >
            START GAME
            <Play className="mr-3 fill-current" />
          </button>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Card 1: Game */}
        <div onClick={() => setPage('game')} className="glass-card p-8 rounded-3xl hover:bg-slate-800 transition-all cursor-pointer group hover:-translate-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 text-red-400 group-hover:rotate-12 transition-transform">
            <Play size={36} fill="currentColor" />
          </div>
          <h3 className="text-2xl font-black text-white mb-3">ARCADE ZONE</h3>
          <p className="text-slate-400 mb-6 leading-relaxed">מצבי משחק מהירים: חידון בוס, מרוץ נגד השעון ומגדל השמיים.</p>
          <span className="text-red-400 font-bold flex items-center text-sm tracking-wider">ENTER ZONE <ChevronLeft size={16} /></span>
        </div>

        {/* Card 2: AI Tutor */}
        <div onClick={() => setPage('tutor')} className="glass-card p-8 rounded-3xl hover:bg-slate-800 transition-all cursor-pointer group hover:-translate-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:rotate-12 transition-transform">
            <Brain size={36} />
          </div>
          <h3 className="text-2xl font-black text-white mb-3">AI COMPANION</h3>
          <p className="text-slate-400 mb-6 leading-relaxed">הבוט "Numbery" יעזור לכם לפצח כל אתגר עם רמזים וטיפים.</p>
          <span className="text-purple-400 font-bold flex items-center text-sm tracking-wider">CHAT NOW <ChevronLeft size={16} /></span>
        </div>

         {/* Card 3: Lab */}
         <div onClick={() => setPage('lab')} className="glass-card p-8 rounded-3xl hover:bg-slate-800 transition-all cursor-pointer group hover:-translate-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6 text-green-400 group-hover:rotate-12 transition-transform">
             <Trophy size={36} />
          </div>
          <h3 className="text-2xl font-black text-white mb-3">VISUAL LAB</h3>
          <p className="text-slate-400 mb-6 leading-relaxed">חקרו שברים, כפל וצורות עם הדמיות תלת-ממדיות אינטראקטיביות.</p>
          <span className="text-green-400 font-bold flex items-center text-sm tracking-wider">OPEN LAB <ChevronLeft size={16} /></span>
        </div>

      </div>
    </div>
  );
};

export default Home;