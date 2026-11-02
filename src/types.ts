export interface QualityGates {
  blur: boolean;
  exposure: boolean;
  duplicate: boolean;
  illumination: boolean;
  weiss: boolean;
  coverage: boolean;
}

export interface ExtractRequest {
  videos?: string;
  output?: string;
  gpx_source?: 'config' | 'local' | 'mock' | 'none';
  gpx_path?: string;
  network?: string;
  sampling?: string;
  gates: QualityGates;
}

export interface VideoSummary {
  video: string;
  fps: number;
  total_frames: number;
  sampled: number;
  kept: number;
  blur: number;
  exposure: number;
  duplicate: number;
  reflectance: number;
}

export interface ExtractedFrameItem {
  id: string;
  video: string;
  frameIndex: number;
  timestampSec: number;
  outputPath: string;
  blurScore: number;
  meanIntensity: number;
  sunElevationDeg: number;
  cloudFraction?: number;
  logGain: number;
  illumConfidence: number;
  normalized: boolean;
}

export interface TimelineSeriesPoint {
  t: number;
  frames: number;
  bytes: number;
}

export interface TimelineChunk {
  start: number;
  end: number;
  t: number;
  frames: number;
}

export interface UpstreamWindow {
  t0: number;
  t1: number;
  zone: string;
}

export interface TimelinePayload {
  video: string;
  matched: boolean;
  videos: string[];
  fps: number;
  duration: number;
  network: string;
  series: TimelineSeriesPoint[];
  chunks: TimelineChunk[];
  upstream: UpstreamWindow[];
  step: number;
}

export interface CarrierZoneMap {
  [zone: string]: [number, number, number, number]; // [lon0, lat0, lon1, lat1]
}

export interface NetworksConfig {
  [carrier: string]: CarrierZoneMap;
}

export type LogLevel = 'INFO' | 'PASS' | 'REJECT' | 'WARN' | 'CHUNK' | 'SYS';

export interface StructuredLogEntry {
  id: string;
  timestamp: string;
  elapsedSec: number;
  level: LogLevel;
  subsystem: string;
  message: string;
}

export interface UtilizationPoint {
  time: string;
  cpu: number;
  memory: number;
}

export interface SimulationStep {
  progress: number;
  video: string;
  level: LogLevel;
  subsystem: string;
  message: string;
  cpuTarget: number;
  memTarget: number;
}

export interface JobState {
  state: 'idle' | 'running' | 'paused' | 'done' | 'failed';
  progress: number;
  video: string | null;
  network: string | null;
  zones: Record<string, number>;
  error: string | null;
  summaries: VideoSummary[];
  currentFrameIndex?: number;
  totalFramesCurrentVideo?: number;
  logs: string[];
  structuredLogs: StructuredLogEntry[];
  stepIndex: number;
  totalSteps: number;
  elapsedSeconds: number;
  speedMultiplier: 0.5 | 1 | 2;
  activeConfig?: ExtractRequest;
  utilizationHistory: UtilizationPoint[];
}

export interface CachedRunRecord {
  id: string;
  timestamp: string;
  config: ExtractRequest;
  summaries: VideoSummary[];
  zones: Record<string, number>;
  network: string;
  totalSampled: number;
  totalKept: number;
  bandwidthSavedPct: number;
  durationSec: number;
  structuredLogs: StructuredLogEntry[];
  timeline: TimelinePayload;
}

export interface CloudJobRequest {
  project: string;
  region: string;
  stagingBucket: string;
  imageUri: string;
  machineType: string;
  jobName: string;
  videosUri: string;
  gpxUri: string;
}

export interface CloudJobStatus {
  state: 'idle' | 'submitting' | 'submitted' | 'failed';
  error?: string;
  detail?: {
    job_name: string;
    console_url: string;
    outputs_uri: string;
  };
}
