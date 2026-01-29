import React, { useState, useEffect, useRef } from 'react';
import { Difficulty, Topic, MathProblem, UserStats, GameMode, MemoryCard } from '../types';
import { generateMathProblem, generateMemoryGameSet } from '../services/geminiService';
import { Loader2, CheckCircle2, XCircle, Timer, Zap, Cuboid, Trophy, ArrowRight, BrainCircuit, Rocket, Settings2, Grid, Gamepad, Scale, Target } from 'lucide-react';

interface GameArenaProps {
  userStats: UserStats;
  updateStats: (newStats: Partial<UserStats>) => void;
}

const GameArena: React.FC<GameArenaProps> = ({ userStats, updateStats }) => {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([Topic.ADDITION]);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [towerHeight, setTowerHeight] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // --- MEMORY STATE ---
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);

  // --- SNAKE STATE ---
  const [snake, setSnake] = useState<{x:number, y:number}[]>([{x:5,y:5}]);
  const [direction, setDirection] = useState<{x:number, y:number}>({x:1, y:0});
  const [food, setFood] = useState<{x:number, y:number, val: string}>({x:10, y:10, val: '?'});
  const [snakeProblem, setSnakeProblem] = useState<MathProblem | null>(null);
  const snakeGridSize = 15;

  // --- SPACE STATE ---
  const [asteroids, setAsteroids] = useState<{id: number, x: number, y: number, problem: MathProblem}[]>([]);
  const [spaceInput, setSpaceInput] = useState('');
  const spaceRef = useRef<HTMLDivElement>(null);

  // --- BALANCE STATE ---
  const [balanceLeft, setBalanceLeft] = useState<string>('');
  const [balanceOptions, setBalanceOptions] = useState<string[]>([]);

  const toggleTopic = (t: Topic) => {
      setSelectedTopics(prev => {
          if (prev.includes(t)) {
              if (prev.length === 1) return prev; 
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

    if (mode === 'memory') startMemoryGame();
    else if (mode === 'snake') startSnakeGame();
    else if (mode === 'space') startSpaceGame();
    else if (mode === 'balance') startBalanceGame();
    else fetchProblem(mode);
  };

  // --- LOGIC HOOKS ---

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && !loading && !feedback && ['quiz', 'tower'].includes(gameMode || '')) {
       interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    if (isPlaying && gameMode === 'speed') {
        interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) { endGame(); return 0; }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, loading, feedback, gameMode]);

  // --- SNAKE LOGIC ---
  useEffect(() => {
      if (gameMode !== 'snake' || !isPlaying) return;
      const moveSnake = () => {
          setSnake(prev => {
              const head = { x: prev[0].x + direction.x, y: prev[0].y + direction.y };
              // Wrap around
              if (head.x < 0) head.x = snakeGridSize - 1;
              if (head.x >= snakeGridSize) head.x = 0;
              if (head.y < 0) head.y = snakeGridSize - 1;
              if (head.y >= snakeGridSize) head.y = 0;

              // Check food collision
              if (head.x === food.x && head.y === food.y) {
                  // Correct answer?
                  if (food.val === snakeProblem?.correctAnswer) {
                      setScore(s => s + 50);
                      fetchSnakeProblem();
                      return [head, ...prev]; // Grow
                  } else {
                      // Wrong food logic (simplified: just respawn food for now or penalty)
                      setScore(s => Math.max(0, s - 10));
                      fetchSnakeProblem(); // New problem
                      return prev; // Don't grow
                  }
              }
              return [head, ...prev.slice(0, -1)];
          });
      };
      const gameLoop = setInterval(moveSnake, 300);
      return () => clearInterval(gameLoop);
  }, [gameMode, isPlaying, direction, food, snakeProblem]);

  useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
          if (gameMode !== 'snake') return;
          if (e.key === 'ArrowUp' && direction.y === 0) setDirection({x:0, y:-1});
          if (e.key === 'ArrowDown' && direction.y === 0) setDirection({x:0, y:1});
          if (e.key === 'ArrowLeft' && direction.x === 0) setDirection({x:-1, y:0});
          if (e.key === 'ArrowRight' && direction.x === 0) setDirection({x:1, y:0});
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
  }, [gameMode, direction]);

  const startSnakeGame = async () => {
      setSnake([{x:5,y:5}]);
      await fetchSnakeProblem();
  };
  const fetchSnakeProblem = async () => {
      const prob = await generateMathProblem(selectedTopics, difficulty);
      if (prob) {
          setSnakeProblem(prob);
          // Spawn food with correct answer
          setFood({
              x: Math.floor(Math.random() * snakeGridSize),
              y: Math.floor(Math.random() * snakeGridSize),
              val: prob.correctAnswer
          });
      }
  };

  // --- SPACE LOGIC ---
  useEffect(() => {
      if (gameMode !== 'space' || !isPlaying) return;
      const loop = setInterval(() => {
          // Move asteroids
          setAsteroids(prev => {
              const moved = prev.map(a => ({...a, y: a.y + 2})); // speed
              const active = moved.filter(a => a.y < 100); // Remove if passed
              // Spawn new ones occasionally
              if (Math.random() < 0.05 && active.length < 3) {
                  // We need async fetch inside sync loop, tricky. 
                  // Simplified: Trigger fetch externally or just use placeholder.
                  // For this demo, we'll trigger a fetch if count is low via effect below
              }
              return active;
          });
      }, 100);
      return () => clearInterval(loop);
  }, [gameMode, isPlaying]);

  useEffect(() => {
      if (gameMode === 'space' && isPlaying && asteroids.length < 2) {
          generateMathProblem(selectedTopics, difficulty).then(prob => {
              if (prob) {
                  setAsteroids(prev => [...prev, {
                      id: Date.now(),
                      x: Math.floor(Math.random() * 80) + 10,
                      y: -10,
                      problem: prob
                  }]);
              }
          });
      }
  }, [asteroids.length, gameMode, isPlaying]);

  const startSpaceGame = () => { setAsteroids([]); setSpaceInput(''); };
  const handleSpaceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSpaceInput(val);
      // Check hits
      const hit = asteroids.find(a => a.problem.correctAnswer === val);
      if (hit) {
          setScore(s => s + 20);
          setAsteroids(prev => prev.filter(a => a.id !== hit.id));
          setSpaceInput('');
          // Visual flare?
      }
  };

  // --- BALANCE LOGIC ---
  const startBalanceGame = () => { fetchBalanceProblem(); };
  const fetchBalanceProblem = async () => {
      const prob = await generateMathProblem(selectedTopics, difficulty);
      if (prob) {
          setCurrentProblem(prob);
          setBalanceLeft(prob.question);
          setBalanceOptions(prob.options);
      }
  };

  // --- MEMORY LOGIC ---
  const startMemoryGame = () => {
      const cards = generateMemoryGameSet(selectedTopics, 6);
      setMemoryCards(cards);
      setFlippedCards([]);
      setIsProcessingMatch(false);
  };

  const handleCardClick = (card: MemoryCard) => {
      if (isProcessingMatch || card.isFlipped || card.isMatched) return;

      const newFlipped = [...flippedCards, card];
      // Flip logic: update state immediately
      setMemoryCards(prev => prev.map(c => c.id === card.id ? { ...c, isFlipped: true } : c));
      setFlippedCards(newFlipped);

      if (newFlipped.length === 2) {
          setIsProcessingMatch(true);
          // Delay match check slightly for visual
          setTimeout(() => checkForMatch(newFlipped[0], newFlipped[1]), 600);
      }
  };

  const checkForMatch = (card1: MemoryCard, card2: MemoryCard) => {
      const isMatch = card1.pairId === card2.pairId;
      if (isMatch) {
          setScore(prev => prev + 50);
          updateStats({ coins: userStats.coins + 5, xp: userStats.xp + 10 });
          // Set matched
          setMemoryCards(prev => prev.map(c => 
              c.id === card1.id || c.id === card2.id ? { ...c, isMatched: true, isFlipped: true } : c
          ));
          // Check win
          if (memoryCards.filter(c => !c.isMatched && c.id !== card1.id && c.id !== card2.id).length === 0) {
              setTimeout(() => { alert(`כל הכבוד! סיימת עם ${score + 50} מטבעות!`); setIsPlaying(false); }, 1000);
          }
      } else {
          // Unflip
          setMemoryCards(prev => prev.map(c => 
              c.id === card1.id || c.id === card2.id ? { ...c, isFlipped: false } : c
          ));
      }
      setFlippedCards([]);
      setIsProcessingMatch(false);
  };

  // --- STANDARD GAME FETCH ---
  const fetchProblem = async (mode: GameMode = 'quiz') => {
    setLoading(true);
    setFeedback(null);
    setSelectedAnswer(null);
    const problem = await generateMathProblem(selectedTopics, difficulty);
    if (problem && mode === 'quiz' && Math.random() < 0.2) problem.isChallenge = true;
    setCurrentProblem(problem);
    setLoading(false);
  };

  const handleAnswer = (answer: string) => {
    if (feedback || !currentProblem) return;
    setSelectedAnswer(answer);
    const isCorrect = answer === currentProblem.correctAnswer;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    // Stats update
    const currentTopicStats = userStats.topicPerformance[currentProblem.topic] || { correct: 0, total: 0 };
    updateStats({
        xp: userStats.xp + (isCorrect ? 10 : 0), // coins
        coins: userStats.coins + (isCorrect ? 5 : 0),
        correctAnswers: userStats.correctAnswers + (isCorrect ? 1 : 0),
        topicPerformance: { ...userStats.topicPerformance, [currentProblem.topic]: { total: currentTopicStats.total + 1, correct: currentTopicStats.correct + (isCorrect ? 1 : 0) }}
    });

    if (isCorrect) {
        setScore(prev => prev + (currentProblem.isChallenge ? 500 : 100));
        if (gameMode === 'tower') setTowerHeight(prev => prev + 1);
        if (gameMode === 'balance') setTimeout(fetchBalanceProblem, 1000);
        else setTimeout(() => fetchProblem(gameMode!), 1200);
    } else {
        if (gameMode === 'tower') setTowerHeight(prev => Math.max(0, prev - 1));
        if (gameMode === 'speed') setTimeout(() => fetchProblem(gameMode!), 800);
    }
  };

  const endGame = () => {
      setFeedback('correct');
      alert(`נגמר הזמן! ניקוד סופי: ${score}`);
      setIsPlaying(false);
      setGameMode(null);
  };

  // --- RENDERERS ---

  if (!isPlaying) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-white">
        <div className="text-center mb-12 animate-pop">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 mb-4">
                אזור המשחקים
            </h1>
            <p className="text-slate-400 text-lg">בחרו משחק והתחילו לצבור מטבעות!</p>
        </div>

        {/* Config */}
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-6 mb-8 shadow-2xl">
             <div className="flex items-center gap-2 mb-4 text-cyan-400 border-b border-slate-700 pb-2">
                 <Settings2 />
                 <h2 className="text-xl font-bold">הגדרות</h2>
             </div>
             <div className="grid md:grid-cols-2 gap-8">
                <div>
                   <label className="text-slate-300 font-bold mb-2 block">במה מתאמנים?</label>
                   <div className="flex flex-wrap gap-2">
                       {Object.values(Topic).map(t => (
                           <button key={t} onClick={() => toggleTopic(t)} className={`px-3 py-2 rounded-lg border font-bold text-sm transition-all ${selectedTopics.includes(t) ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>{t}</button>
                       ))}
                   </div>
                </div>
                <div>
                   <label className="text-slate-300 font-bold mb-2 block">רמה:</label>
                   <div className="flex gap-2">
                     {Object.values(Difficulty).map(d => (
                         <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2 rounded-lg border font-bold text-sm transition-all ${difficulty === d ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700 border-slate-900 text-slate-400'}`}>{d}</button>
                     ))}
                   </div>
                </div>
             </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
                {id: 'quiz', name: 'חידון בוס', icon: BrainCircuit, color: 'blue', desc: 'שאלות אמריקאיות וקרבות בוס'},
                {id: 'speed', name: 'נגד הזמן', icon: Zap, color: 'red', desc: '60 שניות. כמה תספיקו?'},
                {id: 'tower', name: 'מגדל', icon: Cuboid, color: 'emerald', desc: 'לבנות הכי גבוה שאפשר'},
                {id: 'memory', name: 'זיכרון', icon: Grid, color: 'pink', desc: 'למצוא זוגות של תרגיל ותוצאה'},
                {id: 'snake', name: 'נחש', icon: Gamepad, color: 'green', desc: 'לאכול את התשובה הנכונה'},
                {id: 'space', name: 'מגן החלל', icon: Rocket, color: 'purple', desc: 'ליירט אסטרואידים עם פתרונות'},
                {id: 'balance', name: 'מאזניים', icon: Scale, color: 'orange', desc: 'לאזן את המשוואה'},
            ].map(g => (
                <div key={g.id} onClick={() => startGame(g.id as GameMode)} className={`group bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-${g.color}-500 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl`}>
                    <g.icon size={40} className={`text-${g.color}-500 mb-4 group-hover:scale-110 transition-transform`} />
                    <h3 className="text-xl font-bold text-white">{g.name}</h3>
                    <p className="text-slate-400 text-xs mt-2">{g.desc}</p>
                </div>
            ))}
        </div>
      </div>
    );
  }

  // --- SNAKE RENDER ---
  if (gameMode === 'snake') {
      return (
          <div className="max-w-2xl mx-auto p-4 flex flex-col items-center text-white">
              <h2 className="text-3xl font-black text-green-400 mb-4">נחש חשבון</h2>
              <div className="bg-slate-800 p-4 rounded-xl mb-4 text-center border border-green-500/30">
                  <p className="text-slate-400 text-sm">המשימה:</p>
                  <p className="text-2xl font-bold dir-ltr">{snakeProblem?.question} = ?</p>
              </div>
              <div className="relative bg-slate-900 border-4 border-slate-700 rounded-lg shadow-2xl" 
                   style={{width: snakeGridSize*20, height: snakeGridSize*20}}>
                   {snake.map((seg, i) => (
                       <div key={i} className="absolute bg-green-500 rounded-sm" style={{width: 18, height: 18, left: seg.x*20, top: seg.y*20}}></div>
                   ))}
                   <div className="absolute bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold" 
                        style={{width: 18, height: 18, left: food.x*20, top: food.y*20}}>
                       {food.val}
                   </div>
              </div>
              <p className="mt-4 text-slate-500">השתמשו בחצים במקלדת כדי לזוז</p>
              <button onClick={() => setIsPlaying(false)} className="mt-6 text-slate-400 hover:text-white">יציאה</button>
          </div>
      );
  }

  // --- SPACE RENDER ---
  if (gameMode === 'space') {
      return (
          <div className="max-w-2xl mx-auto p-4 flex flex-col items-center text-white h-screen overflow-hidden">
               <h2 className="text-3xl font-black text-purple-400 mb-4 z-10">מגן החלל</h2>
               <div className="flex-1 w-full bg-slate-900 border border-slate-700 relative rounded-xl overflow-hidden mb-4" ref={spaceRef}>
                   {asteroids.map(a => (
                       <div key={a.id} className="absolute flex flex-col items-center transform -translate-x-1/2" style={{left: `${a.x}%`, top: `${a.y}%`, transition: 'top 0.1s linear'}}>
                           <div className="w-12 h-12 bg-slate-700 rounded-full animate-spin border-2 border-slate-500"></div>
                           <span className="bg-black/50 px-2 rounded text-sm mt-1 dir-ltr font-mono">{a.problem.question}</span>
                       </div>
                   ))}
               </div>
               <div className="z-10 w-full max-w-sm flex gap-2">
                   <input 
                    autoFocus
                    type="text" 
                    value={spaceInput}
                    onChange={handleSpaceInput}
                    placeholder="הקלד תשובה..."
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-center text-xl font-bold focus:border-purple-500 outline-none"
                   />
               </div>
               <button onClick={() => setIsPlaying(false)} className="mt-4 text-slate-400 z-10">יציאה</button>
          </div>
      );
  }

  // --- BALANCE RENDER ---
  if (gameMode === 'balance') {
      return (
          <div className="max-w-3xl mx-auto p-8 text-white text-center">
              <h2 className="text-3xl font-black text-orange-400 mb-12">מאזניים</h2>
              
              <div className="relative h-64 flex justify-center items-end mb-12">
                  {/* Base */}
                  <div className="w-2 h-32 bg-slate-600 mx-auto"></div>
                  <div className="absolute bottom-0 w-32 h-4 bg-slate-700 rounded-full"></div>
                  
                  {/* Beam */}
                  <div className="absolute top-20 w-3/4 h-2 bg-slate-400 rounded transition-transform duration-500" 
                       style={{transform: feedback === 'correct' ? 'rotate(0deg)' : 'rotate(-5deg)'}}>
                      {/* Left Pan */}
                      <div className="absolute left-0 top-2 flex flex-col items-center">
                          <div className="h-16 w-1 bg-slate-500/50"></div>
                          <div className="w-24 h-24 bg-slate-800 border-4 border-slate-600 rounded-b-full flex items-center justify-center">
                              <span className="text-2xl font-bold dir-ltr">{balanceLeft}</span>
                          </div>
                      </div>
                      {/* Right Pan */}
                      <div className="absolute right-0 top-2 flex flex-col items-center">
                          <div className="h-16 w-1 bg-slate-500/50"></div>
                          <div className={`w-24 h-24 bg-slate-800 border-4 border-slate-600 rounded-b-full flex items-center justify-center ${feedback === 'correct' ? 'bg-green-900/50' : ''}`}>
                              <span className="text-2xl font-bold text-yellow-400">?</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                  {balanceOptions.map((opt, i) => (
                      <button key={i} onClick={() => handleAnswer(opt)} className="bg-slate-800 p-6 rounded-xl text-2xl font-bold hover:bg-orange-600 transition-colors border border-slate-700">
                          {opt}
                      </button>
                  ))}
              </div>
              <button onClick={() => setIsPlaying(false)} className="mt-12 text-slate-400">יציאה</button>
          </div>
      );
  }

  // --- MEMORY RENDER ---
  if (gameMode === 'memory') {
      return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 text-white">
            <div className="flex justify-between items-center mb-8 bg-slate-800/80 p-4 rounded-2xl shadow-lg">
                <button onClick={() => setIsPlaying(false)} className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-700/50">
                   <ArrowRight size={20} />
                </button>
                <div className="flex items-center space-x-2 space-x-reverse text-yellow-400 font-bold text-2xl font-mono">
                    <Trophy />
                    <span>{score}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 perspective-[1000px]">
                {memoryCards.map(card => {
                    // If matched, render "invisible" placeholder to keep grid layout but show empty space
                    if (card.isMatched) {
                        return (
                            <div key={card.id} className="aspect-square animate-vanish pointer-events-none"></div>
                        );
                    }

                    return (
                        <div 
                            key={card.id}
                            onClick={() => handleCardClick(card)}
                            className={`aspect-square relative cursor-pointer transition-transform duration-500 transform-style-3d preserve-3d
                                ${card.isFlipped ? 'rotate-y-180' : ''}`}
                        >
                            {/* Front (Card Back - Visible initially) */}
                            <div className="absolute inset-0 bg-slate-800 rounded-xl border-b-4 border-slate-950 flex items-center justify-center backface-hidden shadow-xl z-20">
                                <span className="text-3xl opacity-20">?</span>
                            </div>
                            
                            {/* Back (Content - Visible when flipped) */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl border-b-4 border-indigo-800 flex items-center justify-center backface-hidden rotate-y-180 shadow-xl z-10">
                                <span className={`font-black ${card.type === 'answer' ? 'text-yellow-300 text-4xl' : 'text-white text-2xl'} dir-ltr`}>
                                    {card.content}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      );
  }

  // --- STANDARD QUIZ/TOWER RENDER ---
  if (loading || !currentProblem) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-white">
        <Rocket size={64} className="text-cyan-500 animate-bounce mb-8" />
        <h2 className="text-3xl font-bold mb-2">מכין את המשחק...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 text-white">
      <div className="flex justify-between items-center mb-8 bg-slate-800/80 backdrop-blur border border-slate-700 p-4 rounded-2xl shadow-lg relative overflow-hidden">
        {gameMode === 'speed' && <div className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-1000 ease-linear" style={{width: `${(timer / 60) * 100}%`}} />}
        <button onClick={() => setIsPlaying(false)} className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-700/50"><ArrowRight size={20} /></button>
        <div className="flex space-x-8 space-x-reverse">
            <div className={`flex items-center space-x-2 space-x-reverse font-mono text-2xl font-bold ${gameMode === 'speed' && timer < 10 ? 'text-red-500 animate-ping' : 'text-cyan-400'}`}><Timer /><span>{gameMode === 'speed' ? timer : Math.floor(timer / 60) + ':' + (timer % 60).toString().padStart(2, '0')}</span></div>
            <div className="flex items-center space-x-2 space-x-reverse text-yellow-400 font-bold text-2xl font-mono"><Trophy /><span>{score}</span></div>
        </div>
      </div>

      {gameMode === 'tower' && (
          <div className="relative h-64 flex justify-center items-end mb-12 perspective-[1000px]">
             <div className="absolute bottom-0 w-64 h-4 bg-slate-700 rounded-full blur-sm"></div>
             <div className="flex flex-col-reverse items-center transition-all duration-500">
                 {Array.from({length: towerHeight}).map((_, i) => (
                     <div key={i} className="w-32 h-10 mb-[-5px] bg-gradient-to-r from-emerald-500 to-green-600 border-2 border-emerald-400 shadow-lg animate-pop relative z-10" style={{transform: `translateZ(${i * 10}px) rotateX(10deg)`, borderRadius: '4px'}}>
                        <div className="absolute top-0 right-[-10px] w-[10px] h-full bg-green-800 origin-left skew-y-[-45deg]"></div>
                     </div>
                 ))}
                 <div className="w-40 h-4 bg-slate-600 rounded-lg"></div>
             </div>
             <div className="absolute top-0 right-0 text-emerald-400 font-black text-4xl opacity-20">קומה {towerHeight}</div>
          </div>
      )}

      {currentProblem.isChallenge && (
          <div className="animate-pulse bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl mb-6 text-center font-black text-xl tracking-widest flex items-center justify-center gap-3">
              <Zap className="fill-current" /> אתגר בונוס <Zap className="fill-current" />
          </div>
      )}

      <div className="relative group perspective-[1000px] mb-8">
         <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-slate-700 text-xs px-2 py-1 rounded text-slate-400 font-mono uppercase border border-slate-600">{currentProblem.topic}</div>
            <h2 className="text-5xl md:text-7xl font-black text-white dir-ltr font-mono drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">{currentProblem.question}</h2>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentProblem.options.map((option, idx) => {
           let btnStyle = "bg-slate-800 border-slate-950 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-blue-500";
           if (selectedAnswer === option) {
               if (feedback === 'correct') btnStyle = "bg-green-600 border-green-800 text-white shadow-lg scale-105";
               if (feedback === 'incorrect') btnStyle = "bg-red-600 border-red-800 text-white animate-shake";
           }
           return (
             <button key={idx} onClick={() => handleAnswer(option)} disabled={feedback !== null} className={`relative h-24 rounded-2xl text-3xl font-bold border-b-8 transition-all active:border-b-0 active:translate-y-2 btn-3d ${btnStyle}`}>{option}</button>
           )
        })}
      </div>

      {feedback && gameMode !== 'speed' && (
        <div className={`fixed inset-x-0 bottom-0 p-6 z-50 animate-pop ${feedback === 'correct' ? 'bg-green-600' : 'bg-red-600'}`}>
           <div className="max-w-4xl mx-auto flex items-center text-white">
                {feedback === 'correct' ? <CheckCircle2 size={48} className="animate-bounce" /> : <XCircle size={48} className="animate-pulse" />}
                <div className="mr-4">
                    <h3 className="text-2xl font-black">{feedback === 'correct' ? 'כל הכבוד!' : 'לא נורא'}</h3>
                    <p className="text-lg opacity-90">{currentProblem.explanation}</p>
                </div>
                {feedback === 'incorrect' && <button onClick={() => fetchProblem(gameMode!)} className="mr-auto bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full font-bold">דלג</button>}
           </div>
        </div>
      )}
    </div>
  );
};

export default GameArena;
