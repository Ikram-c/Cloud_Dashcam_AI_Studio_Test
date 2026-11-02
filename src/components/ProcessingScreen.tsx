import React, { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Cpu,
  ArrowDown,
  Clock,
  Activity,
  Timer,
  HardDrive,
  Pause,
  Play,
  SkipForward,
  Search,
  Copy,
  Download,
  Check,
  Gauge,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { JobState, LogLevel, StructuredLogEntry } from '../types';

interface ProcessingScreenProps {
  job: JobState;
  onPause: () => void;
  onResume: () => void;
  onStepForward: () => void;
  onChangeSpeed: (speed: 0.5 | 1 | 2) => void;
  onCancel?: () => void;
}

type LogFilterCategory = 'ALL' | 'PASS' | 'REJECT' | 'SYSTEM';

export type CanonicalSubsystem =
  | 'daemon'
  | 'scheduler'
  | 'worker'
  | 'telemetry'
  | 'quality'
  | 'weiss'
  | 'coverage';

const SUBSYSTEM_DEFINITIONS: {
  id: CanonicalSubsystem;
  label: string;
}[] = [
  { id: 'daemon', label: 'daemon' },
  { id: 'scheduler', label: 'scheduler' },
  { id: 'worker', label: 'worker' },
  { id: 'telemetry', label: 'telemetry' },
  { id: 'quality', label: 'quality' },
  { id: 'weiss', label: 'weiss' },
  { id: 'coverage', label: 'coverage' },
];

const ALL_SUBSYSTEM_IDS: CanonicalSubsystem[] = SUBSYSTEM_DEFINITIONS.map((s) => s.id);

/**
 * Normalizes raw subsystem strings (including legacy cached entries like 'quality.blur' or 'scanner')
 * into one of the canonical subsystem buckets.
 */
function normalizeSubsystem(raw: string): CanonicalSubsystem {
  const s = (raw || '').toLowerCase();
  if (s.includes('daemon') || s.includes('config') || s.includes('pipeline')) return 'daemon';
  if (s.includes('sched')) return 'scheduler';
  if (s.includes('worker') || s.includes('scanner') || s.includes('extract')) return 'worker';
  if (s.includes('telem') || s.includes('illum') || s.includes('sky')) return 'telemetry';
  if (s.includes('weiss') || s.includes('intrinsic')) return 'weiss';
  if (s.includes('cov') || s.includes('chunk')) return 'coverage';
  if (s.includes('qual') || s.includes('blur') || s.includes('expos')) return 'quality';
  return 'worker';
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  job,
  onPause,
  onResume,
  onStepForward,
  onChangeSpeed,
  onCancel,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const endOfLogsRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);

  // Log filtering & export controls
  const [logFilter, setLogFilter] = useState<LogFilterCategory>('ALL');
  const [activeSubsystems, setActiveSubsystems] = useState<CanonicalSubsystem[]>(ALL_SUBSYSTEM_IDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLogs, setCopiedLogs] = useState(false);

  const isPaused = job.state === 'paused';
  const elapsedSeconds = job.elapsedSeconds || 0;
  const completedSteps = Math.max(1, job.stepIndex || 1);
  const totalSteps = Math.max(1, job.totalSteps || 12);

  // Calculate velocity & step cadence from active elapsed seconds (frozen when paused)
  const deltaProgress = Math.max(0, job.progress - 0.05);
  const progressVelocity =
    elapsedSeconds > 0.2 && deltaProgress > 0.001 ? deltaProgress / elapsedSeconds : 0.14;
  const avgTimePerStep =
    elapsedSeconds > 0.1 ? elapsedSeconds / completedSteps : 0.6 / (job.speedMultiplier || 1);

  // Blended ETA calculation (frozen when paused)
  let estimatedRemainingSec: number | null = null;
  if (job.progress >= 1.0) {
    estimatedRemainingSec = 0;
  } else if (job.progress > 0.06) {
    const remainingFraction = Math.max(0, 1.0 - job.progress);
    const etaVelocity = progressVelocity > 0.005 ? remainingFraction / progressVelocity : 4.0;
    const remainingSteps = Math.max(0, totalSteps - completedSteps);
    const etaSteps = remainingSteps * avgTimePerStep;
    const blended = etaSteps > 0 ? etaVelocity * 0.6 + etaSteps * 0.4 : etaVelocity;
    estimatedRemainingSec = Math.max(0, Math.round(blended));
  }

  // Helper to scroll to bottom reliably
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (endOfLogsRef.current) {
      endOfLogsRef.current.scrollIntoView({ behavior, block: 'end' });
    } else if (logContainerRef.current) {
      logContainerRef.current.scrollTo({
        top: logContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Auto-scroll whenever logs change
  useEffect(() => {
    if (isAutoScrollActive) {
      scrollToBottom('smooth');
      const timer = setTimeout(() => {
        scrollToBottom('smooth');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [job.structuredLogs?.length, job.logs?.length, isAutoScrollActive]);

  // Detect user manual scrolling to pause/resume auto-scroll
  const handleScroll = () => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceToBottom > 30) {
      setHasScrolledUp(true);
      setIsAutoScrollActive(false);
    } else {
      setHasScrolledUp(false);
      setIsAutoScrollActive(true);
    }
  };

  const handleResumeAutoScroll = () => {
    setIsAutoScrollActive(true);
    setHasScrolledUp(false);
    scrollToBottom('smooth');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatEta = (secs: number | null) => {
    if (isPaused) {
      return secs !== null ? `Paused (${secs}s left)` : 'Paused';
    }
    if (secs === null) return 'Calculating…';
    if (secs <= 0) return 'Finishing up…';
    if (secs < 60) return `~${secs}s`;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `~${m}m ${s}s`;
  };

  // Toggle a subsystem on/off in the multi-select filter
  const toggleSubsystemFilter = (sub: CanonicalSubsystem) => {
    setActiveSubsystems((prev) =>
      prev.includes(sub) ? prev.filter((item) => item !== sub) : [...prev, sub]
    );
  };

  // Solo a single subsystem (or restore all if it was already the only one active)
  const soloSubsystemFilter = (sub: CanonicalSubsystem) => {
    setActiveSubsystems((prev) =>
      prev.length === 1 && prev[0] === sub ? ALL_SUBSYSTEM_IDS : [sub]
    );
  };

  const structuredLogs: StructuredLogEntry[] = job.structuredLogs || [];

  // Count entries per canonical subsystem
  const subsystemCounts: Record<CanonicalSubsystem, number> = {
    daemon: 0,
    scheduler: 0,
    worker: 0,
    telemetry: 0,
    quality: 0,
    weiss: 0,
    coverage: 0,
  };
  structuredLogs.forEach((entry) => {
    const norm = normalizeSubsystem(entry.subsystem);
    subsystemCounts[norm] = (subsystemCounts[norm] || 0) + 1;
  });

  // Filter structured logs by level, subsystem toggles, and search query
  const filteredLogs = structuredLogs.filter((entry) => {
    const normSub = normalizeSubsystem(entry.subsystem);
    if (!activeSubsystems.includes(normSub)) return false;

    if (logFilter === 'PASS' && entry.level !== 'PASS') return false;
    if (logFilter === 'REJECT' && entry.level !== 'REJECT' && entry.level !== 'WARN') return false;
    if (
      logFilter === 'SYSTEM' &&
      entry.level !== 'SYS' &&
      entry.level !== 'CHUNK' &&
      entry.level !== 'INFO'
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        entry.message.toLowerCase().includes(q) ||
        entry.subsystem.toLowerCase().includes(q) ||
        normSub.includes(q) ||
        entry.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map(
        (l, idx) =>
          `${String(idx + 1).padStart(3, '0')} [${l.timestamp}] (+${l.elapsedSec.toFixed(2)}s) [${
            l.level
          }] (${normalizeSubsystem(l.subsystem)}) ${l.message}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 1800);
  };

  const handleDownloadLogs = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      state: job.state,
      progress: job.progress,
      elapsedSeconds: job.elapsedSeconds,
      activeSubsystems,
      config: job.activeConfig,
      logs: filteredLogs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashcam-extraction-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const percentage = Math.round(job.progress * 100);
  const utilizationData =
    job.utilizationHistory && job.utilizationHistory.length > 0
      ? job.utilizationHistory
      : [{ time: '0s', cpu: 32, memory: 28 }];
  const currentCpu = utilizationData[utilizationData.length - 1]?.cpu ?? 32;
  const currentMemory = utilizationData[utilizationData.length - 1]?.memory ?? 28;

  const getLevelColorClass = (level: LogLevel) => {
    switch (level) {
      case 'PASS':
        return 'text-[#3fb950]';
      case 'REJECT':
        return 'text-[#f85149]';
      case 'WARN':
        return 'text-[#d29922]';
      case 'CHUNK':
        return 'text-[#58a6ff]';
      case 'SYS':
        return 'text-[#a371f7]';
      default:
        return 'text-[#e6edf3]';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-6 sm:p-8">
        {/* Header & Interactive Execution Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30363d] pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isPaused
                  ? 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/30'
                  : 'bg-[#58a6ff]/10 text-[#58a6ff] border-[#58a6ff]/30'
              }`}
            >
              {isPaused ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">
                  {isPaused ? 'Pipeline Paused' : 'Processing Pipeline'}
                </h2>
                <span className="text-xs font-mono tabular-nums text-[#8b949e]">
                  · Step {completedSteps} of {totalSteps} · {percentage}%
                </span>
              </div>
              <p className="text-xs text-[#8b949e] mt-0.5 font-mono">
                {job.video
                  ? `${isPaused ? 'Paused on' : 'Active:'} ${job.video}`
                  : 'Initializing pipeline runner & telemetry…'}
              </p>
            </div>
          </div>

          {/* Control Toolbar: Speed, Pause/Resume, Step Forward, Abort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Speed Multiplier Segmented Control */}
            <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
              <span className="px-2 text-[11px] text-[#8b949e] flex items-center gap-1">
                <Gauge className="w-3 h-3 text-[#58a6ff]" />
              </span>
              {([0.5, 1, 2] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => onChangeSpeed(spd)}
                  className={`px-2 py-1 rounded-md text-xs font-mono tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                    job.speedMultiplier === spd
                      ? 'bg-[#21262d] text-[#58a6ff] font-semibold'
                      : 'text-[#8b949e] hover:text-[#e6edf3]'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Pause / Resume Primary Toggle */}
            {isPaused ? (
              <button
                type="button"
                onClick={onResume}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3fb950] text-[#04121f] font-semibold text-xs hover:bg-[#4ac25b] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Job</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#d29922] text-[#04121f] font-semibold text-xs hover:bg-[#e3a82b] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Job</span>
              </button>
            )}

            {/* Single-Step Button (Enabled when Paused) */}
            <button
              type="button"
              onClick={onStepForward}
              disabled={!isPaused || job.progress >= 1.0}
              title="Advance exactly one pipeline stage while paused"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] text-[#e6edf3] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <SkipForward className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Step Forward</span>
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-[#8b949e] hover:text-[#f85149] transition-colors cursor-pointer px-3 py-1.5 rounded-lg bg-[#21262d] border border-[#30363d] whitespace-nowrap"
              >
                Abort Job
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Real-time Estimator Banner */}
        <div className="space-y-2 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-[#8b949e]">
            <span className="flex items-center gap-1.5 font-medium text-[#e6edf3]">
              <Activity className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Overall Batch Progress</span>
            </span>
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span className="text-[#8b949e]">
                Elapsed: <span className="text-[#e6edf3]">{formatTime(elapsedSeconds)}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  isPaused ? 'text-[#d29922]' : 'text-[#3fb950]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>ETA: {formatEta(estimatedRemainingSec)}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-white font-bold">{percentage}%</span>
            </div>
          </div>

          <div className="h-3 w-full bg-[#0d1117] rounded-full overflow-hidden border border-[#30363d] p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                isPaused
                  ? 'bg-gradient-to-r from-[#9e6a03] to-[#d29922]'
                  : 'bg-gradient-to-r from-[#1f6feb] to-[#58a6ff]'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Velocity & Log Cadence Unboxed Metadata */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-[#8b949e] font-mono tabular-nums pt-1">
            <div className="flex items-center gap-2">
              <span>
                Velocity:{' '}
                <span className="text-[#58a6ff]">
                  {isPaused ? '0.0%/s (Frozen)' : `${(progressVelocity * 100).toFixed(1)}%/s`}
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Pacing: <span className="text-[#d29922]">{avgTimePerStep.toFixed(2)}s / step</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Speed: <span className="text-[#e6edf3]">{job.speedMultiplier || 1}x</span>
              </span>
            </div>
            <div className="text-[11px] text-[#8b949e]">
              State saved in local cache
            </div>
          </div>
        </div>

        {/* Active Processing Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="text-[11px] text-[#8b949e] flex items-center justify-between">
              <span>Time Remaining</span>
              <Timer className={`w-3.5 h-3.5 ${isPaused ? 'text-[#d29922]' : 'text-[#3fb950]'}`} />
            </div>
            <div
              className={`text-sm font-mono tabular-nums font-bold mt-1 ${
                isPaused ? 'text-[#d29922]' : 'text-[#3fb950]'
              }`}
            >
              {formatEta(estimatedRemainingSec)}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-[#8b949e] mt-0.5">
              Active time: {formatTime(elapsedSeconds)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="text-[11px] text-[#8b949e]">Carrier Network</div>
            <div className="text-sm font-mono font-semibold text-[#58a6ff] mt-1 uppercase">
              {job.network || 'VODAFONE'}
            </div>
            <div className="text-[11px] text-[#8b949e] mt-0.5 truncate">
              Sampling: {job.activeConfig?.sampling || 'frames_30'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="text-[11px] text-[#8b949e]">Active Stream</div>
            <div
              className="text-sm font-mono font-semibold text-[#e6edf3] mt-1 truncate"
              title={job.video || ''}
            >
              {job.video || 'Preparing...'}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-[#8b949e] mt-0.5">
              30.0 FPS · 640x480
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="text-[11px] text-[#8b949e]">Quality Gates</div>
            <div className="text-sm font-mono tabular-nums font-semibold text-[#3fb950] mt-1">
              {job.activeConfig
                ? `${Object.values(job.activeConfig.gates).filter(Boolean).length}/6 Enabled`
                : '6/6 Enabled'}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-[#8b949e] mt-0.5">
              {structuredLogs.length} log events
            </div>
          </div>
        </div>

        {/* CPU & Memory Utilization Trend (Recharts Widget) */}
        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#58a6ff]" />
              <span className="text-xs font-semibold text-white">
                Resource Utilization Trend (CPU &amp; Memory)
              </span>
              {isPaused && (
                <span className="text-[11px] font-mono text-[#d29922]">
                  · Idle Standby (Worker Paused)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
              <span className="text-[#58a6ff]">CPU: {currentCpu}%</span>
              <span aria-hidden="true" className="text-[#30363d]">
                ·
              </span>
              <span className="text-[#a371f7] flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                <span>RAM: {currentMemory}%</span>
              </span>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={utilizationData}
                margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#58a6ff" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a371f7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a371f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#30363d' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#484f58"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#30363d' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#e6edf3',
                  }}
                  itemStyle={{ padding: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU Load (%)"
                  stroke="#58a6ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cpuGradient)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  name="RAM Usage (%)"
                  stroke="#a371f7"
                  strokeWidth={1.8}
                  fillOpacity={1}
                  fill="url(#memGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#8b949e] font-mono tabular-nums mt-2 pt-2 border-t border-[#30363d]/50">
            <span>
              {isPaused
                ? 'Worker threads suspended — CPU dropped to idle while RAM holds frame buffers'
                : 'Peak loads correlate with OpenCV decode & Weiss Poisson Fourier reconstruction'}
            </span>
            <span>600ms telemetry</span>
          </div>
        </div>

        {/* Structured Execution Logs with Level Tabs, Subsystem Toggle Filters, Search & Export */}
        <div className="space-y-3 relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Level Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#0d1117] border border-[#30363d] rounded-lg">
              {(
                [
                  { id: 'ALL', label: `All (${structuredLogs.length})` },
                  {
                    id: 'PASS',
                    label: `Kept (${structuredLogs.filter((l) => l.level === 'PASS').length})`,
                  },
                  {
                    id: 'REJECT',
                    label: `Rejected / Warn (${
                      structuredLogs.filter((l) => l.level === 'REJECT' || l.level === 'WARN')
                        .length
                    })`,
                  },
                  {
                    id: 'SYSTEM',
                    label: `System & Chunks (${
                      structuredLogs.filter(
                        (l) => l.level === 'SYS' || l.level === 'CHUNK' || l.level === 'INFO'
                      ).length
                    })`,
                  },
                ] as { id: LogFilterCategory; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLogFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    logFilter === tab.id
                      ? 'bg-[#21262d] text-[#e6edf3] shadow-sm'
                      : 'text-[#8b949e] hover:text-[#e6edf3]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Export Toolbar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter logs..."
                  className="bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg pl-8 pr-2.5 py-1 text-xs focus:border-[#58a6ff] focus:outline-none w-36 sm:w-44"
                />
              </div>

              <button
                type="button"
                onClick={handleCopyLogs}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs text-[#e6edf3] cursor-pointer whitespace-nowrap"
                title="Copy visible logs to clipboard"
              >
                {copiedLogs ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#3fb950]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#8b949e]" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadLogs}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs text-[#e6edf3] cursor-pointer whitespace-nowrap"
                title="Export logs and run telemetry as JSON"
              >
                <Download className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Subsystem Multi-Toggle Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8b949e] mr-1">
                <Filter className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span>Subsystems:</span>
              </span>

              {SUBSYSTEM_DEFINITIONS.map((sub) => {
                const isSelected = activeSubsystems.includes(sub.id);
                const count = subsystemCounts[sub.id] || 0;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubsystemFilter(sub.id)}
                    onDoubleClick={() => soloSubsystemFilter(sub.id)}
                    title={`Click to toggle '${sub.label}' logs (double-click to solo)`}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono tabular-nums transition-colors cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/40 font-semibold'
                        : 'bg-[#161b22]/60 text-[#8b949e]/60 border-[#30363d]/60 hover:text-[#e6edf3]'
                    }`}
                  >
                    {sub.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveSubsystems(ALL_SUBSYSTEM_IDS)}
                disabled={activeSubsystems.length === ALL_SUBSYSTEM_IDS.length}
                className="text-[#58a6ff] hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer whitespace-nowrap"
              >
                All ({ALL_SUBSYSTEM_IDS.length})
              </button>
              <span className="text-[#30363d]">·</span>
              <button
                type="button"
                onClick={() => setActiveSubsystems([])}
                disabled={activeSubsystems.length === 0}
                className="text-[#8b949e] hover:text-[#e6edf3] hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer whitespace-nowrap"
              >
                Mute All
              </button>
            </div>
          </div>

          {/* Log Stream Container */}
          <div className="relative">
            <div
              ref={logContainerRef}
              onScroll={handleScroll}
              className="h-60 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 font-mono tabular-nums text-[11px] text-[#8b949e] overflow-y-auto space-y-1.5 leading-relaxed scroll-smooth"
            >
              {filteredLogs.length > 0 ? (
                filteredLogs.map((entry, idx) => {
                  const canonicalSub = normalizeSubsystem(entry.subsystem);
                  return (
                    <div
                      key={entry.id || idx}
                      className="flex items-start gap-2 hover:bg-[#161b22]/60 px-1.5 py-0.5 rounded transition-colors"
                    >
                      <span className="text-[#484f58] select-none shrink-0">
                        {String(idx + 1).padStart(3, '0')}
                      </span>
                      <span className="text-[#8b949e]/70 shrink-0">[{entry.timestamp}]</span>
                      <span
                        className={`font-semibold shrink-0 w-14 ${getLevelColorClass(entry.level)}`}
                      >
                        [{entry.level}]
                      </span>
                      <button
                        type="button"
                        onClick={() => soloSubsystemFilter(canonicalSub)}
                        title={`Click to solo (${canonicalSub}) subsystem`}
                        className="text-[#58a6ff]/90 hover:text-[#58a6ff] hover:underline shrink-0 cursor-pointer text-left"
                      >
                        ({canonicalSub})
                      </button>
                      <span className={getLevelColorClass(entry.level)}>{entry.message}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[#8b949e]/60 italic py-6 text-center space-y-2">
                  <div>No log entries match the active subsystem or search filters.</div>
                  {activeSubsystems.length < ALL_SUBSYSTEM_IDS.length && (
                    <button
                      type="button"
                      onClick={() => setActiveSubsystems(ALL_SUBSYSTEM_IDS)}
                      className="text-xs font-sans text-[#58a6ff] hover:underline cursor-pointer"
                    >
                      Reset Subsystem Filters
                    </button>
                  )}
                </div>
              )}
              {/* Invisible sentinel anchor ensuring auto-scroll always hits absolute bottom */}
              <div ref={endOfLogsRef} className="h-0 w-0" />
            </div>

            {/* Resume Auto-scroll floating button if user scrolled up */}
            {hasScrolledUp && (
              <button
                type="button"
                onClick={handleResumeAutoScroll}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-sans font-medium shadow-lg transition-transform active:scale-95 cursor-pointer z-10"
              >
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                <span>Jump to newest</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
