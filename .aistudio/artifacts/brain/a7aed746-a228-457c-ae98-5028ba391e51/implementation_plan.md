# Dynamic Extraction Simulation, Pause/Resume Controls & Local Caching

This update transforms the Cloud Optimised DashCam pipeline into a dynamic, demo-ready workbench with live pause/resume/step execution controls, structured subsystem logging, configuration-driven extraction outcomes, and full browser local storage persistence across sessions.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX choices incorporate your confirmed preferences for the live demo workflow:

- **Confirmed Decision 1 — Pause Telemetry Behavior**: Pausing the extraction simulation immediately freezes the elapsed time counter, progress velocity, and ETA countdown, emits a timestamped pause event to the log stream, and transitions the Recharts CPU utilization curve down to an idle baseline (~12–15% CPU) while holding allocated RAM steady.
- **Confirmed Decision 2 — Full Local Storage Persistence**: Browser `localStorage` automatically caches (1) active or paused job progress and telemetry history for seamless reload recovery, (2) pipeline configuration settings and quality gate states, and (3) a history of completed extraction runs with their summaries and logs.
- **Confirmed Decision 3 — Configuration-Driven Dynamic Simulation**: Extraction runs dynamically compute sampled frame counts, gate rejections, Weiss reflectance outputs, carrier coverage chunks, and footage review timeline curves based on the active quality gates, sampling interval, and cellular carrier selected.

---

## 1. Overview & Core Concept

- **What It Does**: Provides interactive execution control over the dashcam frame extraction pipeline—allowing presenters to configure gates and carrier networks, pause/resume or single-step the simulation mid-run, inspect and filter structured pipeline logs, and persist all state and run history in local browser storage.
- **Target Audience / Persona**: Computer vision and geospatial telemetry engineers demonstrating how quality gating, NOAA solar illumination models, and Liang–Barsky cellular coverage chunking optimize dashcam uploads under varying configurations.
- **Key Value**: Eliminates static demo outcomes—toggling off the Blur Gate or switching from Vodafone to EE visibly changes live logs, frame retention counts, cellular bandwidth savings, and upstream coverage windows while surviving page reloads.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Pipeline Configuration & Caching**: User adjusts sampling rate (`Every 10 frames`, `Every 30 frames`, `Every 1s`, `Every 2s`), carrier (`Vodafone`, `EE`, `O2`, `Three`), and quality gates. Changes auto-save to local storage with a quick "Reset Defaults" option.
  2. **Interactive Processing & Pause/Resume**: During extraction, user can click **Pause Job** to freeze progress and timers while explaining telemetry or logs, click **Step Forward** while paused to advance one pipeline stage at a time, adjust playback speed (`0.5x`, `1x`, `2x`), or click **Resume Job** to continue.
  3. **Structured Log Inspection**: User filters real-time log entries by category (`All`, `Kept`, `Rejected`, `Chunks & System`), searches log text, or exports the run log as a file.
  4. **Run History & Reload Recovery**: If the browser refreshes mid-run, the app restores the active/paused job state immediately. Completed runs are saved to a **Recent Runs Cache** drawer on the Welcome and Complete screens so users can compare different gate/carrier configurations side-by-side.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-contrast technical telemetry console with clean hairline borders (`#30363d`), deep slate surfaces (`#0d1117` canvas, `#161b22` panels), and zero nested card clutter.
  - *Color Palette & Mood*: Dominant dark slate canvas (`#0d1117`), structural surface panels (`#161b22`), primary action blue (`#58a6ff`), nominal/kept green (`#3fb950`), paused/warning amber (`#d29922`), rejection/alert crimson (`#f85149`), and memory/reflectance violet (`#a371f7`).
  - *Typography & Hierarchy*: Clean sans-serif headings and controls paired with strict tabular monospace numerals (`font-mono tabular-nums`) for all timers, percentages, byte counters, frame indices, and log timestamps to prevent layout jitter.
  - *Component Styling & Layout*: Single-elevation panels with subtle 1px borders, clean unboxed metadata separated by middle dots (`·`), and functional segmented filter buttons.
- **Interactive Feedback & Motion**:
  - Header and Processing banner clearly reflect `RUNNING` vs. `PAUSED` states using semantic color and icon changes.
  - Smooth auto-scrolling log viewport with manual scroll pause detection and a floating "Jump to newest" affordance.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Deterministic Tick Accumulator for Pause/Resume & Speed Scaling**
  - *Chosen Approach*: Replace the fixed-interval timer with a tick-based state machine that tracks accumulated active execution milliseconds separately from wall-clock time.
  - *Why*: Using `Date.now() - startTime` causes ETA and velocity calculations to skew badly after a pause. Tracking active elapsed milliseconds ensures velocity, step cadence, and ETA remain mathematically accurate across multiple pauses, single-steps, and speed multiplier changes (`0.5x`, `1x`, `2x`).
  - *Alternatives Considered*: Simple `clearInterval` on pause with wall-clock timestamps, which was rejected because pausing for 30 seconds would artificially tank the calculated progress velocity upon resume.
- **Decision 2: Versioned Local Storage Cache with Safe Hydration**
  - *Chosen Approach*: Centralize browser persistence behind a typed storage manager that caches configuration, active/paused job state, timeline payload, and up to 10 historical runs with a one-click cache reset.
  - *Why*: Ensures reliability during live demos if the browser tab is refreshed, while allowing the presenter to reset to a clean slate at any time.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        Local Storage Cache Manager                         │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ Cached Config & Gates│  │ Active / Paused Job  │  │ Run History &    │  │
│  │ (Network, Sampling)  │  │ Snapshot + Telemetry │  │ Saved Timelines  │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└─────────────┼─────────────────────────┼───────────────────────┼────────────┘
              │                         │                       │
              ▼                         ▼                       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   Dynamic Pipeline Simulation Engine                       │
│  • Evaluates active QualityGates, Sampling interval & Carrier zones        │
│  • Generates step queue, structured LogEntry items & VideoSummary metrics  │
│  • Supports Pause, Resume, Single-Step, Speed (0.5x/1x/2x) & Abort         │
└──────┬──────────────────────┬───────────────────────┬───────────────┬──────┘
       │                      │                       │               │
       ▼                      ▼                       ▼               ▼
┌──────────────┐     ┌──────────────────┐    ┌────────────────┐ ┌────────────┐
│ConfigureView │     │ ProcessingScreen │    │ CompleteScreen │ │ReviewScreen│
│• Gate toggles│     │ • Pause / Resume │    │ • Dynamic KPIs │ │• Dynamic   │
│• Carrier &   │     │ • Step Forward   │    │ • Gate impact  │ │  coverage  │
│  sampling    │     │ • Frozen ETA/Vel │    │   comparison   │ │  windows & │
│• Auto-cached │     │ • Idle CPU drop  │    │ • Cached runs  │ │  backlog   │
│  settings    │     │ • Log filter/exp │    │   switcher     │ │  overlay   │
└──────────────┘     └──────────────────┘    └────────────────┘ └────────────┘
```

- **Data Model & State**:
  - `StructuredLogEntry`: `{ id, timestamp, elapsedSec, level: 'INFO' | 'PASS' | 'REJECT' | 'WARN' | 'CHUNK' | 'SYS', subsystem, message }`
  - `JobState`: Extended with `state: 'idle' | 'running' | 'paused' | 'done' | 'failed'`, `stepIndex`, `totalSteps`, `elapsedSeconds`, `speedMultiplier`, `structuredLogs`, `activeConfig`, and `utilizationHistory`.
  - `CachedRunRecord`: `{ id, timestamp, config: ExtractRequest, summaries: VideoSummary[], zones: Record<string, number>, totalKept, totalSampled, bandwidthSavedPct, logs: StructuredLogEntry[], timeline: TimelinePayload }`.
- **Interactive Component & State Mapping**:
  - **Pause / Resume / Step Controls (`ProcessingScreen`)**:
    - Clicking **Pause** transitions `job.state` from `'running'` to `'paused'`, stops step progression, freezes `elapsedSeconds` and `estimatedRemainingSec`, appends a `SYS` pause log entry, and shifts the Recharts telemetry generator to idle CPU (~14%) while maintaining RAM level.
    - Clicking **Step Forward** (enabled while `'paused'`) executes the next queued simulation step immediately, updates progress and logs, and keeps the job in `'paused'` state.
    - Clicking **Resume** transitions `job.state` back to `'running'`, appends a `SYS` resume log entry, and resumes step progression and active CPU/RAM telemetry.
  - **Dynamic Outcome Calculation**:
    - Sampling rate scales total sampled frames per video (`frames_10` = 18/video, `frames_30` = 6/video, `seconds_1` = 6/video, `seconds_2` = 3/video).
    - Toggling off `blur`, `exposure`, or `duplicate` dynamically converts those rejected frames into kept frames in `VideoSummary`, recalculates cellular bandwidth savings, and logs threshold neutralization (`blur_threshold=0.0`, etc.).
    - Carrier selection (`vodafone`, `ee`, `o2`, `three`) maps kept frames to the carrier's specific zones (`urban_4g`, `rural_edge`, `urban_5g`) and updates `ReviewScreen` upstream drain windows.
