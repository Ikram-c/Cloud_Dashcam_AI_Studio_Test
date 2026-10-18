import React, { useEffect, useRef } from 'react';
import { Loader2, Cpu } from 'lucide-react';
import { JobState } from '../types';

interface ProcessingScreenProps {
  job: JobState;
  onCancel?: () => void;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ job, onCancel }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [job.logs]);

  const percentage = Math.round(job.progress * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-2xl bg-[#161b22] border border-[#30363d] p-6 sm:p-8 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363d] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#58a6ff]/10 text-[#58a6ff] flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Processing Pipeline</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30">
                  {percentage}%
                </span>
              </h2>
              <p className="text-xs text-[#8b949e] mt-0.5">
                {job.video ? `Processing ${job.video}` : 'Initializing pipeline runner & telemetry…'}
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-[#8b949e] hover:text-[#f85149] transition-colors cursor-pointer px-2.5 py-1 rounded bg-[#21262d] border border-[#30363d]"
            >
              Abort Job
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs text-[#8b949e]">
            <span>Overall Batch Progress</span>
            <span className="font-mono text-white font-medium">{percentage}%</span>
          </div>
          <div className="h-3 w-full bg-[#0d1117] rounded-full overflow-hidden border border-[#30363d] p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Active Processing Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="text-[11px] text-[#8b949e]">Carrier Network</div>
            <div className="text-xs font-mono font-semibold text-[#58a6ff] mt-0.5 uppercase">
              {job.network || 'VODAFONE'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="text-[11px] text-[#8b949e]">Active Stream</div>
            <div className="text-xs font-mono font-semibold text-[#e6edf3] mt-0.5 truncate">
              {job.video || 'Preparing...'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="text-[11px] text-[#8b949e]">Quality Gates</div>
            <div className="text-xs font-mono font-semibold text-[#3fb950] mt-0.5">
              Active (6/6)
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
            <div className="text-[11px] text-[#8b949e]">Upstream Buffer</div>
            <div className="text-xs font-mono font-semibold text-[#d29922] mt-0.5">
              Liang-Barsky
            </div>
          </div>
        </div>

        {/* Live Execution Logs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8b949e]">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Pipeline Trace & Subsystem Logs</span>
            </span>
            <span className="text-[10px] font-mono text-[#8b949e]">STREAM ACTIVE</span>
          </div>

          <div
            ref={logContainerRef}
            className="h-56 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 font-mono text-[11px] text-[#8b949e] overflow-y-auto space-y-1.5 leading-relaxed"
          >
            {(job.logs && job.logs.length > 0) ? (
              job.logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#30363d] select-none">{String(idx + 1).padStart(3, '0')}</span>
                  <span
                    className={
                      log.includes('REJECT') || log.includes('error')
                        ? 'text-[#f85149]'
                        : log.includes('PASS') || log.includes('KEPT') || log.includes('complete')
                        ? 'text-[#3fb950]'
                        : log.includes('ZONE') || log.includes('CHUNK')
                        ? 'text-[#d29922]'
                        : 'text-[#e6edf3]'
                    }
                  >
                    {log}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[#8b949e]/60 italic">Initializing workers and opening video capture streams...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
