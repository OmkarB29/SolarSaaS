import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  CheckCircle2, 
  Compass, 
  Layers, 
  MapPin, 
  Sun, 
  ArrowRight, 
  Trash2, 
  Zap,
  Sliders,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import AnalysisResults from '../components/map/AnalysisResults';
import GoogleSolarMap from '../components/map/GoogleSolarMap';
import SearchLocation from '../components/map/SearchLocation';
import { analysisApiService } from '../services/analysisApiService';
import { reportApiService } from '../services/reportApiService';
import { geocodingService } from '../services/geocodingService';
import { weatherApiService } from '../services/weatherApiService';
import { googleSolarService } from '../services/googleSolarService';
import { applyWeatherAdjustment, calculateRooftopArea, estimateSolarAnalysis } from '../services/solarAnalysisService';

const DEFAULT_POSITION = [12.9716, 77.5946];

const MapSelection = () => {
  const navigate = useNavigate();
  const hasUserSelectedLocation = useRef(false);
  const weatherDebounceRef = useRef(null);
  const solarDebounceRef = useRef(null);

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
  const [weatherData, setWeatherData] = useState(null);
  const [googleSolarData, setGoogleSolarData] = useState(null);
  const [isLoadingSolarData, setIsLoadingSolarData] = useState(false);
  const [showSolarPanels, setShowSolarPanels] = useState(true);
  const [panelCountSlider, setPanelCountSlider] = useState(50);
  const [error, setError] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(null);

  const resetRooftopSelection = useCallback(() => {
    setPolygonCoordinates([]);
    setArea(0);
    setAnalysisResults(null);
    setSaveFeedback(null);
    setIsDrawing(false);
    localStorage.removeItem('solarscope.rooftop');
    window.dispatchEvent(new Event('storage'));
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

  // Fetch weather when marker position updates
  useEffect(() => {
    window.clearTimeout(weatherDebounceRef.current);

    weatherDebounceRef.current = window.setTimeout(async () => {
      try {
        const weather = await weatherApiService.getWeather(markerPosition[0], markerPosition[1]);
        setWeatherData(weather);
      } catch {
        setWeatherData(null);
      }
    }, 600);

    return () => window.clearTimeout(weatherDebounceRef.current);
  }, [markerPosition]);

  // Fetch Google Solar API Building Insights for selected rooftop coordinates
  useEffect(() => {
    window.clearTimeout(solarDebounceRef.current);
    setGoogleSolarData(null);

    if (!markerPosition || markerPosition.length < 2) return;

    solarDebounceRef.current = window.setTimeout(async () => {
      setIsLoadingSolarData(true);
      try {
        const insights = await googleSolarService.getBuildingInsights(markerPosition[0], markerPosition[1]);
        if (insights) {
          setGoogleSolarData(insights);
          if (insights.maxArrayPanelsCount) {
            setPanelCountSlider(Math.min(50, insights.maxArrayPanelsCount));
          }
        }
      } catch (solarErr) {
        console.warn('[MapSelection] Google Solar API check:', solarErr);
      } finally {
        setIsLoadingSolarData(false);
      }
    }, 700);

    return () => window.clearTimeout(solarDebounceRef.current);
  }, [markerPosition]);

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

  /**
   * Synchronizes the selected rooftop and calculated analysis to ALL tabs in the sidebar:
   * 1. Dashboard (/dashboard)
   * 2. Analysis (/analysis)
   * 3. Solar Potential (/solar-potential)
   * 4. AI Panel Optimizer (/panel-optimizer)
   * 5. History / Proposals / Reports
   */
  const syncToAllTabs = useCallback(async (selectedArea, coordinates, solarInsights) => {
    if (!selectedArea || selectedArea <= 0) return;

    const baseResults = estimateSolarAnalysis(selectedArea);
    let weather = weatherData;
    let results = baseResults;

    if (weather) {
      results = applyWeatherAdjustment(baseResults, weather);
    }

    const latestAnalysis = {
      ...results,
      location: markerLabel,
      locationName: markerLabel,
      address: markerLabel,
      latitude: markerPosition[0],
      longitude: markerPosition[1],
      roofArea: selectedArea,
      area: selectedArea,
      usableArea: results.panels * 2.5,
      systemSize: Number((results.panels * 0.4).toFixed(1)),
      generatedAt: new Date().toISOString(),
      googleSolarData: solarInsights ? {
        maxPanels: solarInsights.maxArrayPanelsCount,
        sunshineHours: solarInsights.maxSunshineHoursPerYear,
        carbonOffset: solarInsights.carbonOffsetFactorKgPerMwh,
        arrayArea: solarInsights.maxArrayAreaMeters2,
        panelWattage: solarInsights.panelCapacityWatts,
        quality: solarInsights.quality,
      } : null,
    };

    const rooftopData = {
      latitude: markerPosition[0],
      longitude: markerPosition[1],
      address: markerLabel,
      location: markerLabel,
      locationName: markerLabel,
      polygonCoordinates: coordinates,
      roofArea: selectedArea,
      area: selectedArea,
      googleSolarData: latestAnalysis.googleSolarData,
    };

    // Store in localStorage for instant access across tabs
    localStorage.setItem('solarscope.rooftop', JSON.stringify(rooftopData));
    localStorage.setItem('latestAnalysis', JSON.stringify(latestAnalysis));
    setAnalysisResults(results);

    // Dispatch global events so any active page re-renders in real-time
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('solarscope:analysis-updated', { detail: latestAnalysis }));

    // Persist to backend database for History & Reports tabs
    try {
      const savedAnalysis = await analysisApiService.saveAnalysis({
        locationName: markerLabel,
        latitude: markerPosition[0],
        longitude: markerPosition[1],
        roofArea: selectedArea,
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
      setSaveFeedback({ type: 'success', message: 'Rooftop selected & synced to Dashboard, Analysis, Solar Potential, and Optimizer!' });
    } catch (saveError) {
      setSaveFeedback({ 
        type: 'success', 
        message: 'Rooftop selected & synced locally across all sidebar tabs!' 
      });
    }
  }, [markerPosition, markerLabel, weatherData]);

  // 1-Click Auto-Detect Rooftop Boundary from Google Solar API (matching Google Solar Demo)
  const handleAutoSelectRooftop = useCallback(() => {
    if (!googleSolarData?.boundingBox) return;
    const { sw, ne } = googleSolarData.boundingBox;

    // Convert building bounding box to clockwise polygon
    const boundingPolygon = [
      [ne.latitude, sw.longitude], // North-West
      [ne.latitude, ne.longitude], // North-East
      [sw.latitude, ne.longitude], // South-East
      [sw.latitude, sw.longitude], // South-West
    ];

    const detectedArea = googleSolarData.maxArrayAreaMeters2 
      ? Math.round(googleSolarData.maxArrayAreaMeters2)
      : calculateRooftopArea(boundingPolygon);

    setPolygonCoordinates(boundingPolygon);
    setArea(detectedArea);
    setIsDrawing(false);

    // Immediate sync across all tabs
    syncToAllTabs(detectedArea, boundingPolygon, googleSolarData);
  }, [googleSolarData, syncToAllTabs]);

  // Manual point-and-click polygon completion
  const handlePolygonChange = useCallback((coordinates) => {
    setPolygonCoordinates(coordinates);
    const calculatedArea = calculateRooftopArea(coordinates);
    setArea(calculatedArea);
    setIsDrawing(false);

    // Immediate sync across all tabs
    syncToAllTabs(calculatedArea, coordinates, googleSolarData);
  }, [googleSolarData, syncToAllTabs]);

  // Click on map to drop pin or re-target installation site
  const handleMapClick = useCallback(({ lat, lng }) => {
    if (isDrawing) return;
    const formattedPos = [lat, lng];
    const pinLabel = `Site (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    updateLocation(formattedPos, pinLabel, null, false);
  }, [isDrawing, updateLocation]);

  const handleRunAnalysis = async () => {
    const effectiveArea = area || (googleSolarData?.maxArrayAreaMeters2 ? Math.round(googleSolarData.maxArrayAreaMeters2) : 0);

    if (!effectiveArea) {
      setError('Please select a rooftop area using "Auto-Select Detected Rooftop" or "Draw Custom Rooftop Outline".');
      return;
    }

    setError('');
    setIsSavingAnalysis(true);
    await syncToAllTabs(effectiveArea, polygonCoordinates, googleSolarData);
    setIsSavingAnalysis(false);
  };

  const estimatedPanels = Math.floor(area / 2.5);

  // Compute flux bounding box from Google Solar API if available
  const googleFluxBounds = React.useMemo(() => {
    if (googleSolarData?.boundingBox) {
      return {
        south: googleSolarData.boundingBox.sw.latitude,
        north: googleSolarData.boundingBox.ne.latitude,
        west: googleSolarData.boundingBox.sw.longitude,
        east: googleSolarData.boundingBox.ne.longitude,
      };
    }
    return null;
  }, [googleSolarData]);

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Map Selection & Rooftop Analysis</h1>
          <p className="text-slate-500 mt-1">Select a building rooftop on Google Satellite engine. Synced directly to all sidebar modules.</p>
        </div>
      </div>

      <Card className="grid flex-1 grid-cols-1 gap-6 p-6 xl:grid-cols-4">
        <div className="col-span-1 flex flex-col space-y-5">
          <SearchLocation
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onUseMyLocation={() => requestCurrentLocation()}
            isSearching={isSearching}
            isLocating={isLocating}
            error={error}
          />

          {/* Google Solar API Live Insights Card */}
          {isLoadingSolarData && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs">
              <Zap size={15} className="text-amber-500 animate-bounce" />
              <span>Analyzing Google Solar photogrammetry...</span>
            </div>
          )}

          {googleSolarData && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 space-y-3 text-xs shadow-sm">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Sun size={16} className="text-amber-600" />
                  Google Solar Building Insights
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {googleSolarData.quality} QUALITY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/70">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Max Panels</span>
                  <span className="font-extrabold text-base text-slate-900">{googleSolarData.maxArrayPanelsCount}</span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/70">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Sunshine/Yr</span>
                  <span className="font-extrabold text-base text-slate-900">{Math.round(googleSolarData.maxSunshineHoursPerYear)}h</span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/70">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Rooftop Area</span>
                  <span className="font-extrabold text-base text-slate-900">{Math.round(googleSolarData.maxArrayAreaMeters2)} m²</span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/70">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Panel Wattage</span>
                  <span className="font-extrabold text-base text-slate-900">{googleSolarData.panelCapacityWatts} W</span>
                </div>
              </div>

              {/* 1-Click Auto-Select Rooftop Button */}
              <button
                type="button"
                onClick={handleAutoSelectRooftop}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-300" />
                <span>Auto-Select Rooftop ({Math.round(googleSolarData.maxArrayAreaMeters2)} m²)</span>
              </button>

              {/* Solar Panels on Roof Toggle (Google Solar Demo feature) */}
              {googleSolarData.solarPanels && googleSolarData.solarPanels.length > 0 && (
                <div className="pt-2 border-t border-amber-200/60 space-y-2">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-medium text-[11px]">Show Panels on Roof</span>
                    <input
                      type="checkbox"
                      checked={showSolarPanels}
                      onChange={(e) => setShowSolarPanels(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                  </div>

                  {showSolarPanels && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-700">
                        <span className="font-medium">Active Modules:</span>
                        <span className="font-extrabold text-blue-700">{panelCountSlider} / {googleSolarData.maxArrayPanelsCount}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max={googleSolarData.maxArrayPanelsCount}
                        value={panelCountSlider}
                        onChange={(e) => setPanelCountSlider(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex items-center justify-between text-[10px] bg-blue-50/80 p-2 rounded-lg border border-blue-200/60 text-slate-700 font-medium">
                        <span>Solar Yield: <strong className="text-blue-900 font-extrabold">{Math.round(panelCountSlider * 705).toLocaleString('en-IN')} kWh/yr</strong></span>
                        <span className="text-emerald-700 font-bold bg-emerald-100/80 px-1.5 py-0.5 rounded">Max Throughput</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="h-px w-full bg-slate-100" />

          {/* Rooftop Measurement & Selection Tools */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Rooftop Boundary</h3>
              {polygonCoordinates.length > 0 && (
                <button
                  type="button"
                  onClick={resetRooftopSelection}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear Selection</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDrawing((prev) => !prev)}
              className={`flex w-full items-center justify-center space-x-2 rounded-xl py-3 font-semibold text-xs transition-all cursor-pointer ${
                isDrawing
                  ? 'border-2 border-blue-500 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-200'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Compass size={18} className={isDrawing ? 'animate-spin text-blue-600' : ''} />
              <span>{isDrawing ? 'Drawing Active (Click Rooftop Corners)' : 'Draw Custom Rooftop Outline'}</span>
            </button>

            <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
              <div className="mb-1 text-xs font-semibold text-primary-600 uppercase tracking-wider">Active Rooftop Area</div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-extrabold text-primary-700">{area.toLocaleString('en-IN')}</span>
                <span className="font-semibold text-primary-600">m²</span>
              </div>
              <p className="mt-1.5 text-xs text-primary-600">
                Suitable for approx. <strong className="text-primary-800">{estimatedPanels.toLocaleString('en-IN')}</strong> commercial panels.
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Action & Navigation Buttons (Linked directly to other tabs) */}
          <div className="space-y-2 mt-4">
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isSavingAnalysis || (!area && !googleSolarData)}
              className="group flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-md transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <span>{isSavingAnalysis ? 'Syncing Modules...' : 'Save & Sync Analysis'}</span>
              <Layers size={18} className="transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => {
                const effectiveArea = area || (googleSolarData?.maxArrayAreaMeters2 ? Math.round(googleSolarData.maxArrayAreaMeters2) : 0);
                const rooftopData = {
                  latitude: markerPosition[0],
                  longitude: markerPosition[1],
                  address: markerLabel,
                  location: markerLabel,
                  locationName: markerLabel,
                  polygonCoordinates,
                  roofArea: effectiveArea,
                  area: effectiveArea,
                  googleSolarData,
                };
                localStorage.setItem('solarscope.rooftop', JSON.stringify(rooftopData));
                navigate('/solar-potential', { state: { rooftop: rooftopData } });
              }}
              className="group flex w-full items-center justify-center space-x-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-3.5 font-bold text-white shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Sun size={18} />
              <span>Assess Solar Potential</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Google Satellite Map Canvas */}
        <div className="relative col-span-1 h-full min-h-[600px] overflow-hidden rounded-2xl border border-slate-200 shadow-inner xl:col-span-3">
          <GoogleSolarMap
            center={center}
            bounds={locationBounds}
            markerPosition={markerPosition}
            markerLabel={markerLabel}
            polygonCoordinates={polygonCoordinates}
            onPolygonChange={handlePolygonChange}
            onMapClick={handleMapClick}
            isDrawingEnabled={isDrawing}
            onCancelDrawing={() => setIsDrawing(false)}
            solarPanels={googleSolarData?.solarPanels || []}
            roofSegmentStats={googleSolarData?.roofSegmentStats || []}
            panelHeightMeters={googleSolarData?.panelHeightMeters || 1.879}
            panelWidthMeters={googleSolarData?.panelWidthMeters || 1.045}
            showSolarPanels={showSolarPanels}
            panelLimit={panelCountSlider}
            fluxBounds={googleFluxBounds}
          />

          <div className="absolute left-4 top-4 z-[30] flex max-w-[calc(100%-2rem)] items-center space-x-2 rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-800 shadow-md backdrop-blur-md">
            <MapPin size={16} className="shrink-0 text-primary-500" />
            <span className="truncate">{markerLabel}</span>
          </div>
        </div>
      </Card>

      {saveFeedback && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 flex items-center gap-2 shadow-sm">
          <CheckCircle2 size={18} className="text-green-600 shrink-0" />
          <span>{saveFeedback.message}</span>
        </div>
      )}

      <AnalysisResults results={analysisResults} />
    </div>
  );
};

export default MapSelection;
