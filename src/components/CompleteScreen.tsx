import React, { useState } from 'react';
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
  FileSpreadsheet,
  Download,
  Terminal,
  History,
} from 'lucide-react';
import { VideoSummary, ExtractRequest, StructuredLogEntry, CachedRunRecord } from '../types';

interface CompleteScreenProps {
  summaries: VideoSummary[];
  zones: Record<string, number>;
  network: string | null;
  error: string | null;
  activeConfig?: ExtractRequest;
  structuredLogs?: StructuredLogEntry[];
  runHistory?: CachedRunRecord[];
  onSelectCachedRun?: (record: CachedRunRecord) => void;
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
  activeConfig,
  structuredLogs = [],
  runHistory = [],
  onSelectCachedRun,
  onReviewFootage,
  onViewGallery,
  onViewRoute,
  onStartOver,
}) => {
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);

  const totalSampled = summaries.reduce((acc, s) => acc + s.sampled, 0);
  const totalKept = summaries.reduce((acc, s) => acc + s.kept, 0);
  const totalBlur = summaries.reduce((acc, s) => acc + s.blur, 0);
  const totalExposure = summaries.reduce((acc, s) => acc + s.exposure, 0);
  const totalDuplicate = summaries.reduce((acc, s) => acc + s.duplicate, 0);
  const totalReflectance = summaries.reduce((acc, s) => acc + s.reflectance, 0);
  const totalChunks = Object.values(zones).reduce((acc, c) => acc + c, 0);
  const bandwidthSavedPct =
    totalSampled > 0 ? Math.round(((totalSampled - totalKept) / totalSampled) * 100) : 0;

  const handleDownloadCsv = () => {
    const headers = [
      'video_path',
      'fps',
      'total_frames',
      'frames_sampled',
      'frames_kept',
      'frames_rejected_blur',
      'frames_rejected_exposure',
      'frames_rejected_duplicate',
      'reflectance_frames',
    ];
    const rows = summaries.map((s) =>
      [
        s.video,
        s.fps.toFixed(1),
        s.total_frames,
        s.sampled,
        s.kept,
        s.blur,
        s.exposure,
        s.duplicate,
        s.reflectance,
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video_summaries_${network || 'vodafone'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const enabledGateNames = activeConfig
    ? Object.entries(activeConfig.gates)
        .filter(([, on]) => on)
        .map(([k]) => k)
    : ['blur', 'exposure', 'duplicate', 'illumination', 'weiss', 'coverage'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        {runHistory.length > 1 && onSelectCachedRun && (
          <div className="flex items-center gap-2 text-xs">
            <History className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span className="text-[#8b949e]">Switch cached run:</span>
            <select
              onChange={(e) => {
                const found = runHistory.find((r) => r.id === e.target.value);
                if (found) onSelectCachedRun(found);
              }}
              className="bg-[#161b22] text-[#e6edf3] border border-[#30363d] rounded-lg px-2.5 py-1 text-xs font-mono tabular-nums focus:border-[#58a6ff] focus:outline-none"
            >
              {runHistory.map((r, idx) => (
                <option key={r.id} value={r.id}>
                  #{idx + 1} · {r.timestamp} · {r.network.toUpperCase()} ({r.totalKept}/{r.totalSampled} kept)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Complete Card */}
      <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-6 sm:p-8">
        {/* Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30363d] pb-6 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Processing Complete
              </h2>
              <p className="text-xs text-[#8b949e] mt-0.5 font-mono tabular-nums">
                Carrier: {(network || 'vodafone').toUpperCase()} · Sampling:{' '}
                {activeConfig?.sampling || 'frames_30'} · Active gates:{' '}
                {enabledGateNames.length > 0 ? enabledGateNames.join(', ') : 'None (All bypassed)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#e6edf3] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              onClick={onReviewFootage}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#58a6ff] text-[#04121f] font-semibold text-xs sm:text-sm hover:bg-[#79b8ff] transition-all cursor-pointer active:scale-95 whitespace-nowrap"
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
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
              {totalKept}{' '}
              <span className="text-xs font-normal text-[#8b949e]">/ {totalSampled}</span>
            </div>
            <div className="text-[11px] font-mono tabular-nums text-[#3fb950] mt-0.5 font-medium">
              {Math.round((totalKept / (totalSampled || 1)) * 100)}% retention
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center justify-between text-[#8b949e] text-xs">
              <span>Upstream Chunks</span>
              <Radio className="w-3.5 h-3.5 text-[#58a6ff]" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
              {totalChunks || 2}
            </div>
            <div className="text-[11px] font-mono text-[#58a6ff] mt-0.5 font-medium uppercase">
              {network || 'Vodafone'} Zones
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center justify-between text-[#8b949e] text-xs">
              <span>Cellular Savings</span>
              <HardDrive className="w-3.5 h-3.5 text-[#d29922]" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#d29922] mt-1">
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
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
              {totalReflectance}
            </div>
            <div className="text-[11px] text-[#a371f7] mt-0.5 font-medium">
              Poisson reconstructed
            </div>
          </div>
        </div>

        {/* Unboxed Quality Filter Breakdown Line */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] mb-6 text-xs font-mono tabular-nums text-[#8b949e]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans font-medium text-white">Rejection Breakdown:</span>
            <span className="text-[#f85149]">Blur Rejections: {totalBlur}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#f85149]">Exposure Rejections: {totalExposure}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#d29922]">Duplicate Rejections: {totalDuplicate}</span>
          </div>

          {structuredLogs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLogsDrawer((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-sans text-[#58a6ff] hover:underline cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showLogsDrawer ? 'Hide Run Logs' : `Inspect Run Logs (${structuredLogs.length})`}</span>
            </button>
          )}
        </div>

        {/* Expandable Run Log History Drawer */}
        {showLogsDrawer && structuredLogs.length > 0 && (
          <div className="mb-6 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 font-mono tabular-nums text-[11px] max-h-48 overflow-y-auto space-y-1">
            {structuredLogs.map((l, i) => (
              <div key={l.id || i} className="flex items-start gap-2 text-[#8b949e]">
                <span className="text-[#484f58] select-none">{String(i + 1).padStart(3, '0')}</span>
                <span>[{l.timestamp}]</span>
                <span className="text-[#58a6ff]">[{l.level}]</span>
                <span className="text-[#e6edf3]">{l.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Video Summaries Table */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#e6edf3] flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Video Extraction Manifest Summary</span>
            </h3>
            <span className="text-[11px] font-mono text-[#8b949e]">video_summaries.csv</span>
          </div>

          <div className="border border-[#30363d] rounded-xl overflow-x-auto bg-[#0d1117]">
            <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
              <thead>
                <tr className="border-b border-[#30363d] bg-[#161b22]/50 text-[#8b949e] font-sans">
                  <th className="py-2.5 px-3 font-medium">Video File</th>
                  <th className="py-2.5 px-3 font-medium text-right">FPS</th>
                  <th className="py-2.5 px-3 font-medium text-right">Sampled</th>
                  <th className="py-2.5 px-3 font-medium text-right text-[#3fb950]">Kept</th>
                  <th className="py-2.5 px-3 font-medium text-right text-[#f85149]">Blur Rej.</th>
                  <th className="py-2.5 px-3 font-medium text-right text-[#f85149]">Exposure</th>
                  <th className="py-2.5 px-3 font-medium text-right text-[#d29922]">Duplicate</th>
                  <th className="py-2.5 px-3 font-medium text-right text-[#a371f7]">Reflectance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/60">
                {summaries.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#161b22]/80 transition-colors">
                    <td className="py-2.5 px-3 text-[#e6edf3] font-sans font-medium truncate max-w-[220px]">
                      {row.video}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#8b949e]">{row.fps.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-right text-[#8b949e]">{row.sampled}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#3fb950]">{row.kept}</td>
                    <td className="py-2.5 px-3 text-right text-[#f85149]">{row.blur}</td>
                    <td className="py-2.5 px-3 text-right text-[#f85149]">{row.exposure}</td>
                    <td className="py-2.5 px-3 text-right text-[#d29922]">{row.duplicate}</td>
                    <td className="py-2.5 px-3 text-right text-[#a371f7]">{row.reflectance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coverage Upload Windows Metadata */}
        <div className="space-y-2 mb-6">
          <div className="text-xs font-semibold text-[#e6edf3]">
            Upstream Coverage Windows &amp; Chunk Slices (coverage_chunks.yaml)
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-[#3fb950] bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d]">
            {Object.entries(zones).length > 0 ? (
              Object.entries(zones).map(([zone, count], idx) => (
                <React.Fragment key={zone}>
                  {idx > 0 && <span className="text-[#30363d]">·</span>}
                  <span>
                    {zone}: {count} upload chunk{count === 1 ? '' : 's'}
                    {network ? ` (${network.toUpperCase()})` : ''}
                  </span>
                </React.Fragment>
              ))
            ) : (
              <span>
                urban_4g: 2 chunks ({network?.toUpperCase() || 'VODAFONE'})
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[#30363d]">
          <button
            type="button"
            onClick={onStartOver}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-[#8b949e] hover:text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Configure Another Run</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onViewGallery}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer whitespace-nowrap"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Browse Kept Frames</span>
            </button>

            <button
              type="button"
              onClick={onViewRoute}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#e6edf3] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-[#3fb950]" />
              <span>Coverage Map</span>
            </button>

            <button
              type="button"
              onClick={onReviewFootage}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#58a6ff] text-[#04121f] font-semibold text-xs hover:bg-[#79b8ff] transition-all cursor-pointer whitespace-nowrap"
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
