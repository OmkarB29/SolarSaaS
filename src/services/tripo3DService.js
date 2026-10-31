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

/**
 * Checks Tripo AI backend service connectivity and configuration.
 */
export const checkTripoHealth = async () => {
  try {
    const res = await fetch(apiUrl('/api/rooftops/generate-3d/health'), {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[tripo3DService] Health check failed:', err);
  }
  return { configured: false, version: 'v3' };
};

/**
 * Polls the status of an active Tripo 3D task until completion.
 */
export const pollTripoTaskStatus = async (taskId, apiKey = null, onProgress = null) => {
  const maxPollingSeconds = 120;
  const pollIntervalMs = 2500;
  const startTime = Date.now();

  const query = apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : '';

  while (Date.now() - startTime < maxPollingSeconds * 1000) {
    try {
      const res = await fetch(apiUrl(`/api/rooftops/generate-3d/status/${taskId}${query}`), {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Status check HTTP error ${res.status}`);
      }

      const data = await res.json();
      onProgress?.(data);

      if (data.status === 'success' && data.modelGlbUrl) {
        return data;
      }

      if (data.status === 'failed' || data.status === 'banned') {
        throw new Error(data.message || 'Tripo AI 3D generation failed');
      }
    } catch (err) {
      console.warn('[tripo3DService] Polling attempt error:', err);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Tripo 3D generation timed out after ${maxPollingSeconds}s`);
};

/**
 * Triggers 3D rooftop generation via Tripo AI V3.
 * Supports image URL, GPS coordinates, and direct secret key override.
 */
export const generateTripo3DModel = async (params, onProgress = null) => {
  const { imageUrl, latitude, longitude, zoom, apiKey, modelVersion } = params;

  if (apiKey && apiKey.trim().startsWith('tcli_')) {
    throw new Error(
      "Invalid API Key: You entered a Tripo Client ID ('tcli_...'). Tripo API requires a Secret Key starting with 'tsk_'. Please copy the Secret Key from platform.tripo3d.ai."
    );
  }

  const payload = {
    imageUrl: imageUrl || undefined,
    latitude: latitude || undefined,
    longitude: longitude || undefined,
    zoom: zoom || 19,
    apiKey: apiKey || undefined,
    modelVersion: modelVersion && modelVersion !== 'v3-geometry' ? modelVersion : 'v3.1-20260211',
    waitForResult: false, // Poll asynchronously on frontend for live progress feedback
  };

  onProgress?.({ status: 'submitting', progress: 5, message: 'Contacting Tripo AI V3 API...' });

  const response = await fetch(apiUrl('/api/rooftops/generate-3d'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errMsg = `Server returned HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errMsg = errJson.error;
    } catch {
      // ignore
    }
    if (response.status === 401 || errMsg.includes('Invalid API key') || errMsg.includes('tcli_')) {
      errMsg = "Tripo Authentication Failed (HTTP 401): The API Key is invalid. Tripo AI requires a Secret Key starting with 'tsk_'. If you have a 'tcli_...' value, that is your Client ID, not the Secret Key. Please copy your Secret Key from platform.tripo3d.ai.";
    }
    throw new Error(errMsg);
  }

  const initialResponse = await response.json();

  if (initialResponse.status === 'success' && initialResponse.modelGlbUrl) {
    return initialResponse;
  }

  const taskId = initialResponse.taskId;
  if (!taskId) {
    throw new Error('No task ID received from Tripo service');
  }

  onProgress?.({
    status: 'queued',
    progress: 10,
    taskId,
    message: 'Task queued on Tripo AI cloud cluster...',
  });

  // Start polling
  return await pollTripoTaskStatus(taskId, apiKey, onProgress);
};
