import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Compass, Layers, MapPin, Sun, ArrowRight, Trash2, Zap } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(null);

  const resetRooftopSelection = useCallback(() => {
    setPolygonCoordinates([]);
    setArea(0);
    setAnalysisResults(null);
    setSaveFeedback(null);
    setIsDrawing(false);
    localStorage.removeItem('solarscope.rooftop');
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

  const handlePolygonChange = useCallback((coordinates) => {
    setPolygonCoordinates(coordinates);
    const calculatedArea = calculateRooftopArea(coordinates);
    setArea(calculatedArea);
    setAnalysisResults(null);
    setIsDrawing(false);

    // Automatically persist rooftop selection for instant retrieval by Solar Potential module
    const rooftopData = {
      latitude: markerPosition[0],
      longitude: markerPosition[1],
      address: markerLabel,
      polygonCoordinates: coordinates,
      roofArea: calculatedArea,
    };
    localStorage.setItem('solarscope.rooftop', JSON.stringify(rooftopData));
  }, [markerPosition, markerLabel]);

  // Click on map to drop pin or re-target installation site
  const handleMapClick = useCallback(({ lat, lng }) => {
    if (isDrawing) return;
    const formattedPos = [lat, lng];
    const pinLabel = `Site (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    updateLocation(formattedPos, pinLabel, null, false);
  }, [isDrawing, updateLocation]);

  const handleRunAnalysis = async () => {
    // If no manually drawn area, check if Google Solar detected building roof area
    const effectiveArea = area || (googleSolarData?.maxArrayAreaMeters2 ? Math.round(googleSolarData.maxArrayAreaMeters2) : 0);

    if (!effectiveArea) {
      setError('Draw a rooftop polygon or select a location with Google Solar building data before running analysis.');
      return;
    }

    setError('');
    setIsSavingAnalysis(true);
    const baseResults = estimateSolarAnalysis(effectiveArea);
    let weather = weatherData;
    let results = baseResults;

    try {
      if (!weather) {
        weather = await weatherApiService.getWeather(markerPosition[0], markerPosition[1]);
        setWeatherData(weather);
      }
      results = applyWeatherAdjustment(baseResults, weather);
    } catch {
      const warning = 'Weather data is unavailable. Showing base generation estimate.';
      results = {
        ...baseResults,
        weatherWarning: warning,
        weatherAdjustedMonthlyGeneration: baseResults.monthlyGeneration,
        weatherAdjustedYearlyGeneration: baseResults.yearlyGeneration,
        weatherAdjustmentPercent: 0,
      };
    }

    const latestAnalysis = {
      ...results,
      location: markerLabel,
      roofArea: effectiveArea,
      usableArea: results.panels * 2.5,
      systemSize: Number((results.panels * 0.4).toFixed(1)),
      generatedAt: new Date().toISOString(),
    };

    setAnalysisResults(results);
    const rooftopData = {
      latitude: markerPosition[0],
      longitude: markerPosition[1],
      address: markerLabel,
      polygonCoordinates,
      roofArea: effectiveArea,
      googleSolarData: googleSolarData ? {
        maxPanels: googleSolarData.maxArrayPanelsCount,
        sunshineHours: googleSolarData.maxSunshineHoursPerYear,
        carbonOffset: googleSolarData.carbonOffsetFactorKgPerMwh,
      } : null,
    };
    localStorage.setItem('solarscope.rooftop', JSON.stringify(rooftopData));
    localStorage.setItem('latestAnalysis', JSON.stringify(latestAnalysis));

    try {
      const savedAnalysis = await analysisApiService.saveAnalysis({
        locationName: markerLabel,
        latitude: markerPosition[0],
        longitude: markerPosition[1],
        roofArea: effectiveArea,
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

      try {
        await reportApiService.saveReport({
          reportName: `Solar Feasibility - ${markerLabel || 'Rooftop Site'}`,
          reportType: 'PDF',
          analysisId: savedAnalysis.id,
          filePath: `/reports/solar_feasibility_${savedAnalysis.id}.pdf`,
        });
      } catch {
        // Non-blocking if report save fails
      }

      setSaveFeedback({ type: 'success', message: 'Analysis & Report saved to database successfully!' });
    } catch (saveError) {
      setSaveFeedback({ 
        type: 'warning', 
        message: saveError.message?.includes('Sign in') 
          ? 'Analysis calculated locally! Please sign in to sync it to your database history.' 
          : `Analysis saved locally (${saveError.message})`
      });
    } finally {
      setIsSavingAnalysis(false);
    }
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
          <h1 className="text-2xl font-bold text-slate-900">Map Selection</h1>
          <p className="text-slate-500 mt-1">Search an address or draw a polygon on the Google Satellite engine</p>
        </div>
      </div>

      <Card className="grid flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-4">
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

          {/* Google Solar API Live Status Badge */}
          {isLoadingSolarData && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs">
              <Zap size={14} className="text-amber-500 animate-bounce" />
              <span>Checking Google Solar coverage...</span>
            </div>
          )}

          {googleSolarData && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 space-y-2 text-xs shadow-sm">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Sun size={15} className="text-amber-600" />
                  Google Solar Insights
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {googleSolarData.quality}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
                <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Max Panels</span>
                  <span className="font-extrabold text-sm text-slate-900">{googleSolarData.maxArrayPanelsCount}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Sunshine/Yr</span>
                  <span className="font-extrabold text-sm text-slate-900">{Math.round(googleSolarData.maxSunshineHoursPerYear)}h</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Array Area</span>
                  <span className="font-extrabold text-sm text-slate-900">{Math.round(googleSolarData.maxArrayAreaMeters2)} m²</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Panel Wattage</span>
                  <span className="font-extrabold text-sm text-slate-900">{googleSolarData.panelCapacityWatts} W</span>
                </div>
              </div>
            </div>
          )}

          <div className="h-px w-full bg-slate-100" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Measurement Tools</h3>
              {polygonCoordinates.length > 0 && (
                <button
                  type="button"
                  onClick={resetRooftopSelection}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear Roof</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDrawing((prev) => !prev)}
              className={`flex w-full items-center justify-center space-x-2 rounded-xl py-3 font-medium transition-all cursor-pointer ${
                isDrawing
                  ? 'border border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Compass size={18} className={isDrawing ? 'animate-spin text-amber-600' : ''} />
              <span>{isDrawing ? 'Finish / Cancel Drawing' : 'Draw Rooftop Polygon'}</span>
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

          <div className="space-y-2 mt-4">
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isSavingAnalysis}
              className="group flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-md transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            >
              <span>{isSavingAnalysis ? 'Saving Analysis...' : 'Financial Analysis'}</span>
              <Layers size={18} className="transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => {
                const rooftopData = {
                  latitude: markerPosition[0],
                  longitude: markerPosition[1],
                  address: markerLabel,
                  polygonCoordinates,
                  roofArea: area || (googleSolarData?.maxArrayAreaMeters2 ? Math.round(googleSolarData.maxArrayAreaMeters2) : 0),
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

        <div className="relative col-span-1 h-full min-h-[560px] overflow-hidden rounded-xl border border-slate-200 lg:col-span-3">
          <GoogleSolarMap
            center={center}
            bounds={locationBounds}
            markerPosition={markerPosition}
            markerLabel={markerLabel}
            polygonCoordinates={polygonCoordinates}
            onPolygonChange={handlePolygonChange}
            onMapClick={handleMapClick}
            isDrawingEnabled={isDrawing}
            fluxBounds={googleFluxBounds}
          />

          <div className="absolute left-4 top-4 z-[30] flex max-w-[calc(100%-2rem)] items-center space-x-2 rounded-lg border border-slate-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow backdrop-blur-md">
            <MapPin size={16} className="shrink-0 text-primary-500" />
            <span className="truncate">{markerLabel}</span>
          </div>
        </div>
      </Card>

      {saveFeedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium flex items-center gap-2 ${
          saveFeedback.type === 'success' 
            ? 'border-green-200 bg-green-50 text-green-700' 
            : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          {saveFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{saveFeedback.message}</span>
        </div>
      )}

      <AnalysisResults results={analysisResults} />
    </div>
  );
};

export default MapSelection;
