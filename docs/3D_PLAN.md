# SolarSaaS 3D Rooftop Selection & Meshy AI 3D Model Plan

## 1. Executive Summary & Architectural Overview
This document specifies the technical architecture, official API facts, data schemas, security measures, and risk mitigations for the SolarSaaS 3D Rooftop Selection and AI-driven 3D Model Generation feature.

The goal is to allow users to interact with a photorealistic 3D map, search addresses, delineate roof surfaces, mark obstacle geometries (HVAC, tanks, stairwells), and automatically produce an interactive 3D digital twin. Panel layouts and energy yield metrics are calculated strictly using real-world measured metric geometry derived from user-selected coordinates, while Meshy AI provides an illustrative 3D mesh.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Frontend (React 19)                           │
│  - /model-3d Route (Model3DView.jsx)                                   │
│  - Photorealistic 3D Map (Google Maps JS API "maps3d" Map3DElement)    │
│  - 2D Satellite Fallback (google.maps.Polygon)                         │
│  - Interactive Rooftop & Obstacle Polygons (Turf.js metrics)           │
│  - Interactive 3D Viewer (Three.js OrbitControls, Multi-layer display) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ JWT Authenticated REST
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Backend (Spring Boot 8081)                        │
│  - com.mpc.model3d (Controller, Service, Entity, Repository)           │
│  - RooftopImageProvider (GoogleStaticMapsProvider, UploadedImage)       │
│  - Web-Mercator Polygon Pixel Masking Engine                           │
│  - MeshyClient (Async Poller, Retry-After, Exponential Backoff)        │
│  - Local GLB Storage Manager (3-Day Expiration Defense)                │
│  - Mock Mode (Zero-credit development & automated testing)             │
│  - Obstacle-Aware OptimizationEngine (Buffer & Intersection Checks)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS API Calls
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       ┌────────────────────────┐      ┌────────────────────────┐
       │   Google Maps Platform  │      │      Meshy AI API      │
       │ - Maps JS API (maps3d) │      │ - POST /image-to-3d    │
       │ - Static Maps API      │      │ - GET /image-to-3d/{id}│
       │ - Solar API Insights   │      │ - GET /balance         │
       └────────────────────────┘      └────────────────────────┘
```

---

## 2. Verified Facts & Documentation Findings (Step 0)

### 2.1 Meshy AI API
* **Base URL:** `https://api.meshy.ai/openapi/v1`
* **Authentication:** `Authorization: Bearer ${MESHY_API_KEY}`
* **Image-to-3D Task Creation (`POST /openapi/v1/image-to-3d`):**
  * `image_url`: Public HTTPS URL or `data:image/png;base64,...` data URI (max 20 MB). Since `localhost` is not publicly reachable, base64 data URIs are required for locally processed images.
  * `ai_model`: `"meshy-7.1"` (flagship generation engine).
  * `topology`: `"triangle"` (clean architectural geometry).
  * `target_polycount`: `60000` (balanced detail for web viewer performance).
  * `should_remesh`: `true`.
  * `should_texture`: `true`.
  * `enable_pbr`: `false` (standard diffuse/normal textures; configurable).
  * `image_enhancement`: `false` (avoids AI hallucinating structural roof details).
  * `target_formats`: `["glb"]`.
  * *Strictly Deprecated / Omitted:* `ultra_mode`, `hd_texture`, `symmetry_mode`, `is_a_t_pose`, `surface_mode`, `lowpoly`.
  * Response: `{ "result": "<taskId>" }`.
* **Task Polling (`GET /openapi/v1/image-to-3d/{id}`):**
  * Status transitions: `PENDING` -> `IN_PROGRESS` -> `SUCCEEDED` / `FAILED` / `CANCELED`.
  * Status 429 returns `Retry-After` header (seconds to wait; default 5s).
  * Task response includes `consumed_credits` and `task_error.message`.
* **Asset Retention & Expiration:**
  * Meshy retains generated 3D files for only **3 days (72 hours)** on non-Enterprise plans before permanent deletion.
  * Signed URLs (`assets.meshy.ai`) expire at `expires_at`.
  * **Architectural Mandate:** The backend must immediately download `model_urls.glb` into local storage (`uploads/models3d/{jobId}.glb`) upon reaching `SUCCEEDED` status, serving it via `GET /api/model3d/jobs/{id}/model`.
* **Balance Endpoint:** `GET /openapi/v1/balance` returns `balance`, `monthly_credits`, and `permanent_credits`.

### 2.2 Google Maps Platform & Photorealistic 3D Maps
* **Library & Custom Element:** Loaded via `@googlemaps/js-api-loader` importing library `"maps3d"`. Uses the `<gmp-map-3d>` / `Map3DElement` Web Component.
* **Click Events & Interactivity:**
  * `Map3DElement` listens for `'gmp-click'` events. Event payload provides `event.position` with `{ lat, lng, altitude }`.
  * Non-interactive `Polygon3DElement` and `Marker3DElement` do not fire click events. Interactive counterparts are `Polygon3DInteractiveElement` and `Marker3DInteractiveElement`.
* **DrawingManager Status:**
  * `google.maps.drawing.DrawingManager` was **deprecated in August 2025 and removed in v3.65+**. Calling it causes runtime exceptions. Custom vertex-click handlers and reactive polyline/polygon renderers must be used.
* **Coverage in Bengaluru / Karnataka:**
  * Google Photorealistic 3D tiles cover 2,500+ global metro areas. Bengaluru urban coverage is actively rolling out in Google Earth datasets, but outskirts and specific neighborhoods may lack 3D mesh tiles or WebGL2 context may fail on low-end clients.
  * **Fallback Strategy:** Automatic detection and one-click manual toggle to a 2D Google Satellite map with `google.maps.Polygon` editing, retaining identical coordinate data and user workflow.
* **Maps Static API Limits:**
  * Maximum image dimensions: `640x640` pixels. With `scale=2`, produces high-resolution `1280x1280` pixels.
  * Maximum zoom: typically 21-22 in urban areas.
* **Google Solar API:**
  * `GET https://solar.googleapis.com/v1/buildingInsights:findClosest` returns roof bounding boxes, panel counts, and pitch/azimuth segment stats.
* **Terms of Service & Licensing Restrictions:**
  * Google Maps Platform ToS (Sections 3.2.3 & 3.2.4) prohibits bulk exporting, scraping, persistent image caching, and creating derivative works or training AI/ML models on Google Maps imagery.
  * **Compliance Measure:** Automated Google Static capture is disabled by default behind the configuration flag `rooftop.imagery.google-static.enabled=false`. The application provides `UploadedImageProvider` so users can legally upload drone, satellite, or architectural site photos.

---

## 3. Database Schema & File List

### 3.1 Database Table: `model3d_jobs`
```sql
CREATE TABLE model3d_jobs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    polygon_hash VARCHAR(64) NOT NULL,
    polygon_json TEXT NOT NULL,
    obstacles_json TEXT,
    address VARCHAR(500),
    image_source VARCHAR(50) NOT NULL, -- GOOGLE_STATIC, UPLOADED, MOCK
    meshy_task_id VARCHAR(100),
    status VARCHAR(30) NOT NULL,        -- PENDING, IN_PROGRESS, SUCCEEDED, FAILED, CANCELED
    progress INT NOT NULL DEFAULT 0,
    glb_path VARCHAR(500),
    consumed_credits INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_model3d_jobs_user ON model3d_jobs(user_id);
CREATE INDEX idx_model3d_jobs_hash ON model3d_jobs(polygon_hash);
```

### 3.2 Endpoints (REST API)
* `POST /api/model3d/jobs`: Creates a new 3D model job or returns existing cached job for identical polygon hash. (JWT authenticated).
* `GET /api/model3d/jobs/{id}`: Returns status, progress, metrics, and metadata. (JWT authenticated, user-scoped).
* `GET /api/model3d/jobs/{id}/model`: Streams the downloaded GLB binary file directly to the client. (JWT authenticated, user-scoped).
* `GET /api/model3d/jobs`: Lists all 3D jobs created by the current user. (JWT authenticated).

### 3.3 Backend Components (Package `com.mpc.model3d`)
* `domain/Model3DJob.java`: JPA Entity.
* `repository/Model3DJobRepository.java`: Spring Data JPA Repository.
* `service/Model3DService.java`: Orchestrates job creation, caching, polling, and local GLB persistence.
* `service/MeshyClient.java`: Spring `RestClient` / `RestTemplate` wrapper handling authentication, polling with `Retry-After`, exponential backoff, and error mapping.
* `service/image/RooftopImageProvider.java`: Interface for image acquisition.
* `service/image/GoogleStaticMapsProvider.java`: Captures bounded satellite photo with padding and scale=2.
* `service/image/UploadedImageProvider.java`: Handles user-uploaded drone photos.
* `service/image/MercatorMaskingService.java`: Web-Mercator math calculating pixel bounding boxes and masking background outside polygon to neutral gray/white.
* `service/storage/GlbStorageService.java`: Persists GLB models locally on disk.
* `web/Model3DController.java`: REST Controller with JWT validation.
* `web/dto/Model3DJobRequestDTO.java`, `Model3DJobResponseDTO.java`.

### 3.4 Frontend Components
* `src/pages/Model3DView.jsx`: Main interactive page with 3D map selector, 2D fallback, live Turf.js metrics, and integrated 3D viewer.
* `src/components/scene3d/Model3DCanvas.jsx`: Three.js Canvas with OrbitControls, multi-layer toggles (AI mesh, measured roof boundary, measured solar panels), and transform alignment controls.
* `src/services/model3dService.js`: Frontend API client for `/api/model3d/jobs`.
* `public/models/mock-building.glb`: Bundled placeholder building mesh for zero-credit testing.

---

## 4. Environment Variables & Secret Auditing

### 4.1 Required Environment Variables
* `MESHY_API_KEY`: Meshy API key (backend only).
* `GOOGLE_MAPS_SERVER_KEY`: Server-side API key for Google Static Maps and Solar API (backend only).
* `VITE_GOOGLE_MAPS_BROWSER_KEY`: Client-side referrer-restricted Google Maps API key (frontend only).
* `MESHY_MOCK_ENABLED`: `true` (default in dev/test) to use zero credits; `false` in production.
* `ROOFTOP_IMAGERY_GOOGLE_STATIC_ENABLED`: `false` (default) to respect Google ToS.

### 4.2 Tracked File Audit
* Running `git ls-files` revealed that `.env` was previously committed into the git index in an earlier commit on the parent branch.
* As required by the prompt, this is reported directly in this plan and the final report. The file history is not rewritten, and new configurations read environment variables safely with no secrets in the repository code.

---

## 5. Identified Risks & Mitigations

1. **Photorealistic 3D Tile Availability:**
   * *Risk:* Certain Indian cities or rural sites may lack 3D tiles, or WebGL context may crash.
   * *Mitigation:* Error boundary and automatic fallback to 2D Google Satellite map with vertex editing.
2. **Google Maps Imagery Licensing (ToS):**
   * *Risk:* Submitting Google satellite tiles to Meshy for AI mesh generation violates Google Maps Platform Terms of Service without explicit enterprise licensing.
   * *Mitigation:* Static Google capture is gated by `rooftop.imagery.google-static.enabled=false`. Users can upload their own aerial/drone photos via `UploadedImageProvider`.
3. **Non-Metric Meshy AI Meshes:**
   * *Risk:* Meshy generates illustrative meshes with arbitrary rotation and scale, which cannot be used for solar engineering calculations.
   * *Mitigation:* Panel placement and counts come exclusively from real-world measured polygon math in `OptimizationEngine`. The 3D viewer displays an explicit disclaimer and provides fine-tuning alignment controls (rotation, scale, elevation).
4. **Meshy Credit Depletion & Asset Expiration:**
   * *Risk:* Paid credits could be depleted by runaway jobs; Meshy deletes generated assets after 3 days.
   * *Mitigation:* SHA-256 polygon hash caching eliminates duplicate Meshy tasks. The backend immediately downloads and persists GLBs locally upon generation completion. Daily user and global job limits prevent credit exhaustion.
