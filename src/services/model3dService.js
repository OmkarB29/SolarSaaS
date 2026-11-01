import { apiUrl } from './apiConfig';

const getStoredAuth = () => {
  try {
    return (
      JSON.parse(localStorage.getItem('solarscope.auth')) ||
      JSON.parse(sessionStorage.getItem('solarscope.session'))
    );
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
   * Submit a new 3D model generation job or retrieve cached equivalent
   */
  async createJob(payload) {
    const response = await fetch(apiUrl('/api/model3d/jobs'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create 3D job (${response.status})`);
    }

    return await response.json();
  },

  /**
   * Fetch current job status and progress
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
    return apiUrl(`/api/model3d/jobs/${jobId}/model`);
  },

  /**
   * List all 3D jobs for the logged in user
   */
  async listUserJobs() {
    const response = await fetch(apiUrl('/api/model3d/jobs'), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
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
