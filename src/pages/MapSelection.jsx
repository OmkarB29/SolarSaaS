import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Navigation, Compass, Layers } from 'lucide-react';

// Fix Leaflet's default icon path issues
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapSelection = () => {
  const navigate = useNavigate();
  const [area, setArea] = useState(1450); // mock area
  const [isDrawing, setIsDrawing] = useState(false);

  // Center on Austin, TX
  const position = [30.2672, -97.7431];
  
  // Mock polygon for an industrial rooftop
  const rooftopPolygon = [
    [30.2672, -97.7431],
    [30.2675, -97.7431],
    [30.2675, -97.7425],
    [30.2672, -97.7425],
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Map Selection</h1>
          <p className="text-slate-500 mt-1">Search an address or draw a polygon on the map</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Sidebar Controls */}
        <div className="col-span-1 flex flex-col space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Location Search</h3>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Enter address or coordinates..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                defaultValue="100 Logistics Way, Austin, TX"
              />
            </div>
            
            <div className="flex space-x-2">
              <button className="flex-1 flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-medium transition-colors">
                <Navigation size={18} />
                <span>My Location</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Measurement Tools</h3>
            
            <button 
              onClick={() => setIsDrawing(!isDrawing)}
              className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-medium transition-all ${
                isDrawing 
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Compass size={18} />
              <span>{isDrawing ? 'Finish Drawing' : 'Draw Rooftop Polygon'}</span>
            </button>

            <div className="bg-primary-50 rounded-xl p-5 border border-primary-100">
              <div className="text-primary-600 text-sm font-medium mb-1">Calculated Area</div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-bold text-primary-700">{area}</span>
                <span className="text-primary-600 font-medium">m²</span>
              </div>
              <p className="text-xs text-primary-500 mt-2">Suitable for approx. {Math.floor(area / 2.5)} commercial panels.</p>
            </div>
          </div>

          <div className="flex-1" />

          <button 
            onClick={() => navigate('/analysis')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center space-x-2 group"
          >
            <span>Run Analysis</span>
            <Layers size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Map Container */}
        <div className="col-span-1 lg:col-span-3 h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-200 relative">
          <MapContainer 
            center={position} 
            zoom={18} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            <Marker position={position}>
              <Popup>
                Selected Building.<br /> {area}m² available.
              </Popup>
            </Marker>
            
            <Polygon 
              positions={rooftopPolygon} 
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.4,
                weight: 3
              }} 
            />
          </MapContainer>
          
          <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg shadow border border-slate-200 text-sm font-medium text-slate-700 flex items-center space-x-2">
            <MapPin size={16} className="text-primary-500" />
            <span>Austin Logistics Hub</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MapSelection;
