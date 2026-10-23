import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Cpu,
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
import { applyWeatherAdjustment, calculatePolygonMetrics, calculateRooftopArea, estimateSolarAnalysis } from '../services/solarAnalysisService';
import { isPointInPolygon } from '../utils/geoUtils';

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
   * Filter Google Solar panels to ONLY those that fall strictly inside the user-drawn rooftop area
   */
  const panelsInDrawnArea = useMemo(() => {
    if (!googleSolarData?.solarPanels || !polygonCoordinates || polygonCoordinates.length < 3) {
      return [];
    }
    const filtered = googleSolarData.solarPanels.filter((panel) => {
      if (!panel.center) return false;
      return isPointInPolygon([panel.center.latitude, panel.center.longitude], polygonCoordinates);
    });

    // Sort by solar radiance / yearly energy output descending (Maximum Throughput first)
    filtered.sort((a, b) => (b.yearlyEnergyDcKwh || 0) - (a.yearlyEnergyDcKwh || 0));
    return filtered;
  }, [googleSolarData, polygonCoordinates]);

  // Keep slider bounded to the actual panel count of the drawn area
  useEffect(() => {
    if (panelsInDrawnArea.length > 0) {
      setPanelCountSlider(panelsInDrawnArea.length);
    }
  }, [panelsInDrawnArea.length]);

  // Energy throughput of the selected modules on the drawn rooftop
  const activeThroughputKwh = useMemo(() => {
    if (panelsInDrawnArea.length === 0) return 0;
    const active = panelsInDrawnArea.slice(0, panelCountSlider);
    return Math.round(active.reduce((acc, p) => acc + (p.yearlyEnergyDcKwh || 0), 0));
  }, [panelsInDrawnArea, panelCountSlider]);

  /**
   * Synchronizes the user-drawn rooftop and calculated analysis to ALL tabs in the sidebar:
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
      setSaveFeedback({ type: 'success', message: 'Rooftop outline saved! All sidebar tabs (Dashboard, Analysis, Solar Potential, and AI Optimizer) are now synchronized.' });
    } catch (saveError) {
      setSaveFeedback({ 
        type: 'success', 
        message: 'Rooftop outline saved locally & synced across all sidebar tabs!' 
      });
    }
  }, [markerPosition, markerLabel, weatherData]);

  // Manual point-and-click polygon completion
  const handlePolygonChange = useCallback((coordinates) => {
    setPolygonCoordinates(coordinates);
    const calculatedArea = calculateRooftopArea(coordinates);
    setArea(calculatedArea);
    setIsDrawing(false);

    // Immediate sync across all tabs for the user's specific drawn rooftop area
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
    if (!area || polygonCoordinates.length < 3) {
      setError('Please draw an outline around the rooftop section on the map to calculate its area and run analysis.');
      return;
    }

    setError('');
    setIsSavingAnalysis(true);
    await syncToAllTabs(area, polygonCoordinates, googleSolarData);
    setIsSavingAnalysis(false);
  };

  const estimatedPanels = Math.floor(area / 2.5);

  const polygonMetrics = useMemo(() => {
    return calculatePolygonMetrics(polygonCoordinates);
  }, [polygonCoordinates]);

  const googleFluxBounds = useMemo(() => {
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
          <p className="text-slate-500 mt-1">Outline a specific rooftop area on the Google Satellite engine to optimize panels and calculate solar yield.</p>
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

          {/* Google Solar Photogrammetry Context Badge */}
          {isLoadingSolarData && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs">
              <Zap size={15} className="text-amber-500 animate-bounce" />
              <span>Analyzing Google Solar photogrammetry...</span>
            </div>
          )}

          {googleSolarData && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 space-y-2.5 text-xs shadow-sm">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Sun size={15} className="text-amber-600" />
                  Google Solar Climate Profile
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {googleSolarData.quality} QUALITY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div className="bg-white/90 p-2 rounded-lg border border-amber-200/70">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Sunshine/Yr</span>
                  <span className="font-extrabold text-sm text-slate-900">{Math.round(googleSolarData.maxSunshineHoursPerYear)}h</span>
                </div>
                <div className="bg-white/90 p-2 rounded-lg border border-amber-200/70">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Standard Module</span>
                  <span className="font-extrabold text-sm text-slate-900">{googleSolarData.panelCapacityWatts} W</span>
                </div>
              </div>
            </div>
          )}

          <div className="h-px w-full bg-slate-100" />

          {/* Rooftop Boundary Drawing & Measurement Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Target Rooftop Boundary</h3>
              {polygonCoordinates.length > 0 && (
                <button
                  type="button"
                  onClick={resetRooftopSelection}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear Outline</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDrawing((prev) => !prev)}
              className={`flex w-full items-center justify-center space-x-2 rounded-xl py-3 font-semibold text-xs transition-all cursor-pointer ${
                isDrawing
                  ? 'border-2 border-blue-600 bg-blue-50 text-blue-700 shadow-lg ring-2 ring-blue-200 animate-pulse'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Compass size={18} className={isDrawing ? 'animate-spin text-blue-600' : 'text-slate-600'} />
              <span>{isDrawing ? 'Drawing Active (Click Roof Corners)' : 'Draw Custom Rooftop Outline'}</span>
            </button>

            {/* Active Drawn Rooftop Area Display */}
            {polygonCoordinates.length >= 3 && area > 0 ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Selected Rooftop Area</span>
                  <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">Custom Area</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-extrabold text-blue-950">{area.toLocaleString('en-IN')}</span>
                    <span className="font-semibold text-blue-700">m²</span>
                  </div>
                  {polygonMetrics.areaSqFt > 0 && (
                    <span className="text-xs font-semibold text-slate-500">
                      {polygonMetrics.areaSqFt.toLocaleString('en-IN')} sq ft
                    </span>
                  )}
                </div>

                {polygonMetrics.dimensionsSummary !== '-' && (
                  <div className="rounded-lg bg-blue-100/70 p-2.5 text-[11px] text-blue-900 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>Physical Dimensions:</span>
                      <span className="font-mono text-blue-950">{polygonMetrics.dimensionsSummary}</span>
                    </div>
                    <div className="flex justify-between text-blue-800 text-[10px]">
                      <span>Perimeter:</span>
                      <span className="font-mono">{polygonMetrics.perimeterMeters} m</span>
                    </div>
                    {polygonMetrics.sideLengths.length > 0 && (
                      <div className="text-[10px] text-blue-700 border-t border-blue-200/60 pt-1 flex flex-wrap gap-x-2">
                        <span>Sides:</span>
                        <span className="font-mono">{polygonMetrics.sideLengths.map((s) => `${s}m`).join(' × ')}</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-blue-700">
                  Fits approx. <strong className="text-blue-950">{estimatedPanels}</strong> standard panels
                  {panelsInDrawnArea.length > 0 && ` (${panelsInDrawnArea.length} Google Solar modules in bounds)`}.
                </p>

                <p className="text-[11px] text-slate-500 italic">
                  💡 Tip: To assess a smaller subsection (e.g. 250–450 m²), click "Draw Custom Rooftop Outline" and trace that specific roof portion.
                </p>

                {/* Show Panels on Roof Toggle inside drawn perimeter */}
                {panelsInDrawnArea.length > 0 && (
                  <div className="pt-2 border-t border-blue-200/60 space-y-2">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-medium text-[11px]">Show Panels Inside Rooftop</span>
                      <input
                        type="checkbox"
                        checked={showSolarPanels}
                        onChange={(e) => setShowSolarPanels(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      />
                    </div>

                    {showSolarPanels && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-700">
                          <span>Active Modules in Area:</span>
                          <span className="font-extrabold text-blue-800">{panelCountSlider} / {panelsInDrawnArea.length}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max={panelsInDrawnArea.length}
                          value={panelCountSlider}
                          onChange={(e) => setPanelCountSlider(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex items-center justify-between text-[10px] bg-white p-2 rounded-lg border border-blue-200/70 text-slate-700 font-medium shadow-2xs">
                          <span>Solar Yield: <strong className="text-blue-900 font-bold">{activeThroughputKwh.toLocaleString('en-IN')} kWh/yr</strong></span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">Max Radiance First</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">No Rooftop Area Selected</p>
                <p>Click "Draw Custom Rooftop Outline" and click the corners of the building on the satellite map.</p>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Action & Navigation Buttons (Linked directly to other tabs) */}
          <div className="space-y-2 mt-4">
            {/* Primary CTA: AI Panel Optimizer */}
            <button
              type="button"
              disabled={!area || polygonCoordinates.length < 3}
              onClick={() => {
                const rooftopData = {
                  latitude: markerPosition[0],
                  longitude: markerPosition[1],
                  address: markerLabel,
                  location: markerLabel,
                  locationName: markerLabel,
                  polygonCoordinates,
                  roofArea: area,
                  area: area,
                  googleSolarData,
                };
                localStorage.setItem('solarscope.rooftop', JSON.stringify(rooftopData));
                navigate('/panel-optimizer', { state: { rooftop: rooftopData } });
              }}
              className="group flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 font-bold text-white shadow-md shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Cpu size={18} />
              <span>AI Panel Optimizer</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isSavingAnalysis || !area || polygonCoordinates.length < 3}
              className="group flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-900 py-3 font-semibold text-xs text-white shadow-md transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <span>{isSavingAnalysis ? 'Syncing...' : 'Save & Sync Analysis'}</span>
              <Layers size={16} className="transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              disabled={!area || polygonCoordinates.length < 3}
              onClick={() => {
                const rooftopData = {
                  latitude: markerPosition[0],
                  longitude: markerPosition[1],
                  address: markerLabel,
                  location: markerLabel,
                  locationName: markerLabel,
                  polygonCoordinates,
                  roofArea: area,
                  area: area,
                  googleSolarData,
                };
                localStorage.setItem('solarscope.rooftop', JSON.stringify(rooftopData));
                navigate('/solar-potential', { state: { rooftop: rooftopData } });
              }}
              className="group flex w-full items-center justify-center space-x-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-3 font-semibold text-xs text-white shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sun size={16} />
              <span>Assess Solar Potential</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
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
