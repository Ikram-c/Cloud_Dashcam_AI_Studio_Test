import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ConfigureScreen } from './components/ConfigureScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { CompleteScreen } from './components/CompleteScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { GalleryScreen } from './components/GalleryScreen';
import { RouteMapScreen } from './components/RouteMapScreen';
import { CloudScreen } from './components/CloudScreen';
import { JobState, ExtractRequest, TimelinePayload } from './types';
import { INITIAL_SUMMARIES, getSampleTimeline } from './data/mockData';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('welcome');
  const [job, setJob] = useState<JobState>({
    state: 'idle',
    progress: 0,
    video: null,
    network: 'vodafone',
    zones: { urban_4g: 2 },
    error: null,
    summaries: INITIAL_SUMMARIES,
    logs: [],
  });
  const [timeline, setTimeline] = useState<TimelinePayload | null>(null);

  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Run Extraction Simulation
  const startExtraction = (req: ExtractRequest) => {
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);

    const network = req.network || 'vodafone';
    setActiveTab('processing');

    setJob({
      state: 'running',
      progress: 0.05,
      video: 'CAR01_20240315_083000_CAM01.mp4',
      network,
      zones: { urban_4g: 2 },
      error: null,
      summaries: [],
      logs: [
        'Starting extraction pipeline daemon...',
        `Loaded immutable settings from config.yaml (network=${network}, sampling=${req.sampling || 'frames_30'})`,
        'Quality gate states: Blur=' + (req.gates.blur ? 'ON' : 'OFF') +
        ', Exposure=' + (req.gates.exposure ? 'ON' : 'OFF') +
        ', Duplicate=' + (req.gates.duplicate ? 'ON' : 'OFF') +
        ', Illumination=' + (req.gates.illumination ? 'ON' : 'OFF') +
        ', Weiss=' + (req.gates.weiss ? 'ON' : 'OFF') +
        ', Coverage=' + (req.gates.coverage ? 'ON' : 'OFF'),
        'Telemetry resolver: loading GPX track from ' + (req.gpx_path || 'test_data/track.gpx'),
        'GPX resolved: 180 spatial trackpoints spanning 08:30:00 to 08:35:00 UTC',
      ],
    });

    const steps = [
      {
        progress: 0.20,
        video: 'CAR01_20240315_083000_CAM01.mp4',
        log: 'Scanning video: CAR01_20240315_083000_CAM01.mp4 (FPS: 30.0, Frames: 180)',
      },
      {
        progress: 0.35,
        video: 'CAR01_20240315_083000_CAM01.mp4',
        log: 'NOAA Solar Model: Sun elevation=17.26°, Clear-sky expected log-intensity=4.9. Frame f000030 blur=124.2 (PASS, KEPT).',
      },
      {
        progress: 0.50,
        video: 'CAR01_20240315_103000_CAM01.mp4',
        log: 'Scanning video: CAR01_20240315_103000_CAM01.mp4 — Blur gate triggered (Laplacian variance 18.2 < 60.0). 6 frames REJECTED.',
      },
      {
        progress: 0.65,
        video: 'CAR01_20240315_120000_CAM01.mp4',
        log: 'Scanning video: CAR01_20240315_120000_CAM01.mp4 — Midday survey (sun elevation 34.06°). 6 frames KEPT (blur scores 236..284).',
      },
      {
        progress: 0.78,
        video: 'CAR01_20240315_160000_CAM01.mp4',
        log: 'Stationary segment detected: Weiss ML reflectance recovery triggered (temporal median of log-gradients with Fourier reconstruction).',
      },
      {
        progress: 0.88,
        video: 'CAR01_20240315_020000_CAM01.mp4',
        log: 'Scanning video: CAR01_20240315_020000_CAM01.mp4 — Night scene (-15.2° sun elevation). 6 frames REJECTED by exposure gate.',
      },
      {
        progress: 0.95,
        video: 'Coverage Post-Pass',
        log: `Running Liang-Barsky sweep-line chunking on ${network.toUpperCase()} zones: urban_4g [entry t=0.8s, exit t=5.2s]. Slice ranges written.`,
      },
      {
        progress: 1.0,
        video: 'Complete',
        log: 'Pipeline execution complete! Written frame_manifest.csv, video_summaries.csv, and coverage_chunks.yaml.',
      },
    ];

    let currentStepIdx = 0;
    simulationTimerRef.current = setInterval(() => {
      if (currentStepIdx < steps.length) {
        const step = steps[currentStepIdx];
        setJob((prev) => ({
          ...prev,
          progress: step.progress,
          video: step.video,
          logs: [...(prev.logs || []), step.log],
        }));
        currentStepIdx++;
      } else {
        if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
        const sampleSummaries = INITIAL_SUMMARIES;
        setJob((prev) => ({
          ...prev,
          state: 'done',
          progress: 1.0,
          video: null,
          summaries: sampleSummaries,
          zones: { urban_4g: 2 },
        }));
        setTimeline(getSampleTimeline('CAR01_20240315_083000_CAM01', network));
        setActiveTab('complete');
      }
    }, 600);
  };

  const handleRunDemo = () => {
    startExtraction({
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
    });
  };

  const handleCancelJob = () => {
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    setJob((prev) => ({
      ...prev,
      state: 'idle',
      progress: 0,
      video: null,
    }));
    setActiveTab('welcome');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        isRunningJob={job.state === 'running'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        {activeTab === 'welcome' && (
          <WelcomeScreen
            onRunDemo={handleRunDemo}
            onConfigure={() => setActiveTab('configure')}
            onReview={() => setActiveTab('review')}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'configure' && (
          <ConfigureScreen
            onBack={() => setActiveTab('welcome')}
            onStartExtraction={startExtraction}
            isLoading={job.state === 'running'}
          />
        )}

        {activeTab === 'processing' && (
          <ProcessingScreen
            job={job}
            onCancel={handleCancelJob}
          />
        )}

        {activeTab === 'complete' && (
          <CompleteScreen
            summaries={job.summaries}
            zones={job.zones}
            network={job.network}
            error={job.error}
            onReviewFootage={() => setActiveTab('review')}
            onViewGallery={() => setActiveTab('gallery')}
            onViewRoute={() => setActiveTab('route')}
            onStartOver={() => setActiveTab('welcome')}
          />
        )}

        {activeTab === 'review' && (
          <ReviewScreen
            onBack={() => setActiveTab('welcome')}
            initialTimeline={timeline}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryScreen
            onBack={() => setActiveTab('welcome')}
          />
        )}

        {activeTab === 'route' && (
          <RouteMapScreen
            onBack={() => setActiveTab('welcome')}
          />
        )}

        {activeTab === 'cloud' && (
          <CloudScreen
            onBack={() => setActiveTab('welcome')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363d]/80 py-4 text-center text-xs text-[#8b949e]">
        Cloud Optimised DashCam · AberTech POC · Classical CV + NOAA Solar Geometry + Liang-Barsky Coverage Chunking
      </footer>
    </div>
  );
}

export default App;
