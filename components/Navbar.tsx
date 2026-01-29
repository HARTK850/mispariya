import React from 'react';
import { Page, UserStats } from '../types';
import { Home, Gamepad2, Bot, LayoutDashboard, FlaskConical, Coins, Key } from 'lucide-react';

interface NavbarProps {
  setPage: (page: Page) => void;
  currentPage: Page;
  userStats: UserStats;
  onOpenSettings: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ setPage, currentPage, userStats, onOpenSettings }) => {
  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'לובי', icon: <Home size={20} /> },
    { id: 'game', label: 'משחקים', icon: <Gamepad2 size={20} /> },
    { id: 'tutor', label: 'בוט', icon: <Bot size={20} /> },
    { id: 'lab', label: 'מעבדה', icon: <FlaskConical size={20} /> },
    { id: 'progress', label: 'פרופיל', icon: <LayoutDashboard size={20} /> },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => setPage('home')}>
            <span className="text-4xl mr-2 group-hover:animate-bounce-short">🕹️</span>
            <div>
                <h1 className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 tracking-tight" style={{textShadow: '0 0 20px rgba(168, 85, 247, 0.5)'}}>
                    מספרייה
                </h1>
                <span className="text-xs text-slate-400 font-mono">לומדים בכיף</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-2 space-x-reverse">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`relative flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 btn-3d
                  ${currentPage === item.id 
                    ? 'bg-indigo-600 text-white border-indigo-800 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                    : 'bg-slate-800 text-slate-400 border-slate-950 hover:bg-slate-700 hover:text-white'}`}
              >
                <span className="ml-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Side: Stats + Settings */}
          <div className="flex items-center space-x-3 space-x-reverse">
             {/* Key Button */}
             <button 
                onClick={onOpenSettings}
                className="p-2 rounded-xl bg-slate-800 border-b-4 border-slate-950 text-yellow-500 hover:bg-slate-700 hover:text-yellow-400 transition-all active:translate-y-1 active:border-b-0"
                title="הגדרת מנוע AI"
             >
                 <Key size={20} />
             </button>

            {/* Stats Pill */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700 space-x-3 space-x-reverse">
                <div className="flex items-center text-yellow-400 font-bold font-mono">
                    <Coins size={16} className="ml-1 fill-current" />
                    <span>{userStats.coins}</span>
                </div>
                <div className="w-px h-4 bg-slate-600"></div>
                <div className="flex items-center text-purple-400 font-bold text-xs">
                    <span>LVL {userStats.level}</span>
                </div>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
