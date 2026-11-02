import { ExtractRequest, JobState, CachedRunRecord } from '../types';
import { DEFAULT_EXTRACT_REQUEST } from './simulationEngine';

const STORAGE_KEYS = {
  CONFIG: 'dashcam_poc_config_v1',
  JOB_STATE: 'dashcam_poc_active_job_v1',
  RUN_HISTORY: 'dashcam_poc_run_history_v1',
};

const MAX_HISTORY_ITEMS = 8;

export function loadCachedConfig(): ExtractRequest {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return DEFAULT_EXTRACT_REQUEST;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_EXTRACT_REQUEST,
      ...parsed,
      gates: {
        ...DEFAULT_EXTRACT_REQUEST.gates,
        ...(parsed.gates || {}),
      },
    };
  } catch {
    return DEFAULT_EXTRACT_REQUEST;
  }
}

export function saveCachedConfig(config: ExtractRequest): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors in restricted frames
  }
}

export function resetCachedConfig(): ExtractRequest {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
  } catch {
    // Ignore
  }
  return DEFAULT_EXTRACT_REQUEST;
}

export function loadCachedJobState(): JobState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.JOB_STATE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JobState;
    if (!parsed || typeof parsed.state !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCachedJobState(job: JobState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.JOB_STATE, JSON.stringify(job));
  } catch {
    // Ignore
  }
}

export function clearCachedJobState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.JOB_STATE);
  } catch {
    // Ignore
  }
}

export function loadRunHistory(): CachedRunRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RUN_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendRunHistory(record: CachedRunRecord): CachedRunRecord[] {
  try {
    const current = loadRunHistory();
    const updated = [record, ...current.filter((r) => r.id !== record.id)].slice(
      0,
      MAX_HISTORY_ITEMS
    );
    localStorage.setItem(STORAGE_KEYS.RUN_HISTORY, JSON.stringify(updated));
    return updated;
  } catch {
    return [record];
  }
}

export function clearRunHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.RUN_HISTORY);
  } catch {
    // Ignore
  }
}
