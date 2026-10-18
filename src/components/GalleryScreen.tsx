import React, { useState } from 'react';
import {
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle,
  Maximize2,
  X
} from 'lucide-react';
import { ExtractedFrameItem } from '../types';
import { INITIAL_EXTRACTED_FRAMES } from '../data/mockData';

interface GalleryScreenProps {
  onBack: () => void;
}

export const GalleryScreen: React.FC<GalleryScreenProps> = ({ onBack }) => {
  const [frames] = useState<ExtractedFrameItem[]>(INITIAL_EXTRACTED_FRAMES);
  const [selectedVideo, setSelectedVideo] = useState<string>('all');
  const [activeModalFrame, setActiveModalFrame] = useState<ExtractedFrameItem | null>(null);

  const filteredFrames = selectedVideo === 'all'
    ? frames
    : frames.filter((f) => f.video.includes(selectedVideo));

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Top back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Main Container */}
      <div className="rounded-2xl bg-[#161b22] border border-[#30363d] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30363d] pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#58a6ff]" />
              <span>Extracted Frames & Quality Metrics</span>
            </h2>
            <p className="text-xs text-[#8b949e] mt-1">
              Visual proof of frames that passed quality, blur, illumination, and duplicate gates.
            </p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b949e]">Filter video:</span>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-2.5 py-1 text-xs focus:border-[#58a6ff] focus:outline-none"
            >
              <option value="all">All Videos ({frames.length})</option>
              <option value="083000">08:30 AM Morning Survey (6)</option>
              <option value="120000">12:00 PM Midday Survey (6)</option>
            </select>
          </div>
        </div>

        {/* Frames Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredFrames.map((frame) => (
            <div
              key={frame.id}
              className="group relative rounded-xl bg-[#0d1117] border border-[#30363d] overflow-hidden hover:border-[#58a6ff]/60 transition-all shadow-md flex flex-col"
            >
              {/* Image Preview */}
              <div
                onClick={() => setActiveModalFrame(frame)}
                className="relative aspect-[4/3] bg-black overflow-hidden cursor-pointer"
              >
                <img
                  src={frame.outputPath}
                  alt={`Frame ${frame.frameIndex}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to placeholder if asset not ready
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" fill="%23161b22"><rect width="320" height="240"/><text x="50%" y="50%" fill="%2358a6ff" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14">Extracted Frame #' +
                      frame.frameIndex +
                      '</text></svg>';
                  }}
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#161b22]/80 backdrop-blur border border-[#30363d] text-[10px] font-mono text-[#3fb950] flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>KEPT</span>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur text-[10px] font-mono text-white">
                  t = {frame.timestampSec.toFixed(1)}s (f#{frame.frameIndex})
                </div>
                <div className="absolute inset-0 bg-[#58a6ff]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="p-2 rounded-full bg-[#161b22]/90 text-white shadow">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Metrics Details */}
              <div className="p-3 text-xs space-y-2 flex-1 flex flex-col justify-between">
                <div className="font-mono text-[11px] text-[#8b949e] truncate" title={frame.video}>
                  {frame.video}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#161b22] p-2 rounded-lg border border-[#30363d]/60">
                  <div>
                    <span className="text-[#8b949e] block text-[10px]">Blur Score:</span>
                    <span className="text-[#58a6ff] font-semibold">{frame.blurScore.toFixed(1)}</span>
                    <span className="text-[9px] text-[#8b949e]"> (&gt;60)</span>
                  </div>
                  <div>
                    <span className="text-[#8b949e] block text-[10px]">Mean Intensity:</span>
                    <span className="text-[#3fb950] font-semibold">{frame.meanIntensity.toFixed(1)}</span>
                    <span className="text-[9px] text-[#8b949e]"> /255</span>
                  </div>
                  <div>
                    <span className="text-[#8b949e] block text-[10px]">Sun Elev:</span>
                    <span className="text-[#d29922] font-semibold">{frame.sunElevationDeg.toFixed(1)}°</span>
                  </div>
                  <div>
                    <span className="text-[#8b949e] block text-[10px]">Illum Conf:</span>
                    <span className="text-[#a371f7] font-semibold">{(frame.illumConfidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frame Detail Inspection Modal */}
      {activeModalFrame && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Frame Detail: #{activeModalFrame.frameIndex} (t = {activeModalFrame.timestampSec.toFixed(1)}s)
                </h3>
                <p className="text-xs text-[#8b949e] font-mono">{activeModalFrame.video}</p>
              </div>
              <button
                onClick={() => setActiveModalFrame(null)}
                className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#30363d] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={activeModalFrame.outputPath}
                alt="Frame zoom"
                className="max-h-full max-w-full object-contain rounded"
              />
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0d1117] border-t border-[#30363d] text-xs font-mono">
              <div>
                <span className="text-[#8b949e] block text-[10px]">Laplacian Blur:</span>
                <span className="text-[#58a6ff] text-sm font-bold">{activeModalFrame.blurScore}</span>
              </div>
              <div>
                <span className="text-[#8b949e] block text-[10px]">Pixel Intensity:</span>
                <span className="text-[#3fb950] text-sm font-bold">{activeModalFrame.meanIntensity}</span>
              </div>
              <div>
                <span className="text-[#8b949e] block text-[10px]">NOAA Solar Elevation:</span>
                <span className="text-[#d29922] text-sm font-bold">{activeModalFrame.sunElevationDeg}°</span>
              </div>
              <div>
                <span className="text-[#8b949e] block text-[10px]">Log Gain:</span>
                <span className="text-[#a371f7] text-sm font-bold">{activeModalFrame.logGain.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
