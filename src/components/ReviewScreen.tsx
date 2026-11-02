import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Upload,
  Layers,
  FileVideo,
  Sliders,
} from 'lucide-react';
import { TimelinePayload, TimelineChunk, UpstreamWindow } from '../types';
import { buildDynamicTimeline } from '../utils/simulationEngine';

interface ReviewScreenProps {
  onBack: () => void;
  initialTimeline?: TimelinePayload | null;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ onBack, initialTimeline }) => {
  const [timeline, setTimeline] = useState<TimelinePayload>(
    () => initialTimeline || buildDynamicTimeline()
  );
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>(
    initialTimeline?.video || 'CAR01_20240315_083000_CAM01'
  );
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [opacity, setOpacity] = useState(65);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(6.0);
  const [uploadCurve, setUploadCurve] = useState<{ t: number; bytes: number }[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const syntheticAnimRef = useRef<number | null>(null);

  // Sync with parent initialTimeline when it updates
  useEffect(() => {
    if (initialTimeline) {
      setTimeline(initialTimeline);
      setVideoName(initialTimeline.video);
    }
  }, [initialTimeline]);

  // Rebuild upload curve whenever timeline changes
  useEffect(() => {
    if (!timeline || !timeline.series.length) return;
    const dur =
      Math.max(timeline.duration, timeline.series[timeline.series.length - 1].t) || 6.0;
    const windows = timeline.upstream;
    const windowSecs = windows.reduce((acc, w) => acc + (w.t1 - w.t0), 0);
    const totalBytes = timeline.series[timeline.series.length - 1].bytes;
    const rate = windowSecs > 0 ? totalBytes / windowSecs : 0;
    const step = timeline.step || 0.25;

    const curve: { t: number; bytes: number }[] = [];
    let uploaded = 0;
    let si = 0;
    let captured = 0;

    for (let t = 0; t <= dur + step; t += step) {
      while (si < timeline.series.length && timeline.series[si].t <= t) {
        captured = timeline.series[si++].bytes;
      }
      const inWindow = windows.some((w) => t >= w.t0 && t <= w.t1);
      if (inWindow) {
        uploaded = Math.min(captured, uploaded + rate * step);
      }
      curve.push({ t, bytes: uploaded });
    }
    setUploadCurve(curve);
    setDuration(dur);
  }, [timeline]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    const stem = file.name.replace(/\.[^.]+$/, '');
    setVideoName(stem);
    setTimeline(
      buildDynamicTimeline(
        stem,
        timeline.network,
        timeline.series.length,
        duration / Math.max(1, timeline.series.length)
      )
    );
  };

  // Switch demo preset
  const handleSelectDemo = (preset: string) => {
    setVideoName(preset);
    setVideoSrc(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setTimeline(
      buildDynamicTimeline(
        preset,
        timeline.network,
        timeline.series.length,
        duration / Math.max(1, timeline.series.length)
      )
    );
  };

  // Synthetic animation tick if no native video is uploaded
  useEffect(() => {
    if (videoSrc) return;

    let lastTimestamp = performance.now();
    const tick = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return next;
        });
      }
      syntheticAnimRef.current = requestAnimationFrame(tick);
    };

    syntheticAnimRef.current = requestAnimationFrame(tick);
    return () => {
      if (syntheticAnimRef.current) cancelAnimationFrame(syntheticAnimRef.current);
    };
  }, [isPlaying, videoSrc, duration]);

  // Real video time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || duration);
    }
  };

  // Draw overlay canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.clientWidth || 720;
    const h = canvas.clientHeight || 420;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    if (!videoSrc) {
      drawSyntheticDashcamRoad(ctx, w, h, currentTime);
    }

    if (!overlayEnabled || !timeline) return;

    const dur =
      Math.max(
        duration,
        timeline.series.length ? timeline.series[timeline.series.length - 1].t : 0
      ) || 6.0;

    const x = (t: number) => Math.min(1, Math.max(0, t / dur)) * (w - 32) + 16;
    const chartTop = h * 0.6;
    const chartBottom = h - 24;
    const chartH = chartBottom - chartTop;

    const maxBytes = timeline.series.length
      ? timeline.series[timeline.series.length - 1].bytes
      : 1;
    const y = (bytes: number) => chartBottom - (bytes / maxBytes) * chartH;

    // 1. Chart Backing
    ctx.fillStyle = `rgba(13, 17, 23, ${(opacity / 100) * 0.85})`;
    ctx.fillRect(0, chartTop - 26, w, h - chartTop + 26);
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, chartTop - 26);
    ctx.lineTo(w, chartTop - 26);
    ctx.stroke();

    // 2. Upstream Coverage Windows
    timeline.upstream.forEach((win: UpstreamWindow) => {
      const wx0 = x(win.t0);
      const wx1 = x(win.t1);
      const winW = Math.max(4, wx1 - wx0);

      ctx.fillStyle = 'rgba(63, 185, 80, 0.22)';
      ctx.fillRect(wx0, chartTop - 20, winW, chartBottom - chartTop + 20);

      ctx.strokeStyle = 'rgba(63, 185, 80, 0.6)';
      ctx.strokeRect(wx0, chartTop - 20, winW, chartBottom - chartTop + 20);

      ctx.fillStyle = 'rgba(63, 185, 80, 0.95)';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`Upstream [${win.zone}]`, wx0 + 4, chartTop - 7);
    });

    // 3. Chunk Created Markers
    timeline.chunks.forEach((c: TimelineChunk, i: number) => {
      if (c.t > currentTime) return;
      const cx = x(c.t);

      ctx.strokeStyle = 'rgba(210, 153, 34, 0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, chartTop - 12);
      ctx.lineTo(cx, chartBottom);
      ctx.stroke();
      ctx.lineWidth = 1;

      ctx.fillStyle = 'rgba(210, 153, 34, 1)';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`Chunk ${i + 1} (${c.frames}f)`, cx + 4, chartTop + 14);
    });

    // 4. Captured-bytes Line (#58a6ff)
    const capturedPoints = timeline.series
      .filter((p) => p.t <= currentTime)
      .map((p) => [x(p.t), y(p.bytes)]);
    strokeSeries(ctx, capturedPoints, '#58a6ff', 2.5);

    // 5. Upstreamed-bytes Line (#3fb950)
    const uploadedPoints = uploadCurve
      .filter((p) => p.t <= currentTime)
      .map((p) => [x(p.t), y(p.bytes)]);
    strokeSeries(ctx, uploadedPoints, '#3fb950', 2.5);

    // 6. Playhead Indicator
    const px = x(currentTime);
    ctx.strokeStyle = 'rgba(240, 246, 252, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, chartTop - 24);
    ctx.lineTo(px, chartBottom);
    ctx.stroke();
    ctx.lineWidth = 1;

    ctx.fillStyle = '#58a6ff';
    ctx.beginPath();
    ctx.arc(px, chartTop - 24, 4, 0, Math.PI * 2);
    ctx.fill();

    // 7. Live Top Caption
    const caption = getLiveCaption(currentTime, timeline);
    ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
    ctx.beginPath();
    ctx.roundRect(14, 14, 390, 32, 8);
    ctx.fill();
    ctx.strokeStyle = '#30363d';
    ctx.stroke();

    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = caption.color;
    ctx.fillText(caption.text, 26, 35);

    // 8. Legend at bottom
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#58a6ff';
    ctx.fillText('● Captured Frames (Backlog)', 16, chartBottom + 16);
    ctx.fillStyle = '#3fb950';
    ctx.fillText('● Upstreamed Data', 190, chartBottom + 16);
    ctx.fillStyle = '#d29922';
    ctx.fillText('| Chunk Slices Created', 320, chartBottom + 16);
  }, [currentTime, duration, timeline, uploadCurve, overlayEnabled, opacity, videoSrc]);

  const togglePlay = () => {
    if (videoSrc && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => {
        if (!prev && currentTime >= duration) {
          setCurrentTime(0);
        }
        return !prev;
      });
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (videoSrc && videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      <div className="rounded-xl bg-[#161b22] border border-[#30363d] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30363d] pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Footage Review &amp; Overlay Player
            </h2>
            <p className="text-xs text-[#8b949e] mt-1">
              Replays video synchronized with pipeline processing timeline — frames captured,
              chunks created, and data upstreamed per cellular coverage window.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
            <button
              type="button"
              onClick={() => handleSelectDemo('CAR01_20240315_083000_CAM01')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                videoName === 'CAR01_20240315_083000_CAM01'
                  ? 'bg-[#21262d] text-[#58a6ff]'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
            >
              Demo 08:30
            </button>
            <button
              type="button"
              onClick={() => handleSelectDemo('CAR01_20240315_120000_CAM01')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                videoName === 'CAR01_20240315_120000_CAM01'
                  ? 'bg-[#21262d] text-[#58a6ff]'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
            >
              Demo 12:00
            </button>
          </div>
        </div>

        {/* Video Upload Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0d1117] border border-[#30363d] mb-4">
          <div className="flex items-center gap-2 text-xs text-[#8b949e]">
            <Upload className="w-4 h-4 text-[#58a6ff]" />
            <span>Upload custom video footage or use interactive simulated vehicle feed:</span>
          </div>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#e6edf3] border border-[#30363d] cursor-pointer transition-colors whitespace-nowrap">
            <FileVideo className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>Choose Video File</span>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Player Container */}
        <div className="relative rounded-xl overflow-hidden bg-black border border-[#30363d] aspect-[16/10] sm:aspect-[16/9] max-h-[500px]">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
              playsInline
            />
          ) : null}

          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: overlayEnabled ? 1 : 0 }}
          />
        </div>

        {/* Scrub Bar & Player Controls */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="w-9 h-9 rounded-lg bg-[#58a6ff] hover:bg-[#79b8ff] text-[#04121f] flex items-center justify-center font-bold cursor-pointer transition-transform active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max={duration || 6}
                step="0.05"
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full accent-[#58a6ff] cursor-pointer h-1.5 bg-[#30363d] rounded-lg"
              />
              <span className="font-mono tabular-nums text-xs text-[#8b949e] shrink-0 w-24 text-right">
                {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
              </span>
            </div>
          </div>

          {/* Overlay Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-[#e6edf3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={overlayEnabled}
                  onChange={(e) => setOverlayEnabled(e.target.checked)}
                  className="rounded border-[#30363d] text-[#58a6ff] focus:ring-0"
                />
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span>Processing Overlay</span>
                </span>
              </label>

              <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                <Sliders className="w-3.5 h-3.5 text-[#8b949e]" />
                <span>Opacity:</span>
                <input
                  type="range"
                  min="15"
                  max="95"
                  value={opacity}
                  onChange={(e) => setOpacity(parseInt(e.target.value))}
                  className="w-20 accent-[#58a6ff] cursor-pointer h-1 bg-[#30363d] rounded"
                />
                <span className="font-mono tabular-nums text-[11px]">{opacity}%</span>
              </div>
            </div>

            <div className="text-xs text-[#8b949e] font-mono tabular-nums">
              Carrier: {timeline.network.toUpperCase()} · {timeline.series.length} buffered frames
            </div>
          </div>
        </div>

        {/* Subsystem Details Drawer */}
        <div className="mt-6 pt-6 border-t border-[#30363d] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="text-xs font-semibold text-[#58a6ff] mb-1">
              Frame Sampling &amp; Buffer
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed font-mono tabular-nums">
              {timeline.fps} FPS stream · Backlog accumulates to {timeline.series.length} kept
              frames (~{(timeline.series.length * 0.385).toFixed(2)} MB).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="text-xs font-semibold text-[#d29922] mb-1">
              Chunk Partitioning
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              {timeline.chunks.length} chunk slice{timeline.chunks.length === 1 ? '' : 's'} created
              and flushed for upstream serialization without blocking capture.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="text-xs font-semibold text-[#3fb950] mb-1">
              Coverage Windows
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed font-mono tabular-nums">
              {timeline.upstream.map((w) => `${w.zone} [${w.t0}s..${w.t1}s]`).join(' · ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function strokeSeries(
  ctx: CanvasRenderingContext2D,
  points: number[][],
  color: string,
  lineWidth: number = 2
) {
  if (points.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
}

function getLiveCaption(
  now: number,
  timeline: TimelinePayload
): { text: string; color: string } {
  const win = timeline.upstream.find((u) => now >= u.t0 && now <= u.t1);
  if (win) {
    return {
      text: `⬆ Upstreaming to ${win.zone} (${timeline.network.toUpperCase()})`,
      color: '#3fb950',
    };
  }

  const recent = timeline.chunks.filter((c) => c.t <= now && now - c.t < 2.0).pop();
  if (recent) {
    const idx = timeline.chunks.indexOf(recent) + 1;
    return {
      text: `➕ Chunk ${idx} created — ${recent.frames} frames buffered`,
      color: '#d29922',
    };
  }

  const kept = timeline.series.filter((p) => p.t <= now).length;
  if (kept > 0) {
    return {
      text: `● Capturing — ${kept} frame${kept === 1 ? '' : 's'} kept`,
      color: '#58a6ff',
    };
  }

  return {
    text: '○ Waiting for first kept frame',
    color: '#8b949e',
  };
}

function drawSyntheticDashcamRoad(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
  skyGrad.addColorStop(0, '#111827');
  skyGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.45);

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.45);
  for (let i = 0; i <= w; i += 40) {
    const hillY = h * 0.38 + Math.sin(i * 0.015) * 18 + Math.cos(i * 0.03) * 10;
    ctx.lineTo(i, hillY);
  }
  ctx.lineTo(w, h * 0.45);
  ctx.fill();

  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, h * 0.45, w, h * 0.55);

  const horizonY = h * 0.45;
  const horizonW = 20;
  const bottomW = w * 0.65;
  const cx = w * 0.5;

  ctx.fillStyle = '#262626';
  ctx.beginPath();
  ctx.moveTo(cx - horizonW, horizonY);
  ctx.lineTo(cx + horizonW, horizonY);
  ctx.lineTo(cx + bottomW, h);
  ctx.lineTo(cx - bottomW, h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - horizonW, horizonY);
  ctx.lineTo(cx - bottomW, h);
  ctx.moveTo(cx + horizonW, horizonY);
  ctx.lineTo(cx + bottomW, h);
  ctx.stroke();

  const numDashes = 10;
  const speed = 2.5;
  const offset = (t * speed) % 1;

  ctx.fillStyle = '#facc15';
  for (let i = 0; i < numDashes; i++) {
    const p0 = Math.pow((i + offset) / numDashes, 2.2);
    const p1 = Math.pow((i + offset + 0.4) / numDashes, 2.2);
    if (p1 > 1.0) continue;

    const y0 = horizonY + (h - horizonY) * p0;
    const y1 = horizonY + (h - horizonY) * p1;
    const lw0 = Math.max(1, 10 * p0);
    const lw1 = Math.max(1, 10 * p1);

    ctx.beginPath();
    ctx.moveTo(cx - lw0 / 2, y0);
    ctx.lineTo(cx + lw0 / 2, y0);
    ctx.lineTo(cx + lw1 / 2, y1);
    ctx.lineTo(cx - lw1 / 2, y1);
    ctx.closePath();
    ctx.fill();
  }

  ctx.font = 'mono 11px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(
    `CAM01 · 2024-03-15 08:30:${String(Math.floor(t % 60)).padStart(2, '0')}`,
    16,
    h * 0.55
  );
}
