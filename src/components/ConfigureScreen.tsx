import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Info, AlertTriangle, RotateCcw } from 'lucide-react';
import { ExtractRequest, QualityGates } from '../types';
import { CARRIER_NETWORKS } from '../data/mockData';
import { buildDynamicSimulationPlan, DEFAULT_EXTRACT_REQUEST } from '../utils/simulationEngine';

interface ConfigureScreenProps {
  initialConfig: ExtractRequest;
  onConfigChange: (config: ExtractRequest) => void;
  onResetConfig: () => void;
  onBack: () => void;
  onStartExtraction: (request: ExtractRequest) => void;
  isLoading?: boolean;
}

export const ConfigureScreen: React.FC<ConfigureScreenProps> = ({
  initialConfig,
  onConfigChange,
  onResetConfig,
  onBack,
  onStartExtraction,
  isLoading = false,
}) => {
  const [videoDir, setVideoDir] = useState(initialConfig.videos || 'test_data/videos');
  const [outputDir, setOutputDir] = useState(initialConfig.output || 'extracted_frames');
  const [gpxSource, setGpxSource] = useState<'config' | 'local' | 'mock' | 'none'>(
    initialConfig.gpx_source || 'local'
  );
  const [gpxPath, setGpxPath] = useState(initialConfig.gpx_path || 'test_data/track.gpx');
  const [network, setNetwork] = useState(initialConfig.network || 'vodafone');
  const [sampling, setSampling] = useState(initialConfig.sampling || 'frames_30');
  const [gates, setGates] = useState<QualityGates>(
    initialConfig.gates || DEFAULT_EXTRACT_REQUEST.gates
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync changes to parent & localStorage cache
  useEffect(() => {
    const updated: ExtractRequest = {
      videos: videoDir,
      output: outputDir,
      gpx_source: gpxSource,
      gpx_path: gpxSource === 'local' ? gpxPath : undefined,
      network,
      sampling,
      gates,
    };
    onConfigChange(updated);
  }, [videoDir, outputDir, gpxSource, gpxPath, network, sampling, gates]);

  const toggleGate = (key: keyof QualityGates) => {
    setGates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetDefaults = () => {
    setVideoDir(DEFAULT_EXTRACT_REQUEST.videos!);
    setOutputDir(DEFAULT_EXTRACT_REQUEST.output!);
    setGpxSource(DEFAULT_EXTRACT_REQUEST.gpx_source!);
    setGpxPath(DEFAULT_EXTRACT_REQUEST.gpx_path!);
    setNetwork(DEFAULT_EXTRACT_REQUEST.network!);
    setSampling(DEFAULT_EXTRACT_REQUEST.sampling!);
    setGates(DEFAULT_EXTRACT_REQUEST.gates);
    onResetConfig();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoDir.trim()) {
      setValidationError('Please specify a video directory path.');
      return;
    }
    if (!outputDir.trim()) {
      setValidationError('Please specify an output directory path.');
      return;
    }
    setValidationError(null);

    const request: ExtractRequest = {
      videos: videoDir,
      output: outputDir,
      gpx_source: gpxSource,
      gpx_path: gpxSource === 'local' ? gpxPath : undefined,
      network,
      sampling,
      gates,
    };

    onStartExtraction(request);
  };

  const carrierZones = CARRIER_NETWORKS[network] || {};

  // Live preview of dynamic outcome based on current selections
  const previewPlan = buildDynamicSimulationPlan({
    videos: videoDir,
    output: outputDir,
    gpx_source: gpxSource,
    gpx_path: gpxPath,
    network,
    sampling,
    gates,
  });
  const previewTotalSampled = previewPlan.summaries.reduce((a, b) => a + b.sampled, 0);
  const previewTotalKept = previewPlan.summaries.reduce((a, b) => a + b.kept, 0);
  const previewSavingsPct =
    previewTotalSampled > 0
      ? Math.round(((previewTotalSampled - previewTotalKept) / previewTotalSampled) * 100)
      : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </button>

      <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Pipeline Configuration</h2>
            <p className="text-xs text-[#8b949e] mt-1">
              Settings auto-save to browser storage and dynamically drive extraction simulation outcomes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs text-[#8b949e] hover:text-[#e6edf3] transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paths Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
                Video Directory (Server / Mount Path)
              </label>
              <input
                type="text"
                value={videoDir}
                onChange={(e) => setVideoDir(e.target.value)}
                placeholder="e.g. /data/survey_2024_03"
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono focus:border-[#58a6ff] focus:outline-none focus:ring-1 focus:ring-[#58a6ff]"
              />
              <span className="text-[11px] text-[#8b949e]/80 mt-1 block">
                Supports .mp4 · .mov · .avi · .mkv
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
                Output Directory
              </label>
              <input
                type="text"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                placeholder="e.g. /data/extracted"
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono focus:border-[#58a6ff] focus:outline-none focus:ring-1 focus:ring-[#58a6ff]"
              />
              <span className="text-[11px] text-[#8b949e]/80 mt-1 block">
                Manifests, kept slices, and frames saved here
              </span>
            </div>
          </div>

          {/* Telemetry & Carrier Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#30363d]/60 pt-4">
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
                GPX Telemetry Source
              </label>
              <select
                value={gpxSource}
                onChange={(e) => setGpxSource(e.target.value as any)}
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs focus:border-[#58a6ff] focus:outline-none"
              >
                <option value="config">As configured in config.yaml</option>
                <option value="local">Local GPX track file</option>
                <option value="mock">Mock GCS (synthetic track)</option>
                <option value="none">None (fixed-location fallback)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
                Mobile Network (Coverage)
              </label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs capitalize focus:border-[#58a6ff] focus:outline-none"
              >
                {Object.keys(CARRIER_NETWORKS).map((car) => (
                  <option key={car} value={car}>
                    {car.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5">
                Sampling Rate
              </label>
              <select
                value={sampling}
                onChange={(e) => setSampling(e.target.value)}
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs focus:border-[#58a6ff] focus:outline-none"
              >
                <option value="frames_30">Every 30 frames (~1.0s at 30fps)</option>
                <option value="frames_10">Every 10 frames (~0.33s)</option>
                <option value="seconds_1">Every 1.0 second</option>
                <option value="seconds_2">Every 2.0 seconds</option>
              </select>
            </div>
          </div>

          {/* Conditional Local GPX Path */}
          {gpxSource === 'local' && (
            <div className="bg-[#0d1117] p-3 rounded-xl border border-[#30363d]/80">
              <label className="block text-xs font-medium text-[#8b949e] mb-1">
                Local GPX File Path
              </label>
              <input
                type="text"
                value={gpxPath}
                onChange={(e) => setGpxPath(e.target.value)}
                placeholder="/data/tracks/day1.gpx"
                className="w-full bg-[#161b22] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs font-mono focus:border-[#58a6ff] focus:outline-none"
              />
            </div>
          )}

          {/* Carrier Active Zones Metadata */}
          <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d] flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#8b949e]">
              <Info className="w-4 h-4 text-[#58a6ff]" />
              <span>Active {network.toUpperCase()} Coverage Bounding Boxes:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums text-[#3fb950]">
              {Object.keys(carrierZones).map((zoneName, idx) => (
                <React.Fragment key={zoneName}>
                  {idx > 0 && <span className="text-[#30363d]">·</span>}
                  <span>
                    {zoneName} [{carrierZones[zoneName].map((v) => v.toFixed(2)).join(', ')}]
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Quality Gates Section */}
          <div className="border-t border-[#30363d]/60 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#e6edf3]">
                  Estimation &amp; Quality Gates
                </h3>
                <p className="text-xs text-[#8b949e]">
                  Toggle gates on or off to observe live differences in frame retention and bandwidth savings.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setGates({
                      blur: true,
                      exposure: true,
                      duplicate: true,
                      illumination: true,
                      weiss: true,
                      coverage: true,
                    })
                  }
                  className="text-xs text-[#58a6ff] hover:underline cursor-pointer"
                >
                  Enable All
                </button>
                <span className="text-[#30363d]">·</span>
                <button
                  type="button"
                  onClick={() =>
                    setGates({
                      blur: false,
                      exposure: false,
                      duplicate: false,
                      illumination: false,
                      weiss: false,
                      coverage: false,
                    })
                  }
                  className="text-xs text-[#8b949e] hover:text-[#e6edf3] hover:underline cursor-pointer"
                >
                  Disable All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'blur',
                  label: 'Blur Gate',
                  desc: 'Laplacian variance >= 60.0',
                },
                {
                  id: 'exposure',
                  label: 'Exposure Gate',
                  desc: 'Intensity limits [25, 235]',
                },
                {
                  id: 'duplicate',
                  label: 'Duplicate Gate',
                  desc: 'Log-domain cross-correlation',
                },
                {
                  id: 'illumination',
                  label: 'Illumination',
                  desc: 'NOAA solar + Open-Meteo sky',
                },
                {
                  id: 'weiss',
                  label: 'Weiss Recovery',
                  desc: 'Intrinsic reflectance albedo',
                },
                {
                  id: 'coverage',
                  label: 'Coverage Chunks',
                  desc: 'Sweep-line + Liang-Barsky',
                },
              ].map(({ id, label, desc }) => {
                const isChecked = gates[id as keyof QualityGates];
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => toggleGate(id as keyof QualityGates)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-[#1f242c] border-[#58a6ff]/50'
                        : 'bg-[#0d1117] border-[#30363d] opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-[#30363d] text-[#58a6ff] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#e6edf3]">{label}</div>
                      <div className="text-[11px] text-[#8b949e] mt-0.5">{desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Dynamic Impact Preview Bar */}
          <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#e6edf3]">
                Projected Run Impact (5 Survey Videos)
              </div>
              <div className="text-[11px] text-[#8b949e] mt-0.5">
                Calculated dynamically from your selected sampling interval and active quality gates
              </div>
            </div>
            <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
              <span className="text-[#8b949e]">
                Sampled: <strong className="text-[#e6edf3]">{previewTotalSampled}</strong>
              </span>
              <span aria-hidden="true" className="text-[#30363d]">·</span>
              <span className="text-[#8b949e]">
                Kept: <strong className="text-[#3fb950]">{previewTotalKept}</strong>
              </span>
              <span aria-hidden="true" className="text-[#30363d]">·</span>
              <span className="text-[#8b949e]">
                Bandwidth Saved: <strong className="text-[#d29922]">{previewSavingsPct}%</strong>
              </span>
            </div>
          </div>

          {validationError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149] text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#8b949e] hover:text-[#e6edf3] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#58a6ff] text-[#04121f] font-semibold text-xs sm:text-sm hover:bg-[#79b8ff] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLoading ? 'Starting Pipeline...' : 'Start Extraction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
