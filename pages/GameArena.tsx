import React, { useState, useEffect } from 'react';
import { Difficulty, Topic, MathProblem, UserStats, GameMode } from '../types';
import { generateMathProblem } from '../services/geminiService';
import { Loader2, CheckCircle2, XCircle, Timer, Zap, Cuboid, HelpCircle, Trophy, ArrowRight, BrainCircuit, Rocket, Settings2 } from 'lucide-react';

interface GameArenaProps {
  userStats: UserStats;
  updateStats: (newStats: Partial<UserStats>) => void;
}

const GameArena: React.FC<GameArenaProps> = ({ userStats, updateStats }) => {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  
  // Configuration State
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([Topic.ADDITION]);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);

  // Game Play State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [towerHeight, setTowerHeight] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Toggle topic selection
  const toggleTopic = (t: Topic) => {
      setSelectedTopics(prev => {
          if (prev.includes(t)) {
              if (prev.length === 1) return prev; // Must have at least one
              return prev.filter(item => item !== t);
          } else {
              return [...prev, t];
          }
      });
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setIsPlaying(true);
    setScore(0);
    setTowerHeight(0);
    setTimer(mode === 'speed' ? 60 : 0);
    setSelectedAnswer(null);
    fetchProblem(mode);
  };

  const fetchProblem = async (mode: GameMode = 'quiz') => {
    setLoading(true);
    setFeedback(null);
    setSelectedAnswer(null);
    
    // AI fetch with MULTIPLE topics
    const problem = await generateMathProblem(selectedTopics, difficulty);
    
    // Random chance for "Boss Battle" / Challenge in Quiz mode
    if (problem && mode === 'quiz' && Math.random() < 0.2) {
        problem.isChallenge = true;
    }
    
    setCurrentProblem(problem);
    setLoading(false);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && !loading && !feedback) {
      interval = setInterval(() => {
        if (gameMode === 'speed') {
            setTimer(prev => {
                if (prev <= 1) {
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        } else {
            setTimer(prev => prev + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, loading, feedback, gameMode]);

  const endGame = () => {
      setFeedback('correct'); // Stop interaction
      alert(`GAME OVER! Final Score: ${score}`);
      setIsPlaying(false);
      setGameMode(null);
  };

  const handleAnswer = (answer: string) => {
    if (feedback || !currentProblem) return;

    setSelectedAnswer(answer);

    const isCorrect = answer === currentProblem.correctAnswer;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    // Update Stats
    const currentTopicStats = userStats.topicPerformance[currentProblem.topic] || { correct: 0, total: 0 };
    const newTopicStats = {
        total: currentTopicStats.total + 1,
        correct: currentTopicStats.correct + (isCorrect ? 1 : 0)
    };

    const xpGain = isCorrect ? (currentProblem.isChallenge ? 50 : 20) : 0; // Higher XP for gamified feel
    
    updateStats({
        xp: userStats.xp + xpGain,
        coins: userStats.coins + (isCorrect ? 10 : 0),
        correctAnswers: userStats.correctAnswers + (isCorrect ? 1 : 0),
        gamesPlayed: userStats.gamesPlayed + 1,
        topicPerformance: {
            ...userStats.topicPerformance,
            [currentProblem.topic]: newTopicStats
        }
    });

    if (isCorrect) {
        setScore(prev => prev + (currentProblem.isChallenge ? 500 : 100));
        if (gameMode === 'tower') setTowerHeight(prev => prev + 1);
        setTimeout(() => fetchProblem(gameMode!), 1200);
    } else {
        if (gameMode === 'tower') setTowerHeight(prev => Math.max(0, prev - 1));
        if (gameMode === 'speed') setTimeout(() => fetchProblem(gameMode!), 800); // Fast fail in speed mode
    }
  };

  // --- MENU SCREEN ---
  if (!isPlaying) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-white">
        <div className="text-center mb-12 animate-pop">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 drop-shadow-lg mb-4">
                MISSION CONTROL
            </h1>
            <p className="text-slate-400 text-xl font-mono">הכן את המערכות לקראת השיגור</p>
        </div>

        {/* Config Panel */}
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8 mb-12 shadow-2xl">
             <div className="flex items-center gap-2 mb-6 text-cyan-400 border-b border-slate-700 pb-4">
                 <Settings2 />
                 <h2 className="text-2xl font-bold">הגדרות משימה</h2>
             </div>

             <div className="grid md:grid-cols-2 gap-12">
                {/* Topic Select */}
                <div>
                   <label className="text-slate-300 font-bold mb-4 block">בחר סוגי אויבים (פעולות):</label>
                   <div className="flex flex-wrap gap-3">
                       {Object.values(Topic).map(t => (
                           <button 
                                key={t} 
                                onClick={() => toggleTopic(t)}
                                className={`px-4 py-3 rounded-xl border-2 font-bold transition-all ${
                                    selectedTopics.includes(t) 
                                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                                }`}
                           >
                               {t}
                           </button>
                       ))}
                   </div>
                </div>

                {/* Difficulty */}
                <div>
                   <label className="text-slate-300 font-bold mb-4 block">רמת קושי:</label>
                   <div className="flex gap-3">
                     {Object.values(Difficulty).map(d => (
                         <button 
                            key={d} 
                            onClick={() => setDifficulty(d)} 
                            className={`flex-1 py-3 rounded-xl border-b-4 font-bold transition-all active:border-b-0 active:translate-y-1 ${
                                difficulty === d 
                                ? 'bg-purple-600 border-purple-800 text-white shadow-lg' 
                                : 'bg-slate-700 border-slate-900 text-slate-400'
                            }`}
                         >
                             {d}
                         </button>
                     ))}
                   </div>
                </div>
             </div>
        </div>

        {/* Game Modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div onClick={() => startGame('quiz')} className="group relative bg-slate-800 rounded-3xl p-8 border border-slate-700 hover:border-blue-500 transition-all cursor-pointer hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <BrainCircuit size={48} className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-3xl font-black text-white mb-2">QUIZ MODE</h3>
                <p className="text-slate-400">צברו XP בחידון דינמי עם שאלות בוס.</p>
                <div className="mt-6 flex items-center text-blue-400 font-bold">Start Game <ArrowRight className="ml-2 w-4" /></div>
            </div>

            <div onClick={() => startGame('speed')} className="group relative bg-slate-800 rounded-3xl p-8 border border-slate-700 hover:border-red-500 transition-all cursor-pointer hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] overflow-hidden">
                <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Zap size={48} className="text-red-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-3xl font-black text-white mb-2">SPEED RUN</h3>
                <p className="text-slate-400">60 שניות על השעון. אל תעצרו לרגע.</p>
                <div className="mt-6 flex items-center text-red-400 font-bold">Start Run <ArrowRight className="ml-2 w-4" /></div>
            </div>

            <div onClick={() => startGame('tower')} className="group relative bg-slate-800 rounded-3xl p-8 border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] overflow-hidden">
                <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Cuboid size={48} className="text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-3xl font-black text-white mb-2">SKY TOWER</h3>
                <p className="text-slate-400">בנו את הבניין הגבוה ביותר. טעות אחת והכל נופל.</p>
                <div className="mt-6 flex items-center text-emerald-400 font-bold">Build Now <ArrowRight className="ml-2 w-4" /></div>
            </div>
        </div>
      </div>
    );
  }

  // --- GAME SCREEN ---
  
  if (loading || !currentProblem) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-white">
        <Rocket size={64} className="text-cyan-500 animate-bounce mb-8" />
        <h2 className="text-3xl font-bold mb-2">טוען שלב...</h2>
        <p className="text-slate-400 animate-pulse">ה-AI מייצר אויבים חדשים</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 text-white">
      
      {/* HUD */}
      <div className="flex justify-between items-center mb-8 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 rounded-2xl shadow-lg relative overflow-hidden">
        {gameMode === 'speed' && (
             <div 
               className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-1000 ease-linear" 
               style={{width: `${(timer / 60) * 100}%`}}
             />
        )}
        
        <button onClick={() => setIsPlaying(false)} className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-700/50">
           <ArrowRight size={20} />
        </button>
        
        <div className="flex space-x-8 space-x-reverse">
            <div className={`flex items-center space-x-2 space-x-reverse font-mono text-2xl font-bold ${gameMode === 'speed' && timer < 10 ? 'text-red-500 animate-ping' : 'text-cyan-400'}`}>
                <Timer />
                <span>{gameMode === 'speed' ? timer : Math.floor(timer / 60) + ':' + (timer % 60).toString().padStart(2, '0')}</span>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse text-yellow-400 font-bold text-2xl font-mono shadow-yellow-500/20 drop-shadow-md">
                <Trophy />
                <span>{score.toLocaleString()}</span>
            </div>
        </div>
      </div>

      {/* 3D TOWER VISUAL */}
      {gameMode === 'tower' && (
          <div className="relative h-64 flex justify-center items-end mb-12 perspective-[1000px]">
             {/* Ground */}
             <div className="absolute bottom-0 w-64 h-4 bg-slate-700 rounded-full blur-sm"></div>
             
             <div className="flex flex-col-reverse items-center transition-all duration-500">
                 {Array.from({length: towerHeight}).map((_, i) => (
                     <div 
                        key={i} 
                        className="w-32 h-10 mb-[-5px] bg-gradient-to-r from-emerald-500 to-green-600 border-2 border-emerald-400 shadow-lg animate-pop relative z-10"
                        style={{
                            transform: `translateZ(${i * 10}px) rotateX(10deg)`,
                            borderRadius: '4px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                     >
                        {/* 3D Side Effect */}
                        <div className="absolute top-0 right-[-10px] w-[10px] h-full bg-green-800 origin-left skew-y-[-45deg]"></div>
                     </div>
                 ))}
                 {/* Base Block */}
                 <div className="w-40 h-4 bg-slate-600 rounded-lg"></div>
             </div>
             <div className="absolute top-0 right-0 text-emerald-400 font-black text-4xl opacity-20">{towerHeight} FLOORS</div>
          </div>
      )}

      {/* CHALLENGE ALERT */}
      {currentProblem.isChallenge && (
          <div className="animate-pulse bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl mb-6 text-center font-black text-xl tracking-widest flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <Zap className="fill-current" /> BOSS BATTLE <Zap className="fill-current" />
          </div>
      )}

      {/* QUESTION DISPLAY */}
      <div className="relative group perspective-[1000px] mb-8">
         <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-[1.01]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
            
            {/* Topic Badge */}
            <div className="absolute top-4 right-4 bg-slate-700 text-xs px-2 py-1 rounded text-slate-400 font-mono uppercase border border-slate-600">
                {currentProblem.topic}
            </div>

            <h2 className="text-5xl md:text-7xl font-black text-white dir-ltr font-mono drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
               {currentProblem.question}
            </h2>
         </div>
      </div>
      
      {/* ANSWERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentProblem.options.map((option, idx) => {
           let btnStyle = "bg-slate-800 border-slate-950 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-blue-500"; // Default
           
           if (selectedAnswer === option) {
               if (feedback === 'correct') btnStyle = "bg-green-600 border-green-800 text-white shadow-[0_0_20px_rgba(22,163,74,0.6)] scale-105";
               if (feedback === 'incorrect') btnStyle = "bg-red-600 border-red-800 text-white animate-shake";
           } else if (feedback === 'incorrect' && option === currentProblem.correctAnswer) {
               btnStyle = "bg-green-900/50 border-green-600 text-green-400 border-dashed opacity-70";
           }

           return (
             <button
               key={idx}
               onClick={() => handleAnswer(option)}
               disabled={feedback !== null}
               className={`relative h-24 rounded-2xl text-3xl font-bold border-b-8 transition-all active:border-b-0 active:translate-y-2 btn-3d ${btnStyle}`}
             >
               {option}
             </button>
           )
        })}
      </div>

      {/* FEEDBACK OVERLAY */}
      {feedback && gameMode !== 'speed' && (
        <div className={`fixed inset-x-0 bottom-0 p-6 z-50 animate-pop ${feedback === 'correct' ? 'bg-green-600' : 'bg-red-600'}`}>
           <div className="max-w-4xl mx-auto flex items-center text-white">
                {feedback === 'correct' ? <CheckCircle2 size={48} className="animate-bounce" /> : <XCircle size={48} className="animate-pulse" />}
                <div className="mr-4">
                    <h3 className="text-2xl font-black uppercase italic">{feedback === 'correct' ? 'Excellent!' : 'Mission Failed!'}</h3>
                    <p className="text-lg opacity-90 font-medium">{currentProblem.explanation}</p>
                </div>
                {feedback === 'incorrect' && (
                    <button onClick={() => fetchProblem(gameMode!)} className="mr-auto bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full font-bold">Next</button>
                )}
           </div>
        </div>
      )}

    </div>
  );
};

export default GameArena;