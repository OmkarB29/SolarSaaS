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
      map.flyTo(center, zoom, { duration: 0.8 });
    }
  }, [bounds, center, map, zoom]);

  return null;
};

const InteractiveMap = ({
  center,
  bounds,
  markerPosition,
  markerLabel,
  polygonCoordinates,
  onPolygonChange,
  isDrawingEnabled,
}) => {
  return (
    <MapContainer center={center} zoom={18} className="h-full w-full" zoomControl>
      <MapViewUpdater center={center} bounds={bounds} zoom={18} />
      <TileLayer
        attribution='Tiles &copy; Esri, OpenStreetMap contributors'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={20}
      />
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        opacity={0.28}
        maxZoom={20}
      />

      {markerPosition && (
        <Marker position={markerPosition}>
          <Popup>{markerLabel || 'Selected location'}</Popup>
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

export default InteractiveMap;
