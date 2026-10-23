import React, { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RooftopDrawer from './RooftopDrawer';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

const MapViewUpdater = ({ center, bounds, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds?.length === 4) {
      const [south, north, west, east] = bounds;
      map.fitBounds(
        [
          [south, west],
          [north, east],
        ],
        { padding: [32, 32], maxZoom: zoom }
      );
    } else if (center) {
      const c = Array.isArray(center) ? center : [center.lat, center.lng];
      map.flyTo(c, zoom, { duration: 0.8 });
    }
  }, [bounds, center, map, zoom]);

  return null;
};

export const LeafletSatelliteFallback = ({
  center,
  bounds,
  markerPosition,
  markerLabel,
  polygonCoordinates,
  onPolygonChange,
  isDrawingEnabled,
}) => {
  const normalizedCenter = Array.isArray(center) ? center : [center.lat, center.lng];
  const normalizedMarker = markerPosition
    ? Array.isArray(markerPosition)
      ? markerPosition
      : [markerPosition.lat, markerPosition.lng]
    : null;

  return (
    <MapContainer
      center={normalizedCenter}
      zoom={18}
      className="h-full w-full z-0"
      zoomControl
    >
      <MapViewUpdater center={normalizedCenter} bounds={bounds} zoom={18} />
      {/* High-Resolution Satellite World Imagery */}
      <TileLayer
        attribution="Tiles &copy; Esri, Earthstar Geographics, OpenStreetMap"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={20}
      />
      {/* Subtle Vector Street & Boundary Overlay */}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        opacity={0.3}
        maxZoom={20}
      />

      {normalizedMarker && (
        <Marker position={normalizedMarker}>
          <Popup>{markerLabel || 'Selected rooftop site'}</Popup>
        </Marker>
      )}

      <RooftopDrawer
        polygonCoordinates={polygonCoordinates}
        onPolygonChange={onPolygonChange}
        isDrawingEnabled={isDrawingEnabled}
      />
    </MapContainer>
  );
};

export default LeafletSatelliteFallback;
