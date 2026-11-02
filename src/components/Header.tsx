import React from 'react';
import { Camera, Cloud, PlayCircle, Settings, Film, Image as ImageIcon, MapPin, Server, PauseCircle } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  jobState: 'idle' | 'running' | 'paused' | 'done' | 'failed';
  progressPct?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  jobState,
  progressPct = 0,
}) => {
  return (
    <header className="border-b border-[#30363d] bg-[#161b22]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
        {/* Zone 1: Brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('welcome')}
          className="flex items-center gap-2.5 cursor-pointer group text-left whitespace-nowrap shrink-0"
        >
          <div className="relative w-8 h-8 rounded-lg bg-[#1f6feb]/20 border border-[#58a6ff]/40 flex items-center justify-center">
            <Cloud className="w-4 h-4 text-[#58a6ff]" />
            <Camera className="w-3 h-3 text-[#3fb950] absolute -bottom-0.5 -right-0.5 bg-[#161b22] rounded-full p-0.5" />
          </div>
          <span className="font-semibold text-base text-[#e6edf3] tracking-tight group-hover:text-[#58a6ff] transition-colors">
            Cloud Optimised DashCam
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => onSelectTab('welcome')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'welcome'
                ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/40'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('configure')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'configure'
                ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/40'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pipeline Config</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'review'
                ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/40'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Footage Review</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('gallery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'gallery'
                ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/40'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Extracted Frames</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('route')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'route'
                ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/40'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Carrier Coverage</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('cloud')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'cloud'
                ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/40'
                : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d]/40'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Vertex Cloud</span>
          </button>
        </nav>

        {/* Zone 3: Active Job Action / Primary CTA */}
        <div className="shrink-0">
          {jobState === 'running' ? (
            <button
              type="button"
              onClick={() => onSelectTab('processing')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/40 text-xs font-mono tabular-nums cursor-pointer whitespace-nowrap"
            >
              <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-ping" />
              <span>Running · {progressPct}%</span>
            </button>
          ) : jobState === 'paused' ? (
            <button
              type="button"
              onClick={() => onSelectTab('processing')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/40 text-xs font-mono tabular-nums cursor-pointer whitespace-nowrap"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Paused · {progressPct}%</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectTab('configure')}
              className="px-3.5 py-1.5 rounded-lg bg-[#58a6ff] text-[#04121f] font-semibold text-xs hover:bg-[#79b8ff] transition-colors cursor-pointer whitespace-nowrap"
            >
              New Extraction
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
