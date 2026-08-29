import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Compass, Layers, MapPin } from 'lucide-react';
import { Card } from '../components/ui/Card';
import AnalysisResults from '../components/map/AnalysisResults';
import InteractiveMap from '../components/map/InteractiveMap';
import SearchLocation from '../components/map/SearchLocation';
import { analysisApiService } from '../services/analysisApiService';
import { geocodingService } from '../services/geocodingService';
import { calculateRooftopArea, estimateSolarAnalysis } from '../services/solarAnalysisService';

const DEFAULT_POSITION = [12.9716, 77.5946];

const MapSelection = () => {
  const hasUserSelectedLocation = useRef(false);
  const [query, setQuery] = useState('Bengaluru');
  const [center, setCenter] = useState(DEFAULT_POSITION);
  const [locationBounds, setLocationBounds] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(DEFAULT_POSITION);
  const [markerLabel, setMarkerLabel] = useState('Bengaluru, Karnataka');
  const [polygonCoordinates, setPolygonCoordinates] = useState([]);
  const [area, setArea] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  const [error, setError] = useState('');

  const resetRooftopSelection = useCallback(() => {
    setPolygonCoordinates([]);
    setArea(0);
    setAnalysisResults(null);
    setIsDrawing(false);
  }, []);

  const updateLocation = useCallback((position, label, bounds = null, shouldResetRooftop = false) => {
    setCenter(position);
    setLocationBounds(bounds);
    setMarkerPosition(position);
    setMarkerLabel(label);
    if (shouldResetRooftop) {
      resetRooftopSelection();
    }
    setError('');
  }, [resetRooftopSelection]);

  const requestCurrentLocation = useCallback(
    ({ silent = false } = {}) => {
      if (!navigator.geolocation) {
        if (!silent) setError('Geolocation is not supported by this browser.');
        return;
      }

      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (silent && hasUserSelectedLocation.current) {
            setIsLocating(false);
            return;
          }

          const currentPosition = [position.coords.latitude, position.coords.longitude];
          updateLocation(currentPosition, 'Your current location', null, true);
          setQuery('Current location');
          setIsLocating(false);
        },
        (geoError) => {
          if (!silent) {
            const denied = geoError.code === geoError.PERMISSION_DENIED;
            setError(denied ? 'Location permission was denied.' : 'Could not fetch your current location.');
          }
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
      );
    },
    [updateLocation]
  );

  useEffect(() => {
    requestCurrentLocation({ silent: true });
  }, [requestCurrentLocation]);

  const handleSearch = async (event) => {
    event.preventDefault();
    setIsSearching(true);
    setError('');

    try {
      const result = await geocodingService.searchLocation(query);
      hasUserSelectedLocation.current = true;
      updateLocation(result.position, result.label, result.bounds, true);
    } catch (searchError) {
      setError(searchError.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePolygonChange = useCallback((coordinates) => {
    setPolygonCoordinates(coordinates);
    setArea(calculateRooftopArea(coordinates));
    setAnalysisResults(null);
    setIsDrawing(false);
  }, []);

  const handleRunAnalysis = async () => {
    if (!area) {
      setError('Draw a rooftop polygon before running analysis.');
      return;
    }

    setError('');
    setIsSavingAnalysis(true);
    const results = estimateSolarAnalysis(area);
    const latestAnalysis = {
      ...results,
      location: markerLabel,
      roofArea: area,
      usableArea: results.panels * 2.5,
      systemSize: Number((results.panels * 0.4).toFixed(1)),
      generatedAt: new Date().toISOString(),
    };

    setAnalysisResults(results);
    localStorage.setItem('latestAnalysis', JSON.stringify(latestAnalysis));

    try {
      const savedAnalysis = await analysisApiService.saveAnalysis({
        locationName: markerLabel,
        latitude: markerPosition[0],
        longitude: markerPosition[1],
        roofArea: area,
        estimatedPanels: results.panels,
        monthlyGeneration: results.monthlyGeneration,
        installationCost: results.installationCost,
        roi: results.roi,
        co2Reduction: results.co2Reduction,
        usableArea: latestAnalysis.usableArea,
        systemSize: latestAnalysis.systemSize,
        yearlyGeneration: results.yearlyGeneration,
        yearlySavings: results.yearlySavings,
        paybackPeriod: results.paybackPeriod,
      });
      localStorage.setItem('latestAnalysis', JSON.stringify({ ...latestAnalysis, id: savedAnalysis.id }));
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSavingAnalysis(false);
    }
  };

  const estimatedPanels = Math.floor(area / 2.5);

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Map Selection</h1>
          <p className="text-slate-500 mt-1">Search an address or draw a polygon on the map</p>
        </div>
      </div>

      <Card className="grid flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-4">
        <div className="col-span-1 flex flex-col space-y-6">
          <SearchLocation
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onUseMyLocation={() => requestCurrentLocation()}
            isSearching={isSearching}
            isLocating={isLocating}
            error={error}
          />

          <div className="h-px w-full bg-slate-100" />

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Measurement Tools</h3>

            <button
              type="button"
              onClick={() => setIsDrawing(true)}
              className={`flex w-full items-center justify-center space-x-2 rounded-xl py-3 font-medium transition-all ${
                isDrawing
                  ? 'border border-blue-200 bg-blue-50 text-blue-600 shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Compass size={18} />
              <span>{isDrawing ? 'Click map to draw polygon' : 'Draw Rooftop Polygon'}</span>
            </button>

            <div className="rounded-xl border border-primary-100 bg-primary-50 p-5">
              <div className="mb-1 text-sm font-medium text-primary-600">Calculated Area</div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-bold text-primary-700">{area.toLocaleString('en-IN')}</span>
                <span className="font-medium text-primary-600">m²</span>
              </div>
              <p className="mt-2 text-xs text-primary-500">
                Suitable for approx. {estimatedPanels.toLocaleString('en-IN')} commercial panels.
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={isSavingAnalysis}
            className="group flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-900 py-4 font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span>{isSavingAnalysis ? 'Saving Analysis...' : 'Run Analysis'}</span>
            <Layers size={20} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="relative col-span-1 h-full min-h-[560px] overflow-hidden rounded-xl border border-slate-200 lg:col-span-3">
          <InteractiveMap
            center={center}
            bounds={locationBounds}
            markerPosition={markerPosition}
            markerLabel={markerLabel}
            polygonCoordinates={polygonCoordinates}
            onPolygonChange={handlePolygonChange}
            isDrawingEnabled={isDrawing}
          />

          <div className="absolute left-4 top-4 z-[400] flex max-w-[calc(100%-2rem)] items-center space-x-2 rounded-lg border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow backdrop-blur-md">
            <MapPin size={16} className="shrink-0 text-primary-500" />
            <span className="truncate">{markerLabel}</span>
          </div>
        </div>
      </Card>

      <AnalysisResults results={analysisResults} />
    </div>
  );
};

export default MapSelection;
