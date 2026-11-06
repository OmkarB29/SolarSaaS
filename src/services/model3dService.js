import { apiUrl } from './apiConfig';
import { authService, notifyUnauthorized } from './authService';

const getStoredAuth = () => {
  try {
    return authService.getStoredAuth();
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const token = getStoredAuth()?.token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const model3dService = {
  /**
   * Preview real top-down satellite imagery or validate user-uploaded drone photo
   * BEFORE any job or credits are consumed (Requirement 6).
   * Exact bytes, dimensions, size, and SHA-256 fingerprint are returned.
   */
  async previewCapture(payload) {
    const token = getStoredAuth()?.token;
    const response = await fetch(apiUrl('/api/model3d/preview-capture'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errMsg = `Preview capture failed (${response.status})`;
      try {
        const body = await response.json();
        errMsg = body.message || body.error || errMsg;
      } catch {
        // ignore
      }
      throw new Error(errMsg);
    }

    return await response.json();
  },

  /**
   * Create a new 3D model job with verified real satellite imagery.
   * Single image path only: unmodified provider bytes pass-through to Meshy.
   */
  async createJob(payload) {
    let response = await fetch(apiUrl('/api/model3d/jobs'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      console.warn('[model3dService] 401 Unauthorized. Attempting session auto-recovery...');
      notifyUnauthorized();

      try {
        const freshAuth = await authService.loginDemoUser();
        if (freshAuth?.token) {
          response = await fetch(apiUrl('/api/model3d/jobs'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${freshAuth.token}`,
            },
            body: JSON.stringify(payload),
          });
        }
      } catch (reAuthErr) {
        console.warn('[model3dService] Silent re-authentication failed:', reAuthErr);
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Your session has expired. Please refresh your session or log in again.');
      }
      let errMsg = `Failed to create 3D job (${response.status})`;
      try {
        const body = await response.json();
        errMsg = body.message || body.error || errMsg;
      } catch {
        // ignore
      }
      throw new Error(errMsg);
    }

    return await response.json();
  },

  /**
   * Fetch current job status and audit metadata
   */
  async getJob(jobId) {
    const response = await fetch(apiUrl(`/api/model3d/jobs/${jobId}`), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch 3D job (${response.status})`);
    }

    return await response.json();
  },

  /**
   * Returns direct stream URL for the downloaded GLB file
   */
  getModelUrl(jobId) {
    if (!jobId) return '/models/industrial_hvac_facility.glb';
    if (typeof jobId === 'string' && (jobId.startsWith('/') || jobId.startsWith('http'))) {
      return jobId;
    }
    return apiUrl(`/api/model3d/jobs/${jobId}/model`);
  },

  /**
   * Fetch GLB binary as a Blob Object URL with authentication headers if available
   */
  async fetchModelBlobUrl(jobId) {
    const targetUrl = this.getModelUrl(jobId);
    const token = getStoredAuth()?.token;
    const res = await fetch(targetUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error(`Failed to download 3D GLB model (${res.status})`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  /**
   * List all 3D jobs for the logged in user
   */
  async listUserJobs() {
    const response = await fetch(apiUrl('/api/model3d/jobs'), {
      headers: getAuthHeaders(),
    }).catch(() => null);

    if (!response || !response.ok) {
      return [];
    }

    return await response.json();
  },

  /**
   * Polls job until terminal status (SUCCEEDED, FAILED, CANCELED)
   */
  async pollJob(jobId, onProgress = null, intervalMs = 2500, maxAttempts = 120) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts++;
      const job = await this.getJob(jobId);
      if (onProgress) onProgress(job);

      if (job.status === 'SUCCEEDED' || job.status === 'FAILED' || job.status === 'CANCELED') {
        return job;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error('3D model generation timed out. You can check back in your 3D gallery.');
  },
};
