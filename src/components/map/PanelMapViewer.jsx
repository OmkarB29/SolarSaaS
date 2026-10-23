import React, { useEffect, useMemo } from 'react';
import { MapContainer, Polygon, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapBoundsAdjuster = ({ polygonCoordinates, panels }) => {
  const map = useMap();

  useEffect(() => {
    if (polygonCoordinates && polygonCoordinates.length >= 3) {
      const bounds = L.latLngBounds(polygonCoordinates);
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 20 });
    }
  }, [map, polygonCoordinates, panels]);

  return null;
};

const PanelMapViewer = ({
  center = [18.5204, 73.8567],
  polygonCoordinates = [],
  panels = [],
  activeMode = 'BALANCED',
  panelDimensions = { lengthMeters: 2.1, widthMeters: 1.1, powerWatts: 550 },
}) => {
  const roofCentroid = useMemo(() => {
    if (!polygonCoordinates || polygonCoordinates.length === 0) return center;
    let sumLat = 0;
    let sumLng = 0;
    polygonCoordinates.forEach(([lat, lng]) => {
      sumLat += lat;
      sumLng += lng;
    });
    return [sumLat / polygonCoordinates.length, sumLng / polygonCoordinates.length];
  }, [polygonCoordinates, center]);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-slate-200">
      <MapContainer
        center={roofCentroid}
        zoom={19}
        className="h-full w-full z-0"
        zoomControl
        maxZoom={21}
      >
        <MapBoundsAdjuster polygonCoordinates={polygonCoordinates} panels={panels} />

        {/* High-Resolution Satellite Basemap */}
        <TileLayer
          attribution="Tiles &copy; Esri, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={21}
        />
        {/* Subtle Street / Label Overlay */}
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.22}
          maxZoom={21}
        />

        {/* Green Roof Boundary Polygon with subtle orange walkway fill */}
        {polygonCoordinates && polygonCoordinates.length >= 3 && (
          <Polygon
            positions={polygonCoordinates}
            pathOptions={{
              color: '#10b981', // Green boundary
              weight: 3,
              fillColor: '#f97316', // Orange unused/walkway background
              fillOpacity: 0.18,
              dashArray: '4, 6',
            }}
          >
            <Tooltip sticky>
              <div className="text-2xs font-sans p-1">
                <p className="font-bold text-slate-900">Rooftop Boundary</p>
                <p className="text-slate-600">Active Solar Scope Polygon</p>
              </div>
            </Tooltip>
          </Polygon>
        )}

        {/* Blue Solar Panels directly on polygon */}
        {panels.map((p, idx) => {
          if (!p.polygon || p.polygon.length < 4) return null;
          return (
            <Polygon
              key={p.panelNumber || idx}
              positions={p.polygon}
              pathOptions={{
                color: '#1e3a8a', // Deep navy border
                weight: 1.2,
                fillColor: '#2563eb', // Vibrant solar blue
                fillOpacity: 0.88,
              }}
            >
              <Tooltip direction="top" opacity={0.96} sticky>
                <div className="text-2xs font-sans p-1.5 space-y-0.5 min-w-36">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                    <span className="font-bold text-blue-700">Panel #{p.panelNumber || idx + 1}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-3xs font-bold">
                      {p.orientation || 'PORTRAIT'}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    <strong className="text-slate-700">Power:</strong> {p.powerWatts || panelDimensions.powerWatts} W
                  </p>
                  <p className="text-slate-600">
                    <strong className="text-slate-700">Dimensions:</strong> {p.lengthMeters ? p.lengthMeters.toFixed(2) : panelDimensions.lengthMeters}m × {p.widthMeters ? p.widthMeters.toFixed(2) : panelDimensions.widthMeters}m
                  </p>
                  <p className="text-slate-600">
                    <strong className="text-slate-700">Surface:</strong> {p.areaM2 ? p.areaM2.toFixed(2) : (panelDimensions.lengthMeters * panelDimensions.widthMeters).toFixed(2)} m²
                  </p>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}
      </MapContainer>

      {/* Floating Interactive Map Legend */}
      <div className="absolute bottom-4 left-4 z-400 bg-white/95 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-lg text-2xs font-medium text-slate-700 space-y-1.5">
        <p className="text-3xs uppercase font-bold text-slate-400 tracking-wider">Map Overlay Legend</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-xs border-2 border-emerald-500 bg-emerald-500/20"></span>
          <span>Green: Rooftop Boundary</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-xs border border-blue-900 bg-blue-600"></span>
          <span>Blue: Solar Panels ({panels.length} placed)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-xs border border-orange-400 bg-orange-400/30"></span>
          <span>Orange: Unused Area & Aisles</span>
        </div>
      </div>

      {/* Top Banner on Map */}
      <div className="absolute top-4 left-4 z-400 bg-slate-900/90 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-slate-700 shadow-md text-2xs font-semibold text-white flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Leaflet Vector Alignment • {activeMode.replace('_', ' ')}</span>
      </div>
    </div>
  );
};

export default PanelMapViewer;
