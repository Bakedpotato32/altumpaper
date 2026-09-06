import React from 'react';
import { Home, Edit3, Sparkles, Upload, Bookmark, Eye } from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-white/75 backdrop-blur-xl border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.1)] rounded-3xl p-1.5 flex items-center justify-around z-50 no-print">
      {[
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'editor', icon: Edit3, label: 'Editor' },
        { id: 'prompt', icon: Sparkles, label: 'AI' },
        { id: 'import', icon: Upload, label: 'Import' },
        { id: 'bank', icon: Bookmark, label: 'Bank' },
        { id: 'preview', icon: Eye, label: 'Preview' },
      ].map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all duration-200 ${
              isActive 
                ? 'bg-blue-500/15 text-blue-600 font-bold shadow-sm' 
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
            {isActive && (
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5 animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
