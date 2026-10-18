import React, { useState } from 'react';
import {
  ArrowLeft,
  Server,
  CheckCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { CloudJobRequest, CloudJobStatus } from '../types';
import { CLOUD_MACHINE_TYPES } from '../data/mockData';

interface CloudScreenProps {
  onBack: () => void;
}

export const CloudScreen: React.FC<CloudScreenProps> = ({ onBack }) => {
  const [form, setForm] = useState<CloudJobRequest>({
    project: 'dashcam-survey-prod',
    region: 'europe-west1',
    stagingBucket: 'gs://dashcam-pipeline-artifacts',
    imageUri: 'europe-west1-docker.pkg.dev/dashcam-survey-prod/dashcam/pipeline:v1.0',
    machineType: CLOUD_MACHINE_TYPES[0],
    jobName: 'dashcam-poc-survey',
    videosUri: 'gs://dashcam-raw-footage/2024-03-15',
    gpxUri: 'gs://dashcam-telemetry/tracks/day1.gpx',
  });

  const [status, setStatus] = useState<CloudJobStatus>({ state: 'idle' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ state: 'submitting' });

    // Simulate packaging and submitting job to Vertex AI
    setTimeout(() => {
      const generatedJobName = `${form.jobName}-${Date.now().toString().slice(-6)}`;
      setStatus({
        state: 'submitted',
        detail: {
          job_name: generatedJobName,
          console_url: `https://console.cloud.google.com/vertex-ai/training/custom-jobs/${form.region}/${generatedJobName}?project=${form.project}`,
          outputs_uri: `${form.stagingBucket}/outputs/${generatedJobName}/`,
        },
      });
    }, 2200);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Main Card */}
      <div className="rounded-2xl bg-[#161b22] border border-[#30363d] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#30363d] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#58a6ff]/10 text-[#58a6ff] flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Google Cloud Vertex AI Launcher</span>
              </h2>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Dispatch batch frame extraction to Google Cloud Vertex AI Custom Training Jobs.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#30363d] text-[#3fb950] border border-[#30363d]">
            GCP Vertex API
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">
                GCP Project ID
              </label>
              <input
                type="text"
                required
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono focus:border-[#58a6ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">
                Cloud Region
              </label>
              <input
                type="text"
                required
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono focus:border-[#58a6ff] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">
                Staging Cloud Storage Bucket
              </label>
              <input
                type="text"
                required
                value={form.stagingBucket}
                onChange={(e) => setForm({ ...form, stagingBucket: e.target.value })}
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono focus:border-[#58a6ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">
                Custom Container Image (Artifact Registry)
              </label>
              <input
                type="text"
                required
                value={form.imageUri}
                onChange={(e) => setForm({ ...form, imageUri: e.target.value })}
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono focus:border-[#58a6ff] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">
                Vertex Machine Type
              </label>
              <select
                value={form.machineType}
                onChange={(e) => setForm({ ...form, machineType: e.target.value })}
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs focus:border-[#58a6ff] focus:outline-none"
              >
                {CLOUD_MACHINE_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">
                Custom Job Name Prefix
              </label>
              <input
                type="text"
                required
                value={form.jobName}
                onChange={(e) => setForm({ ...form, jobName: e.target.value })}
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono focus:border-[#58a6ff] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">
                Footage gs:// Prefix (Optional)
              </label>
              <input
                type="text"
                value={form.videosUri}
                onChange={(e) => setForm({ ...form, videosUri: e.target.value })}
                placeholder="gs://my-bucket/footage/2026-08-01"
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono focus:border-[#58a6ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">
                GPX Track gs:// URI (Optional)
              </label>
              <input
                type="text"
                value={form.gpxUri}
                onChange={(e) => setForm({ ...form, gpxUri: e.target.value })}
                placeholder="gs://my-bucket/tracks/day1.gpx"
                className="w-full bg-[#0d1117] text-[#e6edf3] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono focus:border-[#58a6ff] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#30363d] flex items-center justify-between">
            <div className="text-xs text-[#8b949e]">
              Requires Google Application Default Credentials (ADC)
            </div>
            <button
              type="submit"
              disabled={status.state === 'submitting'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#58a6ff] text-[#04121f] font-semibold text-xs sm:text-sm hover:bg-[#79b8ff] transition-all cursor-pointer disabled:opacity-50"
            >
              {status.state === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Staging & Submitting...</span>
                </>
              ) : (
                <>
                  <Server className="w-4 h-4" />
                  <span>Submit Vertex Custom Job</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Status display */}
        {status.state === 'submitting' && (
          <div className="mt-6 p-4 rounded-xl bg-[#58a6ff]/10 border border-[#58a6ff]/30 text-xs text-[#58a6ff] flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
            <div>
              <div className="font-semibold">Packaging repo and staging to Google Cloud Storage…</div>
              <div className="text-[11px] text-[#8b949e] mt-0.5">
                Staging tarball to {form.stagingBucket}/source.tar.gz and invoking vertexai.CustomJob.run()
              </div>
            </div>
          </div>
        )}

        {status.state === 'submitted' && status.detail && (
          <div className="mt-6 p-4 rounded-xl bg-[#3fb950]/10 border border-[#3fb950]/30 text-xs text-[#3fb950] space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <CheckCircle className="w-5 h-5 text-[#3fb950]" />
              <span>Vertex Custom Job Submitted Successfully</span>
            </div>
            <div className="font-mono text-[11px] text-[#e6edf3]">
              Job Name: <span className="font-bold text-[#58a6ff]">{status.detail.job_name}</span>
            </div>
            <div className="font-mono text-[11px] text-[#8b949e]">
              Outputs landing directory: <span className="text-[#e6edf3]">{status.detail.outputs_uri}</span>
            </div>
            <div className="pt-2">
              <a
                href={status.detail.console_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3fb950]/20 text-[#3fb950] hover:bg-[#3fb950]/30 transition-colors font-medium"
              >
                <span>View Job in Google Cloud Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
