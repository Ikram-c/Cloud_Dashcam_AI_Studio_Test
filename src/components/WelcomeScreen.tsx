import React from 'react';
import { Play, Sliders, Film, ShieldCheck, Sun, Layers, Radio, Sparkles, Database } from 'lucide-react';

interface WelcomeScreenProps {
  onRunDemo: () => void;
  onConfigure: () => void;
  onReview: () => void;
  onSelectTab: (tab: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onRunDemo,
  onConfigure,
  onReview,
  onSelectTab,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#161b22] to-[#0d1117] border border-[#30363d] p-8 shadow-xl">
        {/* Mountain contour background effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/20 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Classical Computer Vision + Geospatial Telemetry</span>
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
              onClick={onRunDemo}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#58a6ff] text-[#04121f] font-semibold text-sm hover:bg-[#79b8ff] transition-all shadow-lg shadow-[#58a6ff]/20 cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run Local Demo</span>
            </button>

            <button
              onClick={onConfigure}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#21262d] text-[#e6edf3] font-semibold text-sm hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer active:scale-95"
            >
              <Sliders className="w-4 h-4" />
              <span>Configure Pipeline</span>
            </button>

            <button
              onClick={onReview}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#21262d] text-[#e6edf3] font-semibold text-sm hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer active:scale-95"
            >
              <Film className="w-4 h-4" />
              <span>Review Footage</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Architecture Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1 */}
        <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5 hover:border-[#58a6ff]/40 transition-colors">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/10 text-[#58a6ff] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-[#e6edf3]">Quality Gating System</h3>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Multi-stage frame rejection: Laplacian blur filter rejects motion smearing; log-domain cross-correlation
            neutralizes auto-gain exposure changes to drop stationary duplicates; mean intensity bounds eliminate over/underexposed extremes.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#58a6ff]">
            <span>Blur threshold: 60.0</span>
            <span>·</span>
            <span>Intensity: [25, 235]</span>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5 hover:border-[#3fb950]/40 transition-colors">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3fb950]/10 text-[#3fb950] flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-[#e6edf3]">NOAA Solar & Sky Illumination</h3>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Physics-informed expected brightness based on timestamp and GPS location. Computes solar elevation angle
            (NOAA algorithm) coupled with Open-Meteo cloud cover forecasts to dynamically adapt exposure tolerances rather than arbitrary thresholds.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#3fb950]">
            <span>Solar Elevation: 17.2° - 34.1°</span>
            <span>·</span>
            <span>Twilight cutoff: -4.0°</span>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5 hover:border-[#d29922]/40 transition-colors">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d29922]/10 text-[#d29922] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-[#e6edf3]">Weiss Intrinsic Reflectance</h3>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Implements the Maximum Likelihood estimator from Weiss (2001) on static segments. Computes temporal medians of log-gradient
            fields with Fourier pseudo-inverse Poisson reconstruction to isolate constant surface albedo free of shadows and transient glare.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#d29922]">
            <span>Stationary segments: 5 - 30 frames</span>
            <span>·</span>
            <span>Fourier reconstruction</span>
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5 hover:border-[#a371f7]/40 transition-colors">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#a371f7]/10 text-[#a371f7] flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-[#e6edf3]">Coverage-Aware Chunking</h3>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Correlates GPX track against cellular carrier coverage bboxes (Vodafone, EE, O2, Three). Uses sweep-line rectangle overlap
            and Liang-Barsky clipping to subdivide kept frames into time windows with reliable upstream bandwidth.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#a371f7]">
            <span>Sweep-line O((n+k) log n)</span>
            <span>·</span>
            <span>Liang-Barsky entry/exit</span>
          </div>
        </div>
      </div>

      {/* Quick Access to Datasets & Outputs */}
      <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#30363d] flex items-center justify-center text-[#8b949e]">
            <Database className="w-5 h-5 text-[#58a6ff]" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[#e6edf3]">Pre-extracted Test Fixtures Available</h4>
            <p className="text-xs text-[#8b949e]">
              12 high-resolution dashcam frames, CSV manifests, and kept slices YAML ready to inspect.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('gallery')}
            className="px-3 py-1.5 rounded-lg bg-[#21262d] text-xs font-medium text-[#e6edf3] hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer"
          >
            View Extracted Frames
          </button>
          <button
            onClick={() => onSelectTab('route')}
            className="px-3 py-1.5 rounded-lg bg-[#21262d] text-xs font-medium text-[#e6edf3] hover:bg-[#30363d] border border-[#30363d] transition-all cursor-pointer"
          >
            View Carrier Map
          </button>
        </div>
      </div>
    </div>
  );
};
