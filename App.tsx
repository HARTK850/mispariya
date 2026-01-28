import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GameArena from './pages/GameArena';
import AITutor from './pages/AITutor';
import Progress from './pages/Progress';
import Lab from './pages/Lab';
import { Page, UserStats, Topic } from './types';
import { validateApiKey, saveApiKey, getStoredApiKey, clearApiKey } from './services/geminiService';
import { X, Check, Loader2, Key } from 'lucide-react';

const INITIAL_STATS: UserStats = {
  xp: 0,
  level: 1,
  streak: 0,
  coins: 0,
  gamesPlayed: 0,
  correctAnswers: 0,
  topicPerformance: {
    [Topic.ADDITION]: { correct: 0, total: 0 },
    [Topic.SUBTRACTION]: { correct: 0, total: 0 },
    [Topic.MULTIPLICATION]: { correct: 0, total: 0 },
    [Topic.DIVISION]: { correct: 0, total: 0 },
    [Topic.FRACTIONS]: { correct: 0, total: 0 },
  }
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [showSettings, setShowSettings] = useState(false);
  
  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [hasStoredKey, setHasStoredKey] = useState(false);

  // Load stats
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('misparia_stats_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_STATS; }
    }
    return INITIAL_STATS;
  });

  useEffect(() => {
    localStorage.setItem('misparia_stats_v2', JSON.stringify(userStats));
  }, [userStats]);

  // Check for stored key on mount
  useEffect(() => {
      const stored = getStoredApiKey();
      if (stored) {
          setHasStoredKey(true);
      } else {
          // If no key, maybe show settings automatically once? Or just let them play generic mode.
      }
  }, []);

  const handleSaveKey = async () => {
      setKeyStatus('validating');
      const isValid = await validateApiKey(apiKeyInput);
      
      if (isValid) {
          saveApiKey(apiKeyInput);
          setKeyStatus('valid');
          setHasStoredKey(true);
          setTimeout(() => {
              setShowSettings(false);
              setKeyStatus('idle');
              setApiKeyInput('');
          }, 1500);
      } else {
          setKeyStatus('invalid');
      }
  };

  const handleClearKey = () => {
      clearApiKey();
      setHasStoredKey(false);
      setKeyStatus('idle');
      alert('מפתח ה-API נמחק.');
  };

  const updateStats = (newStats: Partial<UserStats>) => {
    setUserStats(prev => ({ ...prev, ...newStats }));
  };

  const resetProgress = () => {
    if (window.confirm('האם אתה בטוח שברצונך לאפס את כל ההתקדמות? אי אפשר לשחזר את זה!')) {
      setUserStats(INITIAL_STATS);
      localStorage.removeItem('misparia_stats_v2');
      alert('הנתונים אופסו בהצלחה!');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setPage={setCurrentPage} />;
      case 'game':
        return <GameArena userStats={userStats} updateStats={updateStats} />;
      case 'tutor':
        return <AITutor />;
      case 'progress':
        return <Progress stats={userStats} onReset={resetProgress} />;
      case 'lab':
        return <Lab />;
      default:
        return <Home setPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-900 text-slate-100">
      <Navbar setPage={setCurrentPage} currentPage={currentPage} userStats={userStats} onOpenSettings={() => setShowSettings(true)} />
      
      <main className="flex-grow">
        {renderPage()}
      </main>
      
      <footer className="bg-slate-950 border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
        <p>© 2024 מספרייה - ARCADE EDITION 🕹️</p>
      </footer>

      {/* Settings Modal (API KEY) */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-slate-800 border-2 border-slate-600 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-pop">
                  <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                      <X size={24} />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-6 text-yellow-400">
                      <Key size={32} />
                      <h2 className="text-2xl font-black">הגדרת מנוע AI</h2>
                  </div>

                  <p className="text-slate-300 mb-4 text-sm leading-relaxed">
                      כדי לקבל שאלות חכמות, אתגרים מותאמים אישית וצ'אט עם הבוט, צריך מפתח API של Google Gemini.
                  </p>

                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="block text-center bg-slate-700 hover:bg-slate-600 text-cyan-400 py-2 rounded-xl mb-6 text-sm font-mono border border-slate-600 transition-colors"
                  >
                      🔗 לחץ כאן להנפקת מפתח בחינם
                  </a>

                  <div className="space-y-4">
                      <input 
                        type="text" 
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="הדבק את המפתח כאן (AIza...)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none font-mono text-sm"
                      />
                      
                      <button 
                        onClick={handleSaveKey}
                        disabled={keyStatus === 'validating' || !apiKeyInput}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                            ${keyStatus === 'valid' ? 'bg-green-600 text-white' : 
                              keyStatus === 'invalid' ? 'bg-red-600 text-white' : 
                              'bg-yellow-500 hover:bg-yellow-400 text-slate-900'}`}
                      >
                          {keyStatus === 'validating' && <Loader2 className="animate-spin" />}
                          {keyStatus === 'valid' && <><Check /> מפתח נשמר!</>}
                          {keyStatus === 'invalid' && <><X /> מפתח שגוי</>}
                          {keyStatus === 'idle' && 'שמור והפעל מנוע'}
                      </button>
                  </div>

                  {hasStoredKey && (
                      <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                          <p className="text-green-400 text-sm mb-2 flex items-center justify-center gap-2"><Check size={14} /> יש מפתח שמור במערכת</p>
                          <button onClick={handleClearKey} className="text-red-400 text-xs hover:underline">מחק מפתח מהזיכרון</button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default App;