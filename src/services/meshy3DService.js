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
 * Checks Meshy AI backend service connectivity and configuration.
 */
export const checkMeshyHealth = async () => {
  try {
    const res = await fetch(apiUrl('/api/rooftops/generate-3d/health'), {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[meshy3DService] Health check failed:', err);
  }
  return { configured: false, engine: 'meshy', version: '7.1' };
};

/**
 * Polls the status of an active Meshy 3D generation task until completion.
 */
export const pollMeshyTaskStatus = async (taskId, apiKey = null, onProgress = null) => {
  const maxPollingSeconds = 180;
  const pollIntervalMs = 2500;
  const startTime = Date.now();

  const query = apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : '';

  while (Date.now() - startTime < maxPollingSeconds * 1000) {
    try {
      // 1. Try backend proxy first
      let res;
      try {
        res = await fetch(apiUrl(`/api/rooftops/generate-3d/status/${taskId}${query}`), {
          headers: getAuthHeaders(),
        });
      } catch {
        // Fallback to direct Meshy API if backend proxy is unavailable
        if (apiKey) {
          res = await fetch(`https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`, {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        const status = (data.status || '').toUpperCase();
        const progress = data.progress ?? 0;

        onProgress?.({
          status: status.toLowerCase(),
          progress: Math.min(100, Math.max(5, progress)),
          message:
            status === 'SUCCEEDED'
              ? 'Meshy 7.1 mesh compilation completed!'
              : status === 'IN_PROGRESS'
              ? `Compiling 3D geometry & PBR textures (${progress}%)...`
              : 'Processing in Meshy AI cloud cluster...',
        });

        const glbUrl = data.modelGlbUrl || data.model_urls?.glb;
        if (status === 'SUCCEEDED' && glbUrl) {
          return {
            taskId,
            status: 'success',
            modelGlbUrl: glbUrl,
            modelFbxUrl: data.model_urls?.fbx || data.modelFbxUrl,
            thumbnailUrl: data.thumbnailUrl || data.thumbnail_url,
            message: 'Meshy 7.1 Flagship 3D mesh compiled successfully',
          };
        }

        if (status === 'FAILED') {
          throw new Error(data.task_error || data.message || 'Meshy 3D model generation failed');
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('failed')) {
        throw err;
      }
      console.warn('[meshy3DService] Polling attempt error:', err);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Meshy 3D generation timed out after ${maxPollingSeconds}s`);
};

/**
 * Triggers 3D rooftop generation via Meshy AI (Meshy 7.1 Flagship).
 * Supports public URL, base64 data URI, or geocoded GPS coordinates.
 */
export const generateMeshy3DModel = async (params, onProgress = null) => {
  const {
    imageUrl,
    latitude,
    longitude,
    zoom = 19,
    apiKey,
    aiModel = 'meshy-7.1',
    mode = 'high_detail',
    enablePbr = true,
    shouldRemesh = true,
  } = params;

  if (apiKey && !apiKey.trim().startsWith('msy_')) {
    throw new Error(
      "Invalid Meshy API Key: Meshy keys start with 'msy_'. Please obtain your key from https://www.meshy.ai/workspace."
    );
  }

  onProgress?.({ status: 'submitting', progress: 5, message: 'Initiating Meshy 7.1 Flagship session...' });

  const payload = {
    imageUrl: imageUrl || undefined,
    latitude: latitude || undefined,
    longitude: longitude || undefined,
    zoom,
    apiKey: apiKey || undefined,
    aiModel,
    mode,
    enablePbr,
    shouldRemesh,
    waitForResult: false,
  };

  let initialResponse;
  let usedDirectApi = false;

  // Attempt backend proxy first
  try {
    const response = await fetch(apiUrl('/api/rooftops/generate-3d'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      initialResponse = await response.json();
    } else {
      let errMsg = `Server returned HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {
        // ignore
      }
      // If backend failed and we have an API key, fallback to direct Meshy API call
      if (apiKey && (response.status === 404 || response.status === 500)) {
        usedDirectApi = true;
      } else {
        throw new Error(errMsg);
      }
    }
  } catch (backendErr) {
    if (apiKey) {
      usedDirectApi = true;
    } else {
      throw backendErr;
    }
  }

  // Direct Meshy OpenAPI Fallback if needed
  if (usedDirectApi && apiKey) {
    if (!imageUrl) {
      throw new Error(
        'Direct Meshy API requires an image URL or uploaded photo. Please select an image or select a rooftop first.'
      );
    }

    const meshyDirectPayload = {
      image_url: imageUrl,
      ai_model: aiModel || 'meshy-7.1',
      enable_pbr: enablePbr,
      should_remesh: shouldRemesh,
      should_texture: true,
      geometry_resolution: mode === 'high_detail' ? '4k' : 'standard',
    };

    const directRes = await fetch('https://api.meshy.ai/openapi/v1/image-to-3d', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meshyDirectPayload),
    });

    if (!directRes.ok) {
      const errText = await directRes.text();
      throw new Error(`Meshy API rejected request (HTTP ${directRes.status}): ${errText}`);
    }

    const directJson = await directRes.json();
    initialResponse = { taskId: directJson.result || directJson.id };
  }

  const taskId = initialResponse?.taskId || initialResponse?.id || initialResponse?.result;
  if (!taskId) {
    throw new Error('No task ID received from Meshy 3D service');
  }

  onProgress?.({
    status: 'queued',
    progress: 10,
    taskId,
    message: 'Task queued on Meshy 7.1 AI cluster...',
  });

  return await pollMeshyTaskStatus(taskId, apiKey, onProgress);
};
