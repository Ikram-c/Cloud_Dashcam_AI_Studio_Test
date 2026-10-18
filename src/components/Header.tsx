import React from 'react';
import { Camera, Cloud, PlayCircle, Settings, Film, Image as ImageIcon, MapPin, Server } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isRunningJob: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, isRunningJob }) => {
  return (
    <header className="border-b border-[#30363d] bg-[#161b22]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => onSelectTab('welcome')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#1f6feb] to-[#238636] flex items-center justify-center p-2 shadow-md">
            <Cloud className="w-5 h-5 text-white absolute" />
            <Camera className="w-3.5 h-3.5 text-[#58a6ff] absolute -bottom-0.5 -right-0.5 bg-[#161b22] rounded-full p-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-[#e6edf3] tracking-tight group-hover:text-[#58a6ff] transition-colors">
                Cloud Optimised DashCam
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#30363d] text-[#8b949e]">
                v1.0 POC
              </span>
            </div>
            <div className="text-xs text-[#8b949e]">
              By AberTech · Quality-gated frame extraction
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => onSelectTab('welcome')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'welcome'
                ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectTab('configure')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'configure'
                ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pipeline Config</span>
          </button>

          <button
            onClick={() => onSelectTab('review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'review'
                ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Footage Review Overlay</span>
          </button>

          <button
            onClick={() => onSelectTab('gallery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'gallery'
                ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Extracted Frames</span>
          </button>

          <button
            onClick={() => onSelectTab('route')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'route'
                ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Carrier Coverage</span>
          </button>

          <button
            onClick={() => onSelectTab('cloud')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'cloud'
                ? 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40 shadow-sm'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Vertex Cloud</span>
          </button>
        </nav>

        {isRunningJob && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#d29922] animate-ping" />
            <span>Job Running</span>
          </div>
        )}
      </div>
    </header>
  );
};
