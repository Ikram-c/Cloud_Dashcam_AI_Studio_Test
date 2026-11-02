import React from 'react';
import {
  Play,
  Sliders,
  Film,
  ShieldCheck,
  Sun,
  Layers,
  Radio,
  Database,
  History,
  Trash2,
  ArrowRight,
  PauseCircle,
} from 'lucide-react';
import { CachedRunRecord, JobState } from '../types';

interface WelcomeScreenProps {
  onRunDemo: () => void;
  onConfigure: () => void;
  onReview: () => void;
  onSelectTab: (tab: string) => void;
  activeJob?: JobState;
  runHistory?: CachedRunRecord[];
  onInspectCachedRun?: (record: CachedRunRecord) => void;
  onClearHistory?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onRunDemo,
  onConfigure,
  onReview,
  onSelectTab,
  activeJob,
  runHistory = [],
  onInspectCachedRun,
  onClearHistory,
}) => {
  const hasInProgressJob =
    activeJob && (activeJob.state === 'running' || activeJob.state === 'paused');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Resume Cached In-Progress / Paused Job Banner */}
      {hasInProgressJob && (
        <div className="rounded-xl bg-[#161b22] border border-[#d29922]/50 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#d29922]/15 text-[#d29922] flex items-center justify-center">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {activeJob.state === 'paused'
                  ? 'Paused Extraction Session Restored from Cache'
                  : 'Extraction Session Currently Running'}
              </div>
              <div className="text-xs text-[#8b949e] font-mono tabular-nums mt-0.5">
                Progress: {Math.round(activeJob.progress * 100)}% · Carrier:{' '}
                {(activeJob.network || 'vodafone').toUpperCase()} · Step {activeJob.stepIndex}/
                {activeJob.totalSteps}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('processing')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#d29922] text-[#04121f] font-semibold text-xs hover:bg-[#e3a82b] transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Return to Processing View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-xl bg-[#161b22] border border-[#30363d] p-8">
        {/* Mountain contour background effect */}
        <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
          <svg
            className="absolute bottom-0 w-full text-[#58a6ff]"
            viewBox="0 0 1200 240"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,180 L180,90 L320,150 L520,40 L700,160 L850,70 L1020,130 L1200,20 L1200,240 L0,240 Z" />
            <path
              d="M0,200 L240,140 L450,190 L680,100 L900,180 L1200,80 L1200,240 L0,240 Z"
              fill="#3fb950"
              opacity="0.3"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="text-xs font-medium text-[#58a6ff] mb-3">
            Classical Computer Vision · Geospatial Telemetry · AberTech POC
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Cloud Optimised DashCam
          </h1>
          <p className="text-[#8b949e] text-base leading-relaxed mb-8">
            Quality-gated, illumination-aware, coverage-chunked frame extraction from vehicle-mounted video.
            Extract clean frames, eliminate blur and auto-gain duplicates, and partition buffered frames into
            sustainable cellular upstream windows.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRunDemo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#58a6ff] text-[#04121f] font-semibold text-sm hover:bg-[#79b8ff] transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run Local Demo</span>
            </button>

            <button
              type="button"
              onClick={onConfigure}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#21262d] text-[#e6edf3] font-semibold text-sm hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Sliders className="w-4 h-4" />
              <span>Configure Pipeline</span>
            </button>

            <button
              type="button"
              onClick={onReview}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#21262d] text-[#e6edf3] font-semibold text-sm hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Film className="w-4 h-4" />
              <span>Review Footage</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Architecture Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/10 text-[#58a6ff] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-[#e6edf3]">01. Quality Gating System</h3>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Multi-stage frame rejection: Laplacian blur filter rejects motion smearing; log-domain cross-correlation
            neutralizes auto-gain exposure changes to drop stationary duplicates; mean intensity bounds eliminate over/underexposed extremes.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-[#58a6ff]">
            <span>Blur threshold: 60.0</span>
            <span aria-hidden="true">·</span>
            <span>Intensity: [25, 235]</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3fb950]/10 text-[#3fb950] flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-[#e6edf3]">02. NOAA Solar &amp; Sky Illumination</h3>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Physics-informed expected brightness based on timestamp and GPS location. Computes solar elevation angle
            (NOAA algorithm) coupled with Open-Meteo cloud cover forecasts to dynamically adapt exposure tolerances rather than arbitrary thresholds.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-[#3fb950]">
            <span>Solar Elevation: 17.2° - 34.1°</span>
            <span aria-hidden="true">·</span>
            <span>Twilight cutoff: -4.0°</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d29922]/10 text-[#d29922] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-[#e6edf3]">03. Weiss Intrinsic Reflectance</h3>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Implements the Maximum Likelihood estimator from Weiss (2001) on static segments. Computes temporal medians of log-gradient
            fields with Fourier pseudo-inverse Poisson reconstruction to isolate constant surface albedo free of shadows and transient glare.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-[#d29922]">
            <span>Stationary segments: 5 - 30 frames</span>
            <span aria-hidden="true">·</span>
            <span>Fourier reconstruction</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#a371f7]/10 text-[#a371f7] flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-[#e6edf3]">04. Coverage-Aware Chunking</h3>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Correlates GPX track against cellular carrier coverage bboxes (Vodafone, EE, O2, Three). Uses sweep-line rectangle overlap
            and Liang-Barsky clipping to subdivide kept frames into time windows with reliable upstream bandwidth.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-[#a371f7]">
            <span>Sweep-line O((n+k) log n)</span>
            <span aria-hidden="true">·</span>
            <span>Liang-Barsky entry/exit</span>
          </div>
        </div>
      </div>

      {/* Cached Extraction Run History */}
      {runHistory.length > 0 && (
        <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#58a6ff]" />
              <h3 className="font-semibold text-sm text-[#e6edf3]">
                Cached Extraction Runs ({runHistory.length})
              </h3>
            </div>
            {onClearHistory && (
              <button
                type="button"
                onClick={onClearHistory}
                className="inline-flex items-center gap-1 text-xs text-[#8b949e] hover:text-[#f85149] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cache</span>
              </button>
            )}
          </div>

          <div className="border border-[#30363d] rounded-lg overflow-x-auto bg-[#0d1117]">
            <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
              <thead>
                <tr className="border-b border-[#30363d] bg-[#161b22]/60 text-[#8b949e] font-sans">
                  <th className="py-2 px-3 font-medium">Run Timestamp</th>
                  <th className="py-2 px-3 font-medium">Carrier</th>
                  <th className="py-2 px-3 font-medium">Sampling</th>
                  <th className="py-2 px-3 font-medium">Active Gates</th>
                  <th className="py-2 px-3 font-medium text-right">Kept / Sampled</th>
                  <th className="py-2 px-3 font-medium text-right">Saved</th>
                  <th className="py-2 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/60">
                {runHistory.map((run) => {
                  const activeGateCount = Object.values(run.config.gates).filter(Boolean).length;
                  return (
                    <tr key={run.id} className="hover:bg-[#161b22]/80 transition-colors">
                      <td className="py-2 px-3 text-[#e6edf3]">{run.timestamp}</td>
                      <td className="py-2 px-3 text-[#58a6ff] uppercase">{run.network}</td>
                      <td className="py-2 px-3 text-[#8b949e]">
                        {run.config.sampling || 'frames_30'}
                      </td>
                      <td className="py-2 px-3 text-[#8b949e]">{activeGateCount}/6 gates</td>
                      <td className="py-2 px-3 text-right text-[#3fb950]">
                        {run.totalKept} / {run.totalSampled}
                      </td>
                      <td className="py-2 px-3 text-right text-[#d29922]">
                        {run.bandwidthSavedPct}%
                      </td>
                      <td className="py-2 px-3 text-right font-sans">
                        {onInspectCachedRun && (
                          <button
                            type="button"
                            onClick={() => onInspectCachedRun(run)}
                            className="text-xs text-[#58a6ff] hover:underline cursor-pointer"
                          >
                            Load Run
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Access to Datasets & Outputs */}
      <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#30363d]/60 flex items-center justify-center text-[#58a6ff]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[#e6edf3]">
              Pre-extracted Test Fixtures Available
            </h4>
            <p className="text-xs text-[#8b949e]">
              12 high-resolution dashcam frames, CSV manifests, and kept slices YAML ready to inspect.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectTab('gallery')}
            className="px-3.5 py-2 rounded-lg bg-[#21262d] text-xs font-medium text-[#e6edf3] hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer whitespace-nowrap"
          >
            View Extracted Frames
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('route')}
            className="px-3.5 py-2 rounded-lg bg-[#21262d] text-xs font-medium text-[#e6edf3] hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer whitespace-nowrap"
          >
            View Carrier Map
          </button>
        </div>
      </div>
    </div>
  );
};
