import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

const getPolygonCoordinates = (layer) => {
  const latLngs = layer.getLatLngs()[0] || [];
  return latLngs.map((point) => [point.lat, point.lng]);
};

const RooftopDrawer = ({ polygonCoordinates, onPolygonChange, isDrawingEnabled }) => {
  const map = useMap();

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        marker: false,
        circle: false,
        circlemarker: false,
        polyline: false,
        rectangle: false,
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.32,
            weight: 3,
          },
        },
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    map.addControl(drawControl);

    const handleCreated = (event) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);
      onPolygonChange(getPolygonCoordinates(event.layer));
    };

    const handleEdited = (event) => {
      event.layers.eachLayer((layer) => {
        onPolygonChange(getPolygonCoordinates(layer));
      });
    };

    const handleDeleted = () => {
      onPolygonChange([]);
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onPolygonChange]);

  useEffect(() => {
    const drawButton = document.querySelector('.leaflet-draw-draw-polygon');
    if (isDrawingEnabled && drawButton) {
      drawButton.click();
    }
  }, [isDrawingEnabled]);

  useEffect(() => {
    if (polygonCoordinates.length >= 3) {
      const bounds = L.latLngBounds(polygonCoordinates);
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 20 });
    }
  }, [map, polygonCoordinates]);

  return null;
};

export default RooftopDrawer;
