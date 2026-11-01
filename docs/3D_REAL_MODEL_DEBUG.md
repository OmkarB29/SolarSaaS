# 3D Real Model Debug Report (Master Prompt Phase 7, Step A)

## Executive Summary
This document provides complete proof of what was actually happening with the 3D model generation pipeline, diagnosing why `/panel-optimizer` showed only the dark ground grid, measured perimeter, and floating panels without the realistic building mesh.

---

## 1. Startup Diagnostics & Mock/Fallback Code Paths

### A. Effective Mode and Key Resolution
- **Meshy Mode**: `REAL`
- **Meshy API Key Present in Environment**: `yes`
- **Effective `meshy.mock-enabled`**: `false` (configured in `application.properties` as `meshy.mock-enabled=${MESHY_MOCK_ENABLED:false}`)
- **Startup Diagnostics Logger**: Added `@PostConstruct` in `Model3DService.java` to explicitly log:
  ```
  [3D Pipeline Startup] Meshy Mode: REAL | API Key Configured: yes | Effective Mock-Enabled: false
  ```
  *(Never logs the key value, strictly adhering to secret sanitization rules).*

### B. Exhaustive Audit of All Mock / Fallback Code Paths
1. **`Model3DService.java`**:
   - `isMock` evaluation: `boolean isMock = !hasApiKey || "true".equalsIgnoreCase(System.getenv("MESHY_MOCK_ENABLED"));`
   - Real Meshy pipeline is now guaranteed when `hasApiKey == true`.
2. **`GlbStorageService.java`**:
   - Removed the silent fallback that returned `models/mock-building.glb` whenever an on-disk GLB was missing.
   - Throws `IOException` if file is absent, prompting `Model3DService` to re-fetch/stream from Meshy directly rather than inject placeholder models.
3. **`Model3DCanvas.jsx`**:
   - Removed `const [modelGlbUrl, setModelGlbUrl] = useState('/models/mock-building.glb');`.
   - Now initializes to `null`, ensuring no fake slab or cube is ever displayed under the "Realistic Model (AI)" toggle.

---

## 2. End-to-End Trace of Latest Model3DJob & Meshy Tasks

### A. Meshy AI Account Tasks (Cross-checked via GET `/openapi/v1/image-to-3d`)
Direct query to Meshy API with the configured key returned 3 real completed tasks:

1. **Task #1**:
   - **Task ID**: `01a1979d-a875-731d-855c-07d634893746`
   - **Created At**: `2026-11-01T14:57:34.579Z` (20:27 IST)
   - **Finished At**: `2026-11-01T14:58:24.056Z` (Duration: 49.5s)
   - **Status**: `SUCCEEDED`
   - **Progress**: `100%`
   - **Consumed Credits**: `30`
   - **Signed GLB URL**: `https://assets.meshy.ai/ca2f0e4c-8ffb-41fb-b2ef-018f718549e4/tasks/01a1979d-a875-731d-855c-07d634893746/output/model.glb`

2. **Task #2**:
   - **Task ID**: `01a1976c-1767-7445-b575-672e2a6ffb2d`
   - **Created At**: `2026-11-01T14:03:26.296Z`
   - **Status**: `SUCCEEDED` (Credits: 30)

3. **Task #3**:
   - **Task ID**: `01a196a4-ded5-773c-ba9c-0a789fdfb26c`
   - **Created At**: `2026-11-01T10:25:50.166Z`
   - **Status**: `SUCCEEDED` (Credits: 30)

### B. Backend Latest Job Row Trace (Job #6 on Render)
- **Job ID**: `6`
- **Endpoint**: `https://solarscope-backend-wu7q.onrender.com/api/model3d/jobs/6/model`
- **HTTP Status**: `200 OK`
- **Content-Type**: `model/gltf-binary`
- **Payload Size**: **4,299,760 bytes (~4.3 MB)**
- **Verification**: Verified binary stream downloads completely and matches standard binary glTF specification (`glTF` magic header).

---

## 3. Browser GLB Request & Three.js Canvas Root Cause Analysis

### Root Cause 1: Lack of Active Polling on `/panel-optimizer`
- When the user initiated generation on `/model-3d` and immediately navigated to `/panel-optimizer`, the job was stored in `localStorage` in the `PENDING` or `IN_PROGRESS` state.
- `PanelOptimizer.jsx` initialized `model3dJob` from `localStorage` but did **not** run a polling loop.
- Consequently, `model3dJob.status` was frozen at `'IN_PROGRESS'`.
- In `Model3DCanvas.jsx`, `job?.status === 'SUCCEEDED'` evaluated to `false`, causing `modelGlbUrl` to remain `null`.
- Because `modelGlbUrl` was `null`, `{showAiModel && modelGlbUrl && (` evaluated to `false` and nothing rendered.

### Root Cause 2: Silent Error Swallowing in `SceneErrorBoundary` and `<Suspense>`
- In `Model3DCanvas.jsx`, Three.js mesh errors were wrapped in `<SceneErrorBoundary fallback={<group />}>` and `<Suspense fallback={null}>`.
- If an unauthenticated fetch failed or a blob was being parsed, the canvas silently fell back to an empty group `<group />` without exposing any error message or loading spinner to the user.

### Root Cause 3: Direct Meshy URL Missing from DTO
- The backend DTO `Model3DJobResponseDTO` was not serializing `modelUrl`. The browser was entirely dependent on Render's ephemeral storage endpoint `/api/model3d/jobs/{id}/model`, which could fail if the container restarted before the file was downloaded.

---

## 4. Fixes Implemented in Step A

1. **Authenticated GLB Fetch & Blob URL Generation**:
   - `Model3DCanvas.jsx` explicitly performs an authenticated fetch using `Bearer ${token}` against the model streaming endpoint, receives the raw binary, checks response headers, and constructs an isolated object Blob URL (`URL.createObjectURL(blob)`).
   - Automatically cleans up via `URL.revokeObjectURL` on unmount to prevent memory leaks.

2. **Active Polling in `PanelOptimizer.jsx`**:
   - Added a polling `useEffect` that detects any `model3dJob` in `'PENDING'` or `'IN_PROGRESS'` status and continuously polls `/api/model3d/jobs/{id}` until terminal status (`SUCCEEDED` or `FAILED`).
   - Automatically syncs the updated job into `localStorage` and triggers the canvas update.

3. **Active Geometry Source Badge (Requirement 5)**:
   - Added a visible diagnostic HUD badge in the top-left corner of the canvas:
     - **Source Name**: `"Meshy AI"`, `"Google Solar DSM"`, `"Parametric"`, or `"Mock"`
     - **Job ID**: `Job #6`
     - **Credits Consumed**: `30 cr`
     - **Mesh File Size**: `4.3 MB`
     - **Color Coded**: Emerald for real Meshy AI, Amber for Mock, Blue for In-Progress, Slate for Parametric.

4. **Real State & Diagnostic HUD (Requirement 4)**:
   - Shows active progress bar during generation.
   - Shows "Streaming GLB mesh from CDN..." during download.
   - Shows error badge with exact HTTP code or reason if download fails, along with a **[Retry]** button.

---

## 5. Verification Checklist
- [x] All 37/37 backend unit & integration tests pass (`mvn test`).
- [x] Frontend builds cleanly with zero errors (`npm run build`).
- [x] Git branch `feature/3d-rooftop-model` synchronized on both repositories (`OmkarB29/solarscope-backend` and `OmkarB29/SolarSaaS`).
- [x] Verified Job #6 GLB stream on Render: HTTP 200, 4.3 MB binary glTF.

---

## 6. Step B Implementation: Real Geometry Sources & Coplanar Flat Rooftop Placement

### A. Google Solar DSM Ingestion (B1 - Preferred where covered)
1. **Backend Integration (`SolarApiService.java` & `SolarController.java`)**:
   - `GET /api/solar/data-layers?latitude={lat}&longitude={lng}&radiusMeters={radius}&requiredQuality={quality}`
     - Validates and clamps `radiusMeters` between 10m and 100m (Google API limit).
     - Loops through documented qualities (`HIGH` -> `MEDIUM` -> `BASE`).
     - Caches responses in `ConcurrentHashMap` by `latitude_longitude_radius_quality` so repeated requests cost \$0.
   - `GET /api/solar/geotiff?url={encodedGoogleUrl}`
     - Secure backend proxy that attaches the Google Server API key server-side. The browser never sees the key.
     - SSRF protection: strictly enforces that URLs must originate from `https://solar.googleapis.com/`.
     - In-memory cache for GeoTIFF binaries (`byte[]`), preventing duplicate network fetches and quota usage.
     - Returns `image/tiff` with `Cache-Control: public, max-age=86400`.

2. **Client-Side GeoTIFF Ingestion (`solarDsmParser.js`)**:
   - Uses `geotiff.js` (`fromArrayBuffer`) in `src/utils/solarDsmParser.js`.
   - Parses Float32 elevation rasters and building mask rasters.
   - Computes ground reference elevation $H_{\text{ground}}$ from the 5th percentile of non-building pixels.
   - Computes relative height above ground: $h(x, z) = H_{\text{dsm}}(x, z) - H_{\text{ground}}$.
   - Exposes quality metadata: `imageryQuality`, `pixelSizeMeters`, `imageryDate`, and percentage of valid pixels (`validPixelPercent`).

### B. Fallback Hierarchy & Unified Metric Height Grid (B2 & B3)
All geometry sources feed into a single unified height provider interface:
- **Priority 1: Google Solar DSM** (where covered): Samples elevation $h(x, z)$ directly from the DSM raster.
- **Priority 2: Meshy AI 3D Mesh** (when available, e.g., Job #6): Loads real 4.3 MB GLB mesh and aligns roof surface to metric building height.
- **Priority 3: Parametric Flat Rooftop** (fallback, e.g. unmapped regions like India where Solar API returns 404): Generates flat rooftop surface at $h(x, z) = \text{buildingHeight} + \text{elevation}$.

### C. Coplanar Flat Rooftop Panel Placement
1. **Rotated Grid Math Fix**:
   - In `Model3DCanvas.jsx` procedural fallback and `localPanelOptimizer.js`:
   - Rotates the sampling coordinate system into roof-aligned coordinates $(u, v)$ using `dominantAngle` / `roofBearingDeg`.
   - Eliminates the jagged sawtooth / staircase pattern caused by unrotated axis-aligned bounds iteration.
2. **Obstacle Collision Avoidance**:
   - Integrated obstacle polygon collision checks into `localPanelOptimizer.js` and `Model3DCanvas.jsx`. Panels overlapping obstacle polygons or their safety buffer are rejected.
3. **Coplanar Roof Surface Snapping**:
   - Each panel is positioned at:
     $$X = cx, \quad Y = h(cx, cz) + 0.05, \quad Z = cz$$
   - Panels lie flush and coplanar directly on top of the flat rooftop surface without clipping or floating.

### D. Active Geometry Source Diagnostic Badge
The 3D canvas top-left HUD dynamically reflects the active geometry engine:
- **Google Solar DSM**: Displays `Source: Google Solar DSM | Quality: HIGH | Pixel: 0.1m | Valid: 99.4% | Date: 2023-06`.
- **Meshy AI**: Displays `Source: Meshy AI | Job #6 | 30 cr | 4.3 MB`.
- **Parametric**: Displays `Source: Parametric | Height: 3.5m` (with `Solar DSM Uncovered (Fallback)` in uncovered regions).
