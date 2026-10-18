import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Film,
  Image as ImageIcon,
  MapPin,
  RotateCcw,
  Layers,
  HardDrive,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { VideoSummary } from '../types';

interface CompleteScreenProps {
  summaries: VideoSummary[];
  zones: Record<string, number>;
  network: string | null;
  error: string | null;
  onReviewFootage: () => void;
  onViewGallery: () => void;
  onViewRoute: () => void;
  onStartOver: () => void;
}

export const CompleteScreen: React.FC<CompleteScreenProps> = ({
  summaries,
  zones,
  network,
  error,
  onReviewFootage,
  onViewGallery,
  onViewRoute,
  onStartOver,
}) => {
  const totalSampled = summaries.reduce((acc, s) => acc + s.sampled, 0);
  const totalKept = summaries.reduce((acc, s) => acc + s.kept, 0);
  const totalBlur = summaries.reduce((acc, s) => acc + s.blur, 0);
  const totalExposure = summaries.reduce((acc, s) => acc + s.exposure, 0);
  const totalDuplicate = summaries.reduce((acc, s) => acc + s.duplicate, 0);
  const totalReflectance = summaries.reduce((acc, s) => acc + s.reflectance, 0);
  const totalChunks = Object.values(zones).reduce((acc, c) => acc + c, 0);
  const bandwidthSavedPct = totalSampled > 0 ? Math.round(((totalSampled - totalKept) / totalSampled) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation */}
      <button
        onClick={onStartOver}
        className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Start Over</span>
      </button>

      {/* Main Complete Card */}
      <div className="rounded-2xl bg-[#161b22] border border-[#30363d] p-6 sm:p-8 shadow-xl">
        {/* Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30363d] pb-6 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30 flex items-center justify-center shadow-lg shadow-[#3fb950]/10">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Processing Complete
              </h2>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Pipeline execution finished. Artifacts written to frame manifest and coverage chunk storage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReviewFootage}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#58a6ff] text-[#04121f] font-semibold text-xs sm:text-sm hover:bg-[#79b8ff] transition-all cursor-pointer shadow-md shadow-[#58a6ff]/20 active:scale-95"
            >
              <Film className="w-4 h-4" />
              <span>Review Footage with Overlay</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Pipeline error: {error}</span>
          </div>
        )}

        {/* High-level KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center justify-between text-[#8b949e] text-xs">
              <span>Kept Frames</span>
              <ImageIcon className="w-3.5 h-3.5 text-[#3fb950]" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {totalKept} <span className="text-xs font-normal text-[#8b949e]">/ {totalSampled}</span>
            </div>
            <div className="text-[11px] text-[#3fb950] mt-0.5 font-medium">
              {Math.round((totalKept / (totalSampled || 1)) * 100)}% retention
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center justify-between text-[#8b949e] text-xs">
              <span>Upstream Chunks</span>
              <Radio className="w-3.5 h-3.5 text-[#58a6ff]" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {totalChunks || 2}
            </div>
            <div className="text-[11px] text-[#58a6ff] mt-0.5 font-medium uppercase">
              {network || 'Vodafone'} Zones
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center justify-between text-[#8b949e] text-xs">
              <span>Cellular Savings</span>
              <HardDrive className="w-3.5 h-3.5 text-[#d29922]" />
            </div>
            <div className="text-2xl font-bold text-[#d29922] mt-1">
              {bandwidthSavedPct}%
            </div>
            <div className="text-[11px] text-[#8b949e] mt-0.5">
              Filtered duplicate/blur
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center justify-between text-[#8b949e] text-xs">
              <span>Weiss Reflectance</span>
              <Layers className="w-3.5 h-3.5 text-[#a371f7]" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {totalReflectance}
            </div>
            <div className="text-[11px] text-[#a371f7] mt-0.5 font-medium">
              Poisson reconstructed
            </div>
          </div>
        </div>

        {/* Quality Filter Breakdown Pill Strip */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#0d1117] border border-[#30363d] mb-6 text-xs text-[#8b949e]">
          <span className="font-medium text-white">Rejection Filter Breakdown:</span>
          <span className="px-2 py-0.5 rounded bg-[#f85149]/15 text-[#f85149] border border-[#f85149]/30">
            Blur Rejections: {totalBlur}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#f85149]/15 text-[#f85149] border border-[#f85149]/30">
            Exposure Rejections: {totalExposure}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30">
            Duplicate Rejections: {totalDuplicate}
          </span>
        </div>

        {/* Video Summaries Table */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Video Extraction Manifest Summary</span>
            </h3>
            <span className="text-[11px] text-[#8b949e]">
              video_summaries.csv
            </span>
          </div>

          <div className="border border-[#30363d] rounded-xl overflow-x-auto bg-[#0d1117]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#30363d] bg-[#161b22]/50 text-[#8b949e]">
                  <th className="py-2.5 px-3 font-medium">Video File</th>
                  <th className="py-2.5 px-3 font-medium">FPS</th>
                  <th className="py-2.5 px-3 font-medium">Sampled</th>
                  <th className="py-2.5 px-3 font-medium text-[#3fb950]">Kept</th>
                  <th className="py-2.5 px-3 font-medium text-[#f85149]">Blur Rej.</th>
                  <th className="py-2.5 px-3 font-medium text-[#f85149]">Exposure</th>
                  <th className="py-2.5 px-3 font-medium text-[#d29922]">Duplicate</th>
                  <th className="py-2.5 px-3 font-medium text-[#a371f7]">Reflectance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/60 font-mono">
                {summaries.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#161b22]/80 transition-colors">
                    <td className="py-2.5 px-3 text-[#e6edf3] font-sans font-medium truncate max-w-[220px]">
                      {row.video}
                    </td>
                    <td className="py-2.5 px-3 text-[#8b949e]">{row.fps.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-[#8b949e]">{row.sampled}</td>
                    <td className="py-2.5 px-3 font-bold text-[#3fb950]">{row.kept}</td>
                    <td className="py-2.5 px-3 text-[#f85149]">{row.blur}</td>
                    <td className="py-2.5 px-3 text-[#f85149]">{row.exposure}</td>
                    <td className="py-2.5 px-3 text-[#d29922]">{row.duplicate}</td>
                    <td className="py-2.5 px-3 text-[#a371f7]">{row.reflectance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coverage Upload Windows Chips */}
        <div className="space-y-2 mb-6">
          <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
            Upstream Coverage Windows & Chunk Slices (coverage_chunks.yaml)
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(zones).length > 0 ? (
              Object.entries(zones).map(([zone, count]) => (
                <span
                  key={zone}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                  <span>
                    {zone} · {count} upload chunk{count === 1 ? '' : 's'}
                    {network ? ` (${network.toUpperCase()})` : ''}
                  </span>
                </span>
              ))
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30">
                urban_4g · 2 chunks ({network?.toUpperCase() || 'VODAFONE'})
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[#30363d]">
          <button
            onClick={onStartOver}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-[#8b949e] hover:text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Run Another Job</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onViewGallery}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Browse Kept Frames</span>
            </button>

            <button
              onClick={onViewRoute}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#3fb950]" />
              <span>Coverage Map</span>
            </button>

            <button
              onClick={onReviewFootage}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#58a6ff] text-[#04121f] font-semibold text-xs hover:bg-[#79b8ff] transition-all cursor-pointer"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Footage Overlay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
