import { useEffect, useRef } from 'react';

/**
 * Custom hook to mount a projected Canvas Overlay on top of Google Maps.
 * Useful for rendering Solar API Flux heatmaps and GeoTIFF data layers directly
 * on rooftop structures.
 *
 * @param {google.maps.Map | null} map
 * @param {{ south: number, north: number, west: number, east: number } | null} bounds
 * @param {boolean} [isVisible=false]
 * @param {Function} [renderCanvasCallback] Optional custom draw callback
 */
export const useSolarFluxOverlay = (map, bounds, isVisible = false, renderCanvasCallback = null) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google?.maps?.OverlayView || !bounds || !isVisible) {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
      return;
    }

    class SolarFluxOverlayView extends window.google.maps.OverlayView {
      constructor(mapInstance, boundsObj) {
        super();
        this.bounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(boundsObj.south, boundsObj.west),
          new window.google.maps.LatLng(boundsObj.north, boundsObj.east)
        );
        this.containerDiv = null;
        this.canvas = null;
        this.setMap(mapInstance);
      }

      onAdd() {
        this.containerDiv = document.createElement('div');
        this.containerDiv.style.position = 'absolute';
        this.containerDiv.style.pointerEvents = 'none';
        this.containerDiv.style.zIndex = '150';

        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.containerDiv.appendChild(this.canvas);

        const panes = this.getPanes();
        panes.overlayLayer.appendChild(this.containerDiv);
      }

      draw() {
        const projection = this.getProjection();
        if (!projection || !this.containerDiv || !this.canvas) return;

        const sw = projection.fromLatLngToDivPixel(this.bounds.getSouthWest());
        const ne = projection.fromLatLngToDivPixel(this.bounds.getNorthEast());

        if (!sw || !ne) return;

        const width = Math.max(1, Math.round(ne.x - sw.x));
        const height = Math.max(1, Math.round(sw.y - ne.y));

        this.containerDiv.style.left = `${sw.x}px`;
        this.containerDiv.style.top = `${ne.y}px`;
        this.containerDiv.style.width = `${width}px`;
        this.containerDiv.style.height = `${height}px`;

        this.canvas.width = width;
        this.canvas.height = height;

        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;

        if (typeof renderCanvasCallback === 'function') {
          renderCanvasCallback(ctx, width, height);
        } else {
          // Default Solar Flux Irradiance heat gradient simulation
          ctx.clearRect(0, 0, width, height);
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.45)');   // High Irradiance (1300+ kWh/m²)
          gradient.addColorStop(0.4, 'rgba(245, 158, 11, 0.40)'); // Moderate Irradiance (~1050 kWh/m²)
          gradient.addColorStop(0.75, 'rgba(16, 185, 129, 0.35)'); // Lower Irradiance (~850 kWh/m²)
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.25)');   // Shaded Area (<600 kWh/m²)

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);

          // Subtle solar grid overlay
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          const gridSize = 24;
          for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
          for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }
        }
      }

      onRemove() {
        if (this.containerDiv?.parentNode) {
          this.containerDiv.parentNode.removeChild(this.containerDiv);
          this.containerDiv = null;
          this.canvas = null;
        }
      }
    }

    overlayRef.current = new SolarFluxOverlayView(map, bounds);

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, bounds, isVisible, renderCanvasCallback]);
};
