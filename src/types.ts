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

export interface JobState {
  state: 'idle' | 'running' | 'done' | 'failed';
  progress: number;
  video: string | null;
  network: string | null;
  zones: Record<string, number>;
  error: string | null;
  summaries: VideoSummary[];
  currentFrameIndex?: number;
  totalFramesCurrentVideo?: number;
  logs?: string[];
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
