# Cloud Optimised DashCam (React SPA)

Quality-gated, illumination-aware, coverage-chunked dashcam video frame extraction and footage review overlay application, ported to React with TypeScript and Tailwind CSS.

## Features

- **5-Screen Flow & Interactive Control Panel**:
  - **Dashboard / Welcome**: Overview of system architecture, quick demo launcher, and workflow navigation.
  - **Pipeline Config**: Configure video and output directory paths, GPX telemetry source, carrier network (Vodafone, EE, O2, Three), sampling mode, and individual quality gates.
  - **Processing Monitor**: Real-time progress bar, active video status, pipeline trace stream, and frame analysis logs.
  - **Completion Summary**: Detailed manifest results table (sampled, kept, blur rejections, exposure rejections, duplicate rejections, Weiss reflectance), cellular savings metrics, and coverage chunk slice indicators.
  - **Footage Review with Overlay**: Synchronized video player with real-time canvas chart overlay displaying captured bytes, upstreamed bytes, coverage window highlights, and chunk creation markers.
- **Extracted Frames Gallery**:
  - Modal inspection of genuine extracted dashcam frames with Laplacian blur score, pixel mean intensity, NOAA solar elevation angle, and log gain.
- **Carrier Coverage & Route Telemetry**:
  - Interactive map view plotting vehicle GPX track with Liang-Barsky entry/exit crossing points and carrier bounding boxes (Vodafone, EE, O2, Three).
- **Google Cloud Vertex AI Launcher**:
  - Dispatch batch frame extraction jobs to Vertex AI custom training with configurable compute machine types, container images, and GCS staging buckets.

## Architecture

1. **Quality Gating**: Laplacian variance for blur detection, mean pixel intensity limits for exposure bounds, and log-domain cross-correlation for duplicate detection under auto-gain.
2. **NOAA Solar & Sky Illumination**: Adapts expected scene luminance from timestamp, GPS coordinates, and cloud cover.
3. **Weiss (2001) Intrinsic Reflectance**: Temporal median of log-gradients with Fourier pseudo-inverse Poisson reconstruction for stationary segments.
4. **Coverage Chunking**: Sweep-line rectangle overlap coupled with Liang-Barsky line clipping to subdivide kept frames into upload-ready slices based on carrier cellular reception.

## Development

```bash
npm install
npm run dev
```

The application runs on port 3000 at `http://0.0.0.0:3000`.
