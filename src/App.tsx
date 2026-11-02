import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ConfigureScreen } from './components/ConfigureScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { CompleteScreen } from './components/CompleteScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { GalleryScreen } from './components/GalleryScreen';
import { RouteMapScreen } from './components/RouteMapScreen';
import { CloudScreen } from './components/CloudScreen';
import {
  JobState,
  ExtractRequest,
  TimelinePayload,
  CachedRunRecord,
} from './types';
import { INITIAL_SUMMARIES } from './data/mockData';
import {
  buildDynamicSimulationPlan,
  createLogEntry,
  DEFAULT_EXTRACT_REQUEST,
  DynamicRunPlan,
} from './utils/simulationEngine';
import {
  loadCachedConfig,
  saveCachedConfig,
  resetCachedConfig,
  loadCachedJobState,
  saveCachedJobState,
  clearCachedJobState,
  loadRunHistory,
  appendRunHistory,
  clearRunHistory,
} from './utils/cache';

export function App() {
  const [config, setConfig] = useState<ExtractRequest>(() => loadCachedConfig());
  const [runHistory, setRunHistory] = useState<CachedRunRecord[]>(() => loadRunHistory());

  const [job, setJob] = useState<JobState>(() => {
    const cached = loadCachedJobState();
    if (cached && (cached.state === 'running' || cached.state === 'paused' || cached.state === 'done')) {
      return cached;
    }
    return {
      state: 'idle',
      progress: 0,
      video: null,
      network: 'vodafone',
      zones: { urban_4g: 2, rural_edge: 1 },
      error: null,
      summaries: INITIAL_SUMMARIES,
      logs: [],
      structuredLogs: [],
      stepIndex: 0,
      totalSteps: 11,
      elapsedSeconds: 0,
      speedMultiplier: 1,
      activeConfig: DEFAULT_EXTRACT_REQUEST,
      utilizationHistory: [{ time: '0s', cpu: 32, memory: 28 }],
    };
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    const cached = loadCachedJobState();
    if (cached && (cached.state === 'running' || cached.state === 'paused')) {
      return 'processing';
    }
    return 'welcome';
  });

  const [timeline, setTimeline] = useState<TimelinePayload | null>(() => {
    const initialPlan = buildDynamicSimulationPlan(loadCachedConfig());
    return initialPlan.timeline;
  });

  // Hold the current dynamic plan in a ref so ticks and single-steps always reference it
  const planRef = useRef<DynamicRunPlan>(
    buildDynamicSimulationPlan(job.activeConfig || config)
  );

  // Persist job state changes to localStorage
  useEffect(() => {
    if (job.state === 'running' || job.state === 'paused' || job.state === 'done') {
      saveCachedJobState(job);
    } else if (job.state === 'idle') {
      clearCachedJobState();
    }
  }, [job]);

  // Execute one step of the simulation plan
  const advanceOneSimulationStep = useCallback(
    (currentJob: JobState, isManualStep: boolean = false): JobState => {
      const plan = planRef.current;
      const nextIdx = currentJob.stepIndex;

      if (nextIdx >= plan.steps.length) {
        return currentJob;
      }

      const step = plan.steps[nextIdx];
      const stepDeltaSec = Number((0.6 / (currentJob.speedMultiplier || 1)).toFixed(2));
      const nextElapsed = Number((currentJob.elapsedSeconds + stepDeltaSec).toFixed(2));

      const logEntry = createLogEntry(
        step.level,
        step.subsystem,
        isManualStep ? `[STEP] ${step.message}` : step.message,
        nextElapsed
      );

      const jitterCpu = Math.round((Math.random() - 0.5) * 4);
      const jitterMem = Math.round((Math.random() - 0.5) * 2);
      const nextCpu = Math.min(100, Math.max(12, step.cpuTarget + jitterCpu));
      const nextMem = Math.min(100, Math.max(20, step.memTarget + jitterMem));

      const nextUtilization = [
        ...(currentJob.utilizationHistory || []),
        {
          time: `${ nextElapsed.toFixed(1) }s`,
          cpu: nextCpu,
          memory: nextMem,
        },
      ].slice(-16);

      const isFinalStep = nextIdx + 1 >= plan.steps.length;

      if (isFinalStep) {
        const finalLogs = [...(currentJob.structuredLogs || []), logEntry];
        const activeReq = currentJob.activeConfig || config;
        const totalSampled = plan.summaries.reduce((a, b) => a + b.sampled, 0);
        const totalKept = plan.summaries.reduce((a, b) => a + b.kept, 0);
        const bandwidthSavedPct =
          totalSampled > 0 ? Math.round(((totalSampled - totalKept) / totalSampled) * 100) : 0;

        const record: CachedRunRecord = {
          id: `run-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          config: activeReq,
          summaries: plan.summaries,
          zones: plan.zones,
          network: activeReq.network || 'vodafone',
          totalSampled,
          totalKept,
          bandwidthSavedPct,
          durationSec: nextElapsed,
          structuredLogs: finalLogs,
          timeline: plan.timeline,
        };

        const updatedHistory = appendRunHistory(record);
        setRunHistory(updatedHistory);
        setTimeline(plan.timeline);
        setTimeout(() => setActiveTab('complete'), 250);

        return {
          ...currentJob,
          state: 'done',
          progress: 1.0,
          video: null,
          summaries: plan.summaries,
          zones: plan.zones,
          stepIndex: nextIdx + 1,
          elapsedSeconds: nextElapsed,
          logs: [...(currentJob.logs || []), logEntry.message],
          structuredLogs: finalLogs,
          utilizationHistory: nextUtilization,
        };
      }

      return {
        ...currentJob,
        progress: step.progress,
        video: step.video,
        stepIndex: nextIdx + 1,
        elapsedSeconds: nextElapsed,
        logs: [...(currentJob.logs || []), logEntry.message],
        structuredLogs: [...(currentJob.structuredLogs || []), logEntry],
        utilizationHistory: nextUtilization,
      };
    },
    [config]
  );

  // Main simulation loop for 'running' and idle-CPU decay for 'paused'
  useEffect(() => {
    if (job.state === 'running') {
      const intervalMs = Math.round(650 / (job.speedMultiplier || 1));
      const timer = setInterval(() => {
        setJob((prev) => {
          if (prev.state !== 'running') return prev;
          return advanceOneSimulationStep(prev, false);
        });
      }, intervalMs);

      return () => clearInterval(timer);
    }

    if (job.state === 'paused') {
      // When paused: freeze elapsedSeconds & ETA, and decay CPU down to idle (~13%) while holding RAM steady
      const idleTimer = setInterval(() => {
        setJob((prev) => {
          if (prev.state !== 'paused') return prev;
          const hist = prev.utilizationHistory || [];
          const lastPoint = hist[hist.length - 1] || { time: '0s', cpu: 30, memory: 45 };
          if (lastPoint.cpu <= 15) return prev; // already settled at idle

          const decayedCpu = Math.max(13, Math.round(lastPoint.cpu * 0.65));
          const updatedHistory = [
            ...hist.slice(0, -1),
            {
              ...lastPoint,
              cpu: decayedCpu,
            },
          ];
          return {
            ...prev,
            utilizationHistory: updatedHistory,
          };
        });
      }, 450);

      return () => clearInterval(idleTimer);
    }
  }, [job.state, job.speedMultiplier, advanceOneSimulationStep]);

  // Start a new extraction run with dynamic plan
  const startExtraction = (req: ExtractRequest) => {
    saveCachedConfig(req);
    setConfig(req);

    const dynamicPlan = buildDynamicSimulationPlan(req);
    planRef.current = dynamicPlan;

    const network = (req.network || 'vodafone').toLowerCase();
    const initialLog = createLogEntry(
      'SYS',
      'daemon',
      `Starting extraction pipeline daemon (carrier=${network.toUpperCase()}, sampling=${
        req.sampling || 'frames_30'
      })`,
      0.0
    );

    const newJob: JobState = {
      state: 'running',
      progress: 0.05,
      video: 'Initializing Pipeline...',
      network,
      zones: dynamicPlan.zones,
      error: null,
      summaries: dynamicPlan.summaries,
      logs: [initialLog.message],
      structuredLogs: [initialLog],
      stepIndex: 0,
      totalSteps: dynamicPlan.steps.length,
      elapsedSeconds: 0,
      speedMultiplier: job.speedMultiplier || 1,
      activeConfig: req,
      utilizationHistory: [{ time: '0.0s', cpu: 34, memory: 28 }],
    };

    setJob(newJob);
    setActiveTab('processing');
  };

  // Pause active extraction
  const handlePauseJob = () => {
    setJob((prev) => {
      if (prev.state !== 'running') return prev;
      const pauseLog = createLogEntry(
        'SYS',
        'scheduler',
        `Pipeline paused by user at ${Math.round(prev.progress * 100)}% — worker threads suspended, timers frozen`,
        prev.elapsedSeconds
      );
      const hist = prev.utilizationHistory || [];
      const lastMem = hist[hist.length - 1]?.memory ?? 48;
      return {
        ...prev,
        state: 'paused',
        logs: [...prev.logs, pauseLog.message],
        structuredLogs: [...prev.structuredLogs, pauseLog],
        utilizationHistory: [
          ...hist,
          {
            time: `${prev.elapsedSeconds.toFixed(1)}s (P)`,
            cpu: 14,
            memory: lastMem,
          },
        ].slice(-16),
      };
    });
  };

  // Resume paused extraction
  const handleResumeJob = () => {
    setJob((prev) => {
      if (prev.state !== 'paused') return prev;
      const resumeLog = createLogEntry(
        'SYS',
        'scheduler',
        `Pipeline resumed at ${Math.round(prev.progress * 100)}% (speed=${prev.speedMultiplier}x)`,
        prev.elapsedSeconds
      );
      return {
        ...prev,
        state: 'running',
        logs: [...prev.logs, resumeLog.message],
        structuredLogs: [...prev.structuredLogs, resumeLog],
      };
    });
  };

  // Single-step while paused
  const handleStepForward = () => {
    setJob((prev) => {
      if (prev.state !== 'paused') return prev;
      return advanceOneSimulationStep(prev, true);
    });
  };

  // Change speed multiplier
  const handleChangeSpeed = (speed: 0.5 | 1 | 2) => {
    setJob((prev) => {
      const speedLog = createLogEntry(
        'SYS',
        'scheduler',
        `Simulation speed multiplier set to ${speed}x`,
        prev.elapsedSeconds
      );
      return {
        ...prev,
        speedMultiplier: speed,
        logs: [...prev.logs, speedLog.message],
        structuredLogs: [...prev.structuredLogs, speedLog],
      };
    });
  };

  // Cancel / Abort extraction
  const handleCancelJob = () => {
    clearCachedJobState();
    setJob((prev) => ({
      ...prev,
      state: 'idle',
      progress: 0,
      video: null,
      stepIndex: 0,
      elapsedSeconds: 0,
    }));
    setActiveTab('welcome');
  };

  // Run Demo using current cached config (or default)
  const handleRunDemo = () => {
    startExtraction(config);
  };

  // Inspect a cached historical run
  const handleInspectCachedRun = (record: CachedRunRecord) => {
    setConfig(record.config);
    setTimeline(record.timeline);
    setJob((prev) => ({
      ...prev,
      state: 'done',
      progress: 1.0,
      video: null,
      network: record.network,
      zones: record.zones,
      summaries: record.summaries,
      structuredLogs: record.structuredLogs,
      logs: record.structuredLogs.map((l) => l.message),
      activeConfig: record.config,
    }));
    setActiveTab('complete');
  };

  // Clear run history cache
  const handleClearHistory = () => {
    clearRunHistory();
    setRunHistory([]);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col font-sans">
      <Header
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        jobState={job.state}
        progressPct={Math.round(job.progress * 100)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        {activeTab === 'welcome' && (
          <WelcomeScreen
            onRunDemo={handleRunDemo}
            onConfigure={() => setActiveTab('configure')}
            onReview={() => setActiveTab('review')}
            onSelectTab={setActiveTab}
            activeJob={job}
            runHistory={runHistory}
            onInspectCachedRun={handleInspectCachedRun}
            onClearHistory={handleClearHistory}
          />
        )}

        {activeTab === 'configure' && (
          <ConfigureScreen
            initialConfig={config}
            onConfigChange={(updated) => {
              setConfig(updated);
              saveCachedConfig(updated);
            }}
            onResetConfig={() => {
              const reset = resetCachedConfig();
              setConfig(reset);
            }}
            onBack={() => setActiveTab('welcome')}
            onStartExtraction={startExtraction}
            isLoading={job.state === 'running'}
          />
        )}

        {activeTab === 'processing' && (
          <ProcessingScreen
            job={job}
            onPause={handlePauseJob}
            onResume={handleResumeJob}
            onStepForward={handleStepForward}
            onChangeSpeed={handleChangeSpeed}
            onCancel={handleCancelJob}
          />
        )}

        {activeTab === 'complete' && (
          <CompleteScreen
            summaries={job.summaries}
            zones={job.zones}
            network={job.network}
            error={job.error}
            activeConfig={job.activeConfig || config}
            structuredLogs={job.structuredLogs}
            runHistory={runHistory}
            onSelectCachedRun={handleInspectCachedRun}
            onReviewFootage={() => setActiveTab('review')}
            onViewGallery={() => setActiveTab('gallery')}
            onViewRoute={() => setActiveTab('route')}
            onStartOver={() => setActiveTab('configure')}
          />
        )}

        {activeTab === 'review' && (
          <ReviewScreen
            onBack={() => setActiveTab('welcome')}
            initialTimeline={timeline}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryScreen onBack={() => setActiveTab('welcome')} />
        )}

        {activeTab === 'route' && (
          <RouteMapScreen onBack={() => setActiveTab('welcome')} />
        )}

        {activeTab === 'cloud' && (
          <CloudScreen onBack={() => setActiveTab('welcome')} />
        )}
      </main>

      <footer className="border-t border-[#30363d]/80 py-4 text-center text-xs text-[#8b949e]">
        Cloud Optimised DashCam · AberTech POC · Classical CV · NOAA Solar Geometry · Liang–Barsky Coverage Chunking
      </footer>
    </div>
  );
}

export default App;
