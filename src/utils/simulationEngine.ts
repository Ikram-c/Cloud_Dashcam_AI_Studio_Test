import {
  ExtractRequest,
  SimulationStep,
  VideoSummary,
  TimelinePayload,
  StructuredLogEntry,
  LogLevel,
} from '../types';
import { CARRIER_NETWORKS } from '../data/mockData';

export const DEFAULT_EXTRACT_REQUEST: ExtractRequest = {
  videos: 'test_data/videos',
  output: 'extracted_frames',
  gpx_source: 'local',
  gpx_path: 'test_data/track.gpx',
  network: 'vodafone',
  sampling: 'frames_30',
  gates: {
    blur: true,
    exposure: true,
    duplicate: true,
    illumination: true,
    weiss: true,
    coverage: true,
  },
};

export interface DynamicRunPlan {
  steps: SimulationStep[];
  summaries: VideoSummary[];
  zones: Record<string, number>;
  timeline: TimelinePayload;
  sampledPerVideo: number;
}

/**
 * Formats current time as HH:MM:SS.mmm
 */
export function formatTimestampNow(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function createLogEntry(
  level: LogLevel,
  subsystem: string,
  message: string,
  elapsedSec: number
): StructuredLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: formatTimestampNow(),
    elapsedSec: Number(elapsedSec.toFixed(2)),
    level,
    subsystem,
    message,
  };
}

/**
 * Determines how many frames are sampled from a 180-frame (6.0s @ 30fps) clip
 * based on the selected sampling mode.
 */
export function getSampledFramesCount(sampling?: string): {
  sampledPerVideo: number;
  intervalSec: number;
  label: string;
} {
  switch (sampling) {
    case 'frames_10':
      return { sampledPerVideo: 18, intervalSec: 0.333, label: 'every 10 frames (0.33s)' };
    case 'seconds_2':
      return { sampledPerVideo: 3, intervalSec: 2.0, label: 'every 2.0 seconds (60 frames)' };
    case 'seconds_1':
      return { sampledPerVideo: 6, intervalSec: 1.0, label: 'every 1.0 second (30 frames)' };
    case 'frames_30':
    default:
      return { sampledPerVideo: 6, intervalSec: 1.0, label: 'every 30 frames (1.0s)' };
  }
}

/**
 * Dynamically builds the step-by-step simulation plan, video summaries,
 * coverage zone counts, and footage review timeline from the user's ExtractRequest.
 */
export function buildDynamicSimulationPlan(req: ExtractRequest): DynamicRunPlan {
  const network = (req.network || 'vodafone').toLowerCase();
  const gates = req.gates;
  const { sampledPerVideo, intervalSec, label: samplingLabel } = getSampledFramesCount(req.sampling);

  // Scale factor relative to baseline 6 frames per video
  const scale = sampledPerVideo / 6;

  // 1. Video 1: CAR01_20240315_083000_CAM01.mp4 (Sharp morning drive, 17.26 deg sun)
  const v1Sampled = sampledPerVideo;
  const v1Kept = v1Sampled;

  // 2. Video 2: CAR01_20240315_103000_CAM01.mp4 (Motion blur clip, variance 18.2 < 60.0)
  const v2Sampled = sampledPerVideo;
  const v2BlurRejected = gates.blur ? v2Sampled : 0;
  const v2Kept = v2Sampled - v2BlurRejected;

  // 3. Video 3: CAR01_20240315_120000_CAM01.mp4 (Midday clear survey, 34.06 deg sun)
  const v3Sampled = sampledPerVideo;
  const v3Kept = v3Sampled;

  // 4. Video 4: CAR01_20240315_160000_CAM01.mp4 (Traffic stop stationary shadow segment)
  const v4Sampled = sampledPerVideo;
  const v4DuplicateRejected = gates.duplicate ? Math.round(4 * scale) : 0;
  const v4Kept = v4Sampled - v4DuplicateRejected;
  const v4Reflectance = gates.weiss && gates.duplicate && v4DuplicateRejected >= 3 ? Math.max(1, Math.round(scale)) : 0;

  // 5. Video 5: CAR01_20240316_020000_CAM01.mp4 (Night unlit road, mean intensity 11.4 < 25.0)
  const v5Sampled = sampledPerVideo;
  const v5ExposureRejected = gates.exposure ? v5Sampled : gates.illumination ? Math.round(4 * scale) : 0;
  const v5Kept = v5Sampled - v5ExposureRejected;

  const summaries: VideoSummary[] = [
    {
      video: 'CAR01_20240315_083000_CAM01.mp4',
      fps: 30.0,
      total_frames: 180,
      sampled: v1Sampled,
      kept: v1Kept,
      blur: 0,
      exposure: 0,
      duplicate: 0,
      reflectance: 0,
    },
    {
      video: 'CAR01_20240315_103000_CAM01.mp4',
      fps: 30.0,
      total_frames: 180,
      sampled: v2Sampled,
      kept: v2Kept,
      blur: v2BlurRejected,
      exposure: 0,
      duplicate: 0,
      reflectance: 0,
    },
    {
      video: 'CAR01_20240315_120000_CAM01.mp4',
      fps: 30.0,
      total_frames: 180,
      sampled: v3Sampled,
      kept: v3Kept,
      blur: 0,
      exposure: 0,
      duplicate: 0,
      reflectance: 0,
    },
    {
      video: 'CAR01_20240315_160000_CAM01.mp4',
      fps: 30.0,
      total_frames: 180,
      sampled: v4Sampled,
      kept: v4Kept,
      blur: 0,
      exposure: 0,
      duplicate: v4DuplicateRejected,
      reflectance: v4Reflectance,
    },
    {
      video: 'CAR01_20240316_020000_CAM01.mp4',
      fps: 30.0,
      total_frames: 180,
      sampled: v5Sampled,
      kept: v5Kept,
      blur: 0,
      exposure: v5ExposureRejected,
      duplicate: 0,
      reflectance: 0,
    },
  ];

  // Calculate coverage zones based on selected carrier & whether coverage gate is enabled
  const carrierZoneDefs = CARRIER_NETWORKS[network] || CARRIER_NETWORKS.vodafone;
  const zoneNames = Object.keys(carrierZoneDefs);
  const videosWithKeptFrames = summaries.filter((s) => s.kept > 0).length;

  const zones: Record<string, number> = {};
  if (gates.coverage && req.gpx_source !== 'none') {
    if (network === 'vodafone') {
      zones['urban_4g'] = Math.max(1, videosWithKeptFrames - 1);
      zones['rural_edge'] = Math.max(1, Math.floor(videosWithKeptFrames / 2));
    } else if (network === 'ee') {
      zones['urban_5g'] = Math.max(1, Math.ceil(videosWithKeptFrames * 0.6));
      zones['urban_4g'] = videosWithKeptFrames;
    } else if (network === 'o2') {
      zones['urban_4g'] = videosWithKeptFrames;
    } else if (network === 'three') {
      zones['urban_4g'] = Math.max(1, videosWithKeptFrames - 1);
    } else {
      zoneNames.forEach((z) => {
        zones[z] = Math.max(1, Math.ceil(videosWithKeptFrames / zoneNames.length));
      });
    }
  } else {
    zones['unpartitioned_stream'] = videosWithKeptFrames;
  }

  // Build detailed step queue across subsystems (daemon, scheduler, worker, telemetry, quality, weiss, coverage)
  const disabledGatesList = Object.entries(gates)
    .filter(([, enabled]) => !enabled)
    .map(([k]) => k);

  const gpxDescription =
    req.gpx_source === 'mock'
      ? 'Mock GCS bucket (gs://mock-bucket/telemetry/track.gpx)'
      : req.gpx_source === 'none'
      ? 'Disabled — using fixed lat=52.45, lon=1.73 fallback'
      : `Local GPX (${req.gpx_path || 'test_data/track.gpx'})`;

  const steps: SimulationStep[] = [
    {
      progress: 0.08,
      video: 'Telemetry & Config',
      level: 'SYS',
      subsystem: 'daemon',
      message: `Frozen settings initialized: sampling=${samplingLabel}, carrier=${network.toUpperCase()}, video_dir=${req.videos || 'test_data/videos'}`,
      cpuTarget: 38,
      memTarget: 32,
    },
    {
      progress: 0.14,
      video: 'Telemetry & Config',
      level: 'INFO',
      subsystem: 'scheduler',
      message: `Dispatched 5 video capture jobs to ProcessPoolExecutor (sampling=${samplingLabel}, total=${v1Sampled * 5} target frames)`,
      cpuTarget: 44,
      memTarget: 35,
    },
    {
      progress: 0.20,
      video: 'Telemetry & Config',
      level: disabledGatesList.length > 0 ? 'WARN' : 'INFO',
      subsystem: 'quality',
      message:
        disabledGatesList.length > 0
          ? `Neutralized thresholds via dataclasses.replace for disabled gates: [${disabledGatesList.join(', ')}]`
          : 'All 6 estimation & quality gates armed (blur>=60.0, intensity=[25,235], log-dup<=0.012)',
      cpuTarget: 49,
      memTarget: 38,
    },
    {
      progress: 0.27,
      video: 'Telemetry & Config',
      level: 'INFO',
      subsystem: 'telemetry',
      message: `Resolved telemetry source: ${gpxDescription} — 180 trackpoints indexed`,
      cpuTarget: 54,
      memTarget: 42,
    },
    {
      progress: 0.35,
      video: 'CAR01_20240315_083000_CAM01.mp4',
      level: 'INFO',
      subsystem: 'worker',
      message: `Worker #1 decoding CAR01_20240315_083000_CAM01.mp4 (30.0 FPS, 180 frames) — extracting ${v1Sampled} candidate frames`,
      cpuTarget: 78,
      memTarget: 52,
    },
    {
      progress: 0.44,
      video: 'CAR01_20240315_083000_CAM01.mp4',
      level: 'PASS',
      subsystem: 'telemetry',
      message: gates.illumination
        ? `NOAA Solar elevation=17.26°, sky expected log-L=4.90. All ${v1Kept}/${v1Sampled} frames PASS (blur 123.7..131.7)`
        : `Illumination gate bypassed. ${v1Kept}/${v1Sampled} sharp morning frames KEPT (mean blur 125.9)`,
      cpuTarget: 85,
      memTarget: 58,
    },
    {
      progress: 0.54,
      video: 'CAR01_20240315_103000_CAM01.mp4',
      level: gates.blur ? 'REJECT' : 'WARN',
      subsystem: 'quality',
      message: gates.blur
        ? `CAR01_20240315_103000_CAM01.mp4 — Laplacian variance 18.2 < 60.0 threshold: ${v2BlurRejected}/${v2Sampled} motion-blurred frames REJECTED`
        : `CAR01_20240315_103000_CAM01.mp4 — Blur gate disabled (threshold=0.0): KEPT ${v2Kept} motion-blurred frames`,
      cpuTarget: 88,
      memTarget: 62,
    },
    {
      progress: 0.65,
      video: 'CAR01_20240315_120000_CAM01.mp4',
      level: 'PASS',
      subsystem: 'worker',
      message: `Worker #2 finished CAR01_20240315_120000_CAM01.mp4 — Midday survey (sun 34.06°): ${v3Kept}/${v3Sampled} frames KEPT (blur 236.0..283.9)`,
      cpuTarget: 84,
      memTarget: 65,
    },
    {
      progress: 0.76,
      video: 'CAR01_20240315_160000_CAM01.mp4',
      level: gates.duplicate ? (gates.weiss ? 'PASS' : 'REJECT') : 'WARN',
      subsystem: 'weiss',
      message: !gates.duplicate
        ? `CAR01_20240315_160000_CAM01.mp4 — Duplicate gate disabled: ${v4Kept} static frames KEPT without deduplication`
        : gates.weiss
        ? `CAR01_20240315_160000_CAM01.mp4 — ${v4DuplicateRejected} static frames buffered -> Weiss ML Fourier Poisson recovered ${v4Reflectance} intrinsic reflectance map(s)`
        : `CAR01_20240315_160000_CAM01.mp4 — Log-domain cross-correlation rejected ${v4DuplicateRejected} duplicate frames (Weiss recovery disabled)`,
      cpuTarget: gates.weiss ? 95 : 76,
      memTarget: gates.weiss ? 79 : 64,
    },
    {
      progress: 0.86,
      video: 'CAR01_20240316_020000_CAM01.mp4',
      level: v5ExposureRejected > 0 ? 'REJECT' : 'WARN',
      subsystem: 'quality',
      message:
        v5ExposureRejected > 0
          ? `CAR01_20240316_020000_CAM01.mp4 — Night scene (-15.2° solar elev, mean intensity 11.4): ${v5ExposureRejected}/${v5Sampled} frames REJECTED`
          : `CAR01_20240316_020000_CAM01.mp4 — Exposure & illumination gates disabled: ${v5Kept} near-black night frames KEPT`,
      cpuTarget: 72,
      memTarget: 70,
    },
    {
      progress: 0.94,
      video: 'Coverage Post-Pass',
      level: 'CHUNK',
      subsystem: 'coverage',
      message:
        gates.coverage && req.gpx_source !== 'none'
          ? `Sweep-line + Liang–Barsky clipping on ${network.toUpperCase()} bbox map -> partitioned into ${Object.entries(zones)
              .map(([z, c]) => `${z} (${c} chunks)`)
              .join(', ')}`
          : 'Coverage chunking bypassed — exporting unpartitioned frame slice manifest',
      cpuTarget: 60,
      memTarget: 66,
    },
    {
      progress: 1.0,
      video: 'Complete',
      level: 'SYS',
      subsystem: 'daemon',
      message: `Pipeline settled: ${summaries.reduce((a, b) => a + b.kept, 0)}/${summaries.reduce(
        (a, b) => a + b.sampled,
        0
      )} frames kept across 5 videos. Artifacts written to ${req.output || 'extracted_frames'}/`,
      cpuTarget: 18,
      memTarget: 42,
    },
  ];

  const timeline = buildDynamicTimeline(
    'CAR01_20240315_083000_CAM01',
    network,
    sampledPerVideo,
    intervalSec,
    gates.coverage && req.gpx_source !== 'none'
  );

  return {
    steps,
    summaries,
    zones,
    timeline,
    sampledPerVideo,
  };
}

/**
 * Generates a dynamic TimelinePayload for ReviewScreen reflecting sampling frequency,
 * carrier coverage windows, and byte accumulation.
 */
export function buildDynamicTimeline(
  videoName: string = 'CAR01_20240315_083000_CAM01',
  network: string = 'vodafone',
  sampledCount: number = 6,
  intervalSec: number = 1.0,
  coverageEnabled: boolean = true
): TimelinePayload {
  const fps = 30.0;
  const duration = 6.0;
  const frameBytes = 385_000;

  const series = [];
  for (let i = 0; i < sampledCount; i++) {
    const t = Number(Math.min(duration, i * intervalSec).toFixed(2));
    series.push({
      t,
      frames: i + 1,
      bytes: frameBytes * (i + 1),
    });
  }

  const chunks =
    sampledCount > 10
      ? [
          { start: 0.0, end: 2.8, t: 2.8, frames: Math.floor(sampledCount / 2) * 10 },
          { start: 3.0, end: 5.6, t: 5.6, frames: Math.ceil(sampledCount / 2) * 10 },
        ]
      : [
          {
            start: 0.0,
            end: 151 / fps,
            t: 151 / fps,
            frames: 151,
          },
        ];

  let upstream = [];
  if (!coverageEnabled) {
    upstream = [{ t0: 0.2, t1: 5.8, zone: 'direct_uplink' }];
  } else if (network === 'ee') {
    upstream = [
      { t0: 0.5, t1: 2.6, zone: 'urban_5g' },
      { t0: 3.1, t1: 5.5, zone: 'urban_4g' },
    ];
  } else if (network === 'o2') {
    upstream = [{ t0: 0.6, t1: 5.4, zone: 'urban_4g' }];
  } else if (network === 'three') {
    upstream = [{ t0: 1.1, t1: 4.8, zone: 'urban_4g' }];
  } else {
    upstream = [
      { t0: 0.7, t1: 3.4, zone: 'urban_4g' },
      { t0: 4.0, t1: 5.6, zone: 'rural_edge' },
    ];
  }

  return {
    video: videoName,
    matched: true,
    videos: [
      'CAR01_20240315_083000_CAM01',
      'CAR01_20240315_103000_CAM01',
      'CAR01_20240315_120000_CAM01',
      'CAR01_20240315_160000_CAM01',
    ],
    fps,
    duration,
    network,
    series,
    chunks,
    upstream,
    step: 0.25,
  };
}
