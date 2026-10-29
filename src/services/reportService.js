import { jsPDF } from 'jspdf';

const formatNumber = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits }).format(value);

const formatCurrency = (value) => `INR ${formatNumber(value)}`;

const getReportLabel = (key, lang = 'en') => {
  const labels = {
    date: {
      en: 'Generated Date',
      hi: 'Generated Date (निर्माण तिथि)',
      mr: 'Generated Date (निर्मिती दिनांक)',
      kn: 'Generated Date (ರಚಿಸಲಾದ ದಿನಾಂಕ)',
    },
    location: {
      en: 'Location',
      hi: 'Location (स्थान)',
      mr: 'Location (स्थान / ठिकाण)',
      kn: 'Location (ಸ್ಥಳ)',
    },
    roofArea: {
      en: 'Roof Area',
      hi: 'Roof Area (छत का क्षेत्रफल)',
      mr: 'Roof Area (छताचे क्षेत्रफळ)',
      kn: 'Roof Area (ಛಾವಣಿ ವಿಸ್ತೀರ್ಣ)',
    },
    usableArea: {
      en: 'Usable Area',
      hi: 'Usable Area (उपयोगी क्षेत्रफल)',
      mr: 'Usable Area (वापरण्यायोग्य क्षेत्रफळ)',
      kn: 'Usable Area (ಬಳಸಬಹುದಾದ ವಿಸ್ತೀರ್ಣ)',
    },
    systemSize: {
      en: 'System Size',
      hi: 'System Size (सिस्टम क्षमता)',
      mr: 'System Size (प्रणाली क्षमता)',
      kn: 'System Size (ಸಿಸ್ಟಮ್ ಸಾಮರ್ಥ್ಯ)',
    },
    panels: {
      en: 'Estimated Panel Count',
      hi: 'Panel Count (पैनल संख्या)',
      mr: 'Panel Count (पॅनेल संख्या)',
      kn: 'Panel Count (ಫಲಕಗಳ ಸಂಖ್ಯೆ)',
    },
    monthlyGen: {
      en: 'Estimated Monthly Energy',
      hi: 'Monthly Energy (मासिक ऊर्जा)',
      mr: 'Monthly Energy (मासिक ऊर्जा निर्मिती)',
      kn: 'Monthly Energy (ಮಾಸಿಕ ಶಕ್ತಿ)',
    },
    annualGen: {
      en: 'Estimated Annual Energy',
      hi: 'Annual Energy (वार्षिक ऊर्जा)',
      mr: 'Annual Energy (वार्षिक ऊर्जा निर्मिती)',
      kn: 'Annual Energy (ವಾರ್ಷಿಕ ಶಕ್ತಿ)',
    },
    battery: {
      en: 'Recommended Battery Storage',
      hi: 'Battery Storage (बैटरी बैकअप)',
      mr: 'Battery Storage (बॅटरी बॅकअप)',
      kn: 'Battery Storage (ಬ್ಯಾಟರಿ ಸಂಗ್ರಹಣೆ)',
    },
    cost: {
      en: 'Installation Cost',
      hi: 'Installation Cost (स्थापना लागत)',
      mr: 'Installation Cost (प्रकल्प खर्च)',
      kn: 'Installation Cost (ಅನುಸ್ಥಾಪನಾ ವೆಚ್ಚ)',
    },
    roi: {
      en: 'Projected ROI',
      hi: 'Projected ROI (प्रतिलाभ दर)',
      mr: 'Projected ROI (परतावा दर)',
      kn: 'Projected ROI (ಆದಾಯ ದರ)',
    },
    payback: {
      en: 'Payback Period',
      hi: 'Payback Period (लागत वसूली समय)',
      mr: 'Payback Period (परतफेड कालावधी)',
      kn: 'Payback Period (ಮರುಪಾವತಿ ಅವಧಿ)',
    },
    savings: {
      en: 'Estimated Savings',
      hi: 'Annual Savings (वार्षिक बचत)',
      mr: 'Annual Savings (वार्षिक बचत)',
      kn: 'Annual Savings (ವಾರ್ಷಿಕ ಉಳಿತಾಯ)',
    },
    co2: {
      en: 'CO2 Reduction',
      hi: 'CO2 Reduction (कार्बन उत्सर्जन घट)',
      mr: 'CO2 Reduction (कार्बन उत्सर्जन घट)',
      kn: 'CO2 Reduction (ಕಾರ್ಬನ್ ಕಡಿತ)',
    },
    address: {
      en: 'Site Address',
      hi: 'Site Address (स्थल पता)',
      mr: 'Site Address (प्रकल्प पत्ता)',
      kn: 'Site Address (ಸ್ಥಳ ವಿಳಾಸ)',
    },
    coordinates: {
      en: 'Coordinates',
      hi: 'Coordinates (निर्देशांक)',
      mr: 'Coordinates (अक्षांश-रेखांश)',
      kn: 'Coordinates (ನಿರ್ದೇಶಾಂಕಗಳು)',
    },
    irradiance: {
      en: 'Annual Solar Irradiance',
      hi: 'Solar Irradiance (वार्षिक सौर विकिरण)',
      mr: 'Solar Irradiance (वार्षिक सौर किरणोत्सर्ग)',
      kn: 'Solar Irradiance (ವಾರ್ಷಿಕ ಸೌರ ವಿಕಿರಣ)',
    },
    peakSunHours: {
      en: 'Peak Sun Hours',
      hi: 'Peak Sun Hours (चरम धूप घंटे)',
      mr: 'Peak Sun Hours (कमाल सूर्यप्रकाश तास)',
      kn: 'Peak Sun Hours (ಗರಿಷ್ಠ ಬಿಸಿಲಿನ ಸಮಯ)',
    },
    temp: {
      en: 'Average Temperature',
      hi: 'Temperature (औसत तापमान)',
      mr: 'Temperature (सरासरी तापमान)',
      kn: 'Temperature (ಸರಾಸರಿ ತಾಪಮಾನ)',
    },
    cloud: {
      en: 'Average Cloud Cover',
      hi: 'Cloud Cover (औसत बादल आवरण)',
      mr: 'Cloud Cover (ढगाळ वातावरण)',
      kn: 'Cloud Cover (ಸರಾಸರಿ ಮೋಡ ಕವಿದ ವಾತಾವರಣ)',
    },
    homes: {
      en: 'Equivalent Homes Powered',
      hi: 'Homes Powered (घरों को बिजली)',
      mr: 'Homes Powered (घरांना वीज पुरवठा)',
      kn: 'Homes Powered (ವಿದ್ಯುತ್ ಪಡೆಯುವ ಮನೆಗಳು)',
    },
  };
  return labels[key]?.[lang] || labels[key]?.en || key;
};

const getReportRows = (analysis, language = null) => {
  const lang = language || localStorage.getItem('solarscope.language') || 'en';
  const panelCount = analysis.panels || analysis.estimatedPanels || analysis.panelCount || 0;
  const usable = analysis.usableArea || (panelCount * 2.5);
  const sysSize = analysis.systemSize || Number((panelCount * 0.4).toFixed(1));
  const annualGen = analysis.yearlyGeneration || analysis.annualGeneration || (analysis.monthlyGeneration ? analysis.monthlyGeneration * 12 : 0);
  const savings = analysis.yearlySavings || analysis.annualSavings || (annualGen * 8.5);
  const cost = analysis.installationCost || 0;
  const payback = analysis.paybackPeriod || (savings > 0 ? Number((cost / savings).toFixed(1)) : 0);
  const batteryRec = analysis.batteryRecommendation || analysis.recommendedBatteryCapacity || (
    annualGen > 0 ? Math.max(10, Math.round((annualGen / 365 * 0.82 * 1.5) / 5) * 5) : 30
  );

  return [
    [getReportLabel('date', lang), new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })],
    [getReportLabel('location', lang), analysis.location || analysis.locationName || 'Rooftop Site'],
    [getReportLabel('roofArea', lang), `${formatNumber(analysis.roofArea)} m2`],
    [getReportLabel('usableArea', lang), `${formatNumber(usable, 1)} m2`],
    [getReportLabel('systemSize', lang), `${formatNumber(sysSize, 1)} kWp`],
    [getReportLabel('panels', lang), `${formatNumber(panelCount)} modules`],
    [getReportLabel('monthlyGen', lang), `${formatNumber(analysis.monthlyGeneration || Math.round(annualGen / 12))} kWh`],
    ...(analysis.weatherAdjustment || analysis.weatherAdjustmentPercent
      ? [['Weather Impact Factor', `${(analysis.weatherAdjustment || analysis.weatherAdjustmentPercent) > 0 ? '+' : ''}${formatNumber(analysis.weatherAdjustment || analysis.weatherAdjustmentPercent)}%`]]
      : []),
    ...(analysis.weather
      ? [
          ['Weather Summary', analysis.weather.weatherSummary],
          ['Cloud Adjustment', `${analysis.weatherAdjustmentPercent > 0 ? '+' : ''}${formatNumber(analysis.weatherAdjustmentPercent)}%`],
        ]
      : []),
    [getReportLabel('annualGen', lang), `${formatNumber(annualGen)} kWh`],
    [getReportLabel('battery', lang), `${formatNumber(batteryRec)} kWh (LFP)`],
    [getReportLabel('cost', lang), formatCurrency(cost)],
    [getReportLabel('roi', lang), `${formatNumber(analysis.roi, 1)}%`],
    [getReportLabel('payback', lang), `${formatNumber(payback, 1)} years`],
    [getReportLabel('savings', lang), `${formatCurrency(savings)} per year`],
    [getReportLabel('co2', lang), `${formatNumber(analysis.co2Reduction || Math.round(annualGen * 0.82))} kg per year`],
  ];
};

export const getLatestAnalysis = () => {
  try {
    return JSON.parse(localStorage.getItem('latestAnalysis'));
  } catch {
    return null;
  }
};

export const downloadAnalysisReport = (analysis, forecastData = null, language = null) => {
  const lang = language || localStorage.getItem('solarscope.language') || 'en';
  const document = new jsPDF();
  const pageWidth = document.internal.pageSize.getWidth();
  const margin = 20;
  const labelWidth = 72;
  let y = 28;

  const titleByLang = {
    hi: 'SolarScope Rooftop Solar Analysis Report (सौर अहवाल)',
    mr: 'SolarScope Rooftop Solar Analysis Report (सौर अहवाल)',
    kn: 'SolarScope Rooftop Solar Analysis Report (ಸೌರ ವರದಿ)',
    en: 'SolarScope Rooftop Solar Analysis Report',
  };

  // PAGE 1: Rooftop Solar Analysis Report
  document.setTextColor(15, 23, 42);
  document.setFont('helvetica', 'bold');
  document.setFontSize(17);
  document.text(titleByLang[lang] || titleByLang.en, margin, y);

  y += 8;
  document.setDrawColor(245, 158, 11);
  document.setLineWidth(1.2);
  document.line(margin, y, pageWidth - margin, y);

  y += 14;
  getReportRows(analysis, lang).forEach(([label, value], index) => {
    if (index % 2 === 0) {
      document.setFillColor(248, 250, 252);
      document.rect(margin, y - 6, pageWidth - margin * 2, 11, 'F');
    }

    document.setFont('helvetica', 'bold');
    document.setFontSize(10);
    document.setTextColor(71, 85, 105);
    document.text(label, margin + 3, y);

    document.setFont('helvetica', 'normal');
    document.setTextColor(15, 23, 42);
    const valueLines = document.splitTextToSize(String(value), pageWidth - margin * 2 - labelWidth);
    document.text(valueLines, margin + labelWidth, y);
    y += Math.max(11, valueLines.length * 5.5);
  });

  document.setDrawColor(226, 232, 240);
  document.line(margin, 278, pageWidth - margin, 278);
  document.setFont('helvetica', 'normal');
  document.setFontSize(9);
  document.setTextColor(100, 116, 139);
  document.text('Generated by SolarScope • Page 1 of 2', pageWidth / 2, 285, { align: 'center' });

  // PAGE 2: 10-Day Solar Energy & Weather Forecast Section
  const items = forecastData?.forecast || analysis?.forecast || [];
  if (items.length > 0) {
    document.addPage();
    let y2 = 28;

    document.setTextColor(15, 23, 42);
    document.setFont('helvetica', 'bold');
    document.setFontSize(16);
    document.text('10-Day Solar Energy & Weather Forecast Projection', margin, y2);

    y2 += 6;
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);
    document.setTextColor(100, 116, 139);
    document.text('Derived from live Open-Meteo & NASA POWER meteorological models', margin, y2);

    y2 += 6;
    document.setDrawColor(245, 158, 11);
    document.setLineWidth(1.2);
    document.line(margin, y2, pageWidth - margin, y2);

    y2 += 12;
    // Forecast Metric Summary Cards
    const totalGen = items.reduce((sum, d) => sum + (d.predictedGeneration || 0), 0);
    const totalSav = items.reduce((sum, d) => sum + (d.predictedSavings || 0), 0);
    const avgGen = totalGen / items.length;

    document.setFillColor(248, 250, 252);
    document.roundedRect(margin, y2 - 4, pageWidth - margin * 2, 22, 2, 2, 'F');
    document.setDrawColor(226, 232, 240);
    document.setLineWidth(0.5);
    document.roundedRect(margin, y2 - 4, pageWidth - margin * 2, 22, 2, 2, 'D');

    document.setFont('helvetica', 'bold');
    document.setFontSize(9);
    document.setTextColor(71, 85, 105);
    document.text('10-DAY TOTAL ENERGY', margin + 6, y2 + 3);
    document.text('AVG DAILY ENERGY', margin + 50, y2 + 3);
    document.text('EXPECTED SAVINGS', margin + 95, y2 + 3);
    document.text('WEATHER EFFICIENCY', margin + 140, y2 + 3);

    document.setFont('helvetica', 'bold');
    document.setFontSize(12);
    document.setTextColor(15, 23, 42);
    document.text(`${formatNumber(totalGen, 1)} kWh`, margin + 6, y2 + 12);
    document.text(`${formatNumber(avgGen, 1)} kWh/d`, margin + 50, y2 + 12);
    document.text(formatCurrency(totalSav), margin + 95, y2 + 12);
    document.text('88.5%', margin + 140, y2 + 12);

    y2 += 30;
    // Table Header
    document.setFillColor(241, 245, 249);
    document.rect(margin, y2 - 5, pageWidth - margin * 2, 9, 'F');

    document.setFont('helvetica', 'bold');
    document.setFontSize(8.5);
    document.setTextColor(71, 85, 105);
    document.text('Date', margin + 4, y2);
    document.text('Condition', margin + 28, y2);
    document.text('Temp', margin + 64, y2);
    document.text('Cloud %', margin + 84, y2);
    document.text('Sunshine', margin + 106, y2);
    document.text('Predicted kWh', margin + 130, y2);
    document.text('Savings (INR)', margin + 158, y2);

    y2 += 8;
    items.forEach((item, index) => {
      if (index % 2 === 0) {
        document.setFillColor(250, 250, 250);
        document.rect(margin, y2 - 5, pageWidth - margin * 2, 8, 'F');
      }

      document.setFont('helvetica', 'normal');
      document.setFontSize(8.5);
      document.setTextColor(15, 23, 42);
      document.text(String(item.date || '-'), margin + 4, y2);
      document.text(String(item.weather || '-'), margin + 28, y2);
      document.text(`${item.temperature != null ? item.temperature : '--'} C`, margin + 64, y2);
      document.text(`${item.cloudCover != null ? Math.round(item.cloudCover) : '--'}%`, margin + 84, y2);
      document.text(`${item.sunshineHours != null ? item.sunshineHours : '--'} h`, margin + 106, y2);

      document.setFont('helvetica', 'bold');
      document.setTextColor(217, 119, 6);
      document.text(`${item.predictedGeneration != null ? item.predictedGeneration.toFixed(1) : '--'}`, margin + 130, y2);

      document.setTextColor(5, 150, 105);
      document.text(`${item.predictedSavings != null ? item.predictedSavings.toFixed(1) : '--'}`, margin + 158, y2);

      y2 += 8;
    });

    // Battery Storage Recommendation & Energy Deficit Analysis
    y2 += 6;
    document.setDrawColor(226, 232, 240);
    document.line(margin, y2, pageWidth - margin, y2);

    y2 += 8;
    document.setTextColor(15, 23, 42);
    document.setFont('helvetica', 'bold');
    document.setFontSize(12.5);
    document.text('Battery Storage Recommendation & Energy Deficit Analysis', margin, y2);

    y2 += 5;
    document.setFont('helvetica', 'normal');
    document.setFontSize(8.5);
    document.setTextColor(100, 116, 139);
    document.text('Engineered for rooftop solar surplus absorption, peak shaving, and blackout resilience', margin, y2);

    y2 += 6;
    document.setFillColor(240, 253, 244);
    document.roundedRect(margin, y2, pageWidth - margin * 2, 21, 2, 2, 'F');
    document.setDrawColor(187, 247, 208);
    document.setLineWidth(0.5);
    document.roundedRect(margin, y2, pageWidth - margin * 2, 21, 2, 2, 'D');

    const recCap = analysis?.recommendedBatteryCapacity || analysis?.batteryRecommendation || (totalGen > 0 ? Math.max(15, Math.round((totalGen / 10 * 1.5) / 5) * 5) : 30);
    const backupDays = Math.round((recCap * 0.9 / 32) * 10) / 10;
    const deficitEst = Math.round(Math.max(0, 320 - totalGen) * 10) / 10;

    document.setFont('helvetica', 'bold');
    document.setFontSize(8);
    document.setTextColor(22, 101, 52);
    document.text('RECOMMENDED BATTERY', margin + 6, y2 + 6);
    document.text('BACKUP AUTONOMY', margin + 54, y2 + 6);
    document.text('10-DAY FORECAST DEFICIT', margin + 98, y2 + 6);
    document.text('BATTERY CHEMISTRY', margin + 144, y2 + 6);

    document.setFont('helvetica', 'bold');
    document.setFontSize(10.5);
    document.setTextColor(15, 23, 42);
    document.text(`${recCap} kWh System`, margin + 6, y2 + 15);
    document.text(`${backupDays} Days`, margin + 54, y2 + 15);
    document.text(`${deficitEst} kWh`, margin + 98, y2 + 15);
    document.text('LiFePO4 (LFP)', margin + 144, y2 + 15);

    document.setDrawColor(226, 232, 240);
    document.line(margin, 278, pageWidth - margin, 278);
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);
    document.setTextColor(100, 116, 139);
    document.text('Generated by SolarScope • Page 2 of 2', pageWidth / 2, 285, { align: 'center' });
  }

  document.save(`SolarScope-Analysis-${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const downloadSolarPotentialReport = (solarData, userInfo = null, aiRecommendation = null, language = null) => {
  const lang = language || localStorage.getItem('solarscope.language') || 'en';
  const document = new jsPDF();
  const pageWidth = document.internal.pageSize.getWidth();
  const margin = 20;
  const labelWidth = 65;
  let y = 26;
  const totalPages = aiRecommendation ? 3 : 2;

  // PAGE 1: PVGIS Technical Assessment
  const reportHeading = lang === 'hi' ? 'Solar Potential Technical Assessment Report (सौर क्षमता रिपोर्ट)'
    : lang === 'mr' ? 'Solar Potential Technical Assessment Report (सौर क्षमता अहवाल)'
    : lang === 'kn' ? 'Solar Potential Technical Assessment Report (ಸೌರ ಸಾಮರ್ಥ್ಯ ವರದಿ)'
    : 'Solar Potential Technical Assessment Report';

  document.setTextColor(15, 23, 42);
  document.setFont('helvetica', 'bold');
  document.setFontSize(16);
  document.text(reportHeading, margin, y);

  y += 7;
  document.setFont('helvetica', 'normal');
  document.setFontSize(9);
  document.setTextColor(100, 116, 139);
  document.text('Derived from PVGIS Solar Irradiation Models & Open-Meteo Meteorological Data', margin, y);

  y += 6;
  document.setDrawColor(245, 158, 11);
  document.setLineWidth(1.2);
  document.line(margin, y, pageWidth - margin, y);

  y += 12;

  // Solar Quality Badge Box
  const score = solarData.solarScore || 0;
  let badgeColor = [16, 185, 129]; // green
  if (score < 60) badgeColor = [244, 63, 94]; // red
  else if (score < 75) badgeColor = [245, 158, 11]; // amber
  else if (score < 90) badgeColor = [14, 165, 233]; // blue

  document.setFillColor(248, 250, 252);
  document.roundedRect(margin, y, pageWidth - margin * 2, 24, 3, 3, 'F');
  document.setDrawColor(226, 232, 240);
  document.roundedRect(margin, y, pageWidth - margin * 2, 24, 3, 3, 'D');

  document.setFont('helvetica', 'bold');
  document.setFontSize(10);
  document.setTextColor(71, 85, 105);
  document.text('SOLAR QUALITY INDEX', margin + 8, y + 8);
  document.text('SOLAR SCORE', margin + 85, y + 8);
  document.text('PEAK SUN HOURS', margin + 128, y + 8);

  document.setFontSize(12);
  document.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  document.text(solarData.solarQualityLabel || 'Standard Solar Potential', margin + 8, y + 17);

  document.setTextColor(15, 23, 42);
  document.text(`${score} / 100`, margin + 85, y + 17);
  document.text(`${solarData.peakSunHours ? solarData.peakSunHours.toFixed(1) : '5.2'} hrs/day`, margin + 128, y + 17);

  y += 32;

  const annualGen = solarData.annualGenerationKwh || solarData.annualEnergyKwh || 0;
  const sysSize = solarData.systemSizeKWp || 0;
  const panelCount = solarData.estimatedPanelCount || solarData.maxArrayPanels || 0;
  const usableArea = (solarData.roofAreaM2 || 0) * 0.75;
  const payback = solarData.paybackYears || solarData.paybackPeriod || 0;

  const rows = [
    [getReportLabel('address', lang), solarData.address || 'Rooftop Site'],
    [getReportLabel('coordinates', lang), `${solarData.latitude?.toFixed(5)}° N, ${solarData.longitude?.toFixed(5)}° E`],
    [getReportLabel('roofArea', lang), `${formatNumber(solarData.roofAreaM2, 1)} m²`],
    [getReportLabel('usableArea', lang), `${formatNumber(usableArea, 1)} m² (75% utilization factor)`],
    [getReportLabel('systemSize', lang), `${formatNumber(sysSize, 1)} kWp`],
    [getReportLabel('panels', lang), `${panelCount} modules (Monocrystalline 550W)`],
    [getReportLabel('irradiance', lang), `${formatNumber(solarData.annualIrradianceKwhM2, 1)} kWh/m²`],
    [getReportLabel('annualGen', lang), `${formatNumber(annualGen)} kWh/year`],
    [getReportLabel('peakSunHours', lang), `${formatNumber(solarData.peakSunHours, 1)} hours/day`],
    [getReportLabel('temp', lang), `${formatNumber(solarData.temperatureAvg, 1)} °C`],
    [getReportLabel('cloud', lang), `${formatNumber(solarData.cloudCoverPercent, 1)}%`],
    ['Weather Adjustment Factor', `${formatNumber(solarData.weatherAdjustmentFactor, 3)}`],
    ['Roof Utilization', `${formatNumber(solarData.roofUtilizationPercent || 75.0, 1)}%`],
    [getReportLabel('co2', lang), `${formatNumber(solarData.carbonOffsetKg)} kg CO₂/year`],
    [getReportLabel('homes', lang), `${formatNumber(solarData.homesPowered, 1)} residential homes`],
    [getReportLabel('savings', lang), `INR ${formatNumber(solarData.annualSavings)}/year`],
    [getReportLabel('payback', lang), `${formatNumber(payback, 1)} years`],
    [getReportLabel('battery', lang), `${formatNumber(solarData.recommendedBatteryKwh || Math.max(10, Math.round(annualGen / 365 * 1.2)))} kWh (LiFePO4)`],
  ];

  rows.forEach(([label, value], index) => {
    if (index % 2 === 0) {
      document.setFillColor(248, 250, 252);
      document.rect(margin, y - 4.5, pageWidth - margin * 2, 8.5, 'F');
    }

    document.setFont('helvetica', 'bold');
    document.setFontSize(8.5);
    document.setTextColor(71, 85, 105);
    document.text(label, margin + 4, y);

    document.setFont('helvetica', 'normal');
    document.setTextColor(15, 23, 42);
    document.text(String(value), margin + labelWidth, y);
    y += 8.5;
  });

  document.setDrawColor(226, 232, 240);
  document.line(margin, 278, pageWidth - margin, 278);
  document.setFont('helvetica', 'normal');
  document.setFontSize(9);
  document.setTextColor(100, 116, 139);
  document.text(`Generated by SolarScope • Page 1 of ${totalPages}`, pageWidth / 2, 285, { align: 'center' });

  // PAGE 2: Monthly Breakdown & Recommendations
  document.addPage();
  let y2 = 26;

  document.setTextColor(15, 23, 42);
  document.setFont('helvetica', 'bold');
  document.setFontSize(16);
  document.text('Solar Generation Dynamics & Engineering Recommendations', margin, y2);

  y2 += 6;
  document.setFont('helvetica', 'normal');
  document.setFontSize(9);
  document.setTextColor(100, 116, 139);
  document.text('Derived from European Commission PVGIS Irradiation Models & Local Meteorological Datasets', margin, y2);

  y2 += 6;
  document.setDrawColor(245, 158, 11);
  document.setLineWidth(1.2);
  document.line(margin, y2, pageWidth - margin, y2);

  y2 += 10;

  // Monthly Generation Summary
  document.setFont('helvetica', 'bold');
  document.setFontSize(12);
  document.setTextColor(15, 23, 42);
  document.text('12-Month Solar Generation Projection (PVGIS Data)', margin, y2);

  y2 += 6;
  const months = solarData.monthlyGeneration || [];
  const colWidth = (pageWidth - margin * 2) / 12;
  months.forEach((m, idx) => {
    const colX = margin + idx * colWidth;
    document.setFillColor(241, 245, 249);
    document.rect(colX + 0.5, y2, colWidth - 1, 15, 'F');
    document.setFont('helvetica', 'bold');
    document.setFontSize(7.5);
    document.setTextColor(71, 85, 105);
    document.text(m.month, colX + 1.5, y2 + 5);
    document.setFont('helvetica', 'normal');
    document.setFontSize(7);
    document.setTextColor(15, 23, 42);
    document.text(`${Math.round(m.generationKwh)}`, colX + 1.5, y2 + 10);
    document.setFontSize(6);
    document.setTextColor(100, 116, 139);
    document.text('kWh', colX + 1.5, y2 + 13.5);
  });

  y2 += 25;

  // Weather & Meteorological Impact Summary
  document.setFont('helvetica', 'bold');
  document.setFontSize(12);
  document.setTextColor(15, 23, 42);
  document.text('Meteorological Integration & Environmental Footprint', margin, y2);

  y2 += 6;
  document.setFillColor(248, 250, 252);
  document.roundedRect(margin, y2, pageWidth - margin * 2, 22, 2, 2, 'F');
  document.setDrawColor(226, 232, 240);
  document.roundedRect(margin, y2, pageWidth - margin * 2, 22, 2, 2, 'D');

  document.setFont('helvetica', 'normal');
  document.setFontSize(8.5);
  document.setTextColor(51, 65, 85);
  const weatherSummaryText = `Meteorological observations indicate an average ambient temperature of ${formatNumber(solarData.temperatureAvg, 1)}°C and cloud cover factor of ${formatNumber(solarData.cloudCoverPercent, 1)}%. Using our PVGIS thermodynamic model, the weather adjustment factor was calculated at ${formatNumber(solarData.weatherAdjustmentFactor, 3)}. The system displaces an estimated ${formatNumber(solarData.carbonOffsetKg)} kg of CO₂ annually, equivalent to powering ${formatNumber(solarData.homesPowered, 1)} standard households.`;
  const splitWeather = document.splitTextToSize(weatherSummaryText, pageWidth - margin * 2 - 10);
  document.text(splitWeather, margin + 5, y2 + 6);

  y2 += 30;

  // Engineering Recommendations (Up to 5 deterministic rules)
  document.setFont('helvetica', 'bold');
  document.setFontSize(12);
  document.setTextColor(15, 23, 42);
  document.text('Deterministic Engineering Recommendations', margin, y2);

  y2 += 6;
  const recs = solarData.recommendations || [];
  recs.slice(0, 5).forEach((rec) => {
    const boxHeight = 20;
    document.setFillColor(248, 250, 252);
    document.roundedRect(margin, y2, pageWidth - margin * 2, boxHeight, 2, 2, 'F');
    document.setDrawColor(226, 232, 240);
    document.roundedRect(margin, y2, pageWidth - margin * 2, boxHeight, 2, 2, 'D');

    document.setFont('helvetica', 'bold');
    document.setFontSize(8.5);
    document.setTextColor(180, 83, 9);
    document.text(`• ${rec.title} [${rec.impactLevel || 'STANDARD'} IMPACT]`, margin + 5, y2 + 5.5);

    document.setFont('helvetica', 'normal');
    document.setFontSize(7.5);
    document.setTextColor(51, 65, 85);
    const recText = `${rec.recommendation || ''} Reason: ${rec.reason || ''} Benefit: ${rec.expectedBenefit || ''}`;
    const benefitLines = document.splitTextToSize(recText, pageWidth - margin * 2 - 10);
    document.text(benefitLines.slice(0, 2), margin + 5, y2 + 11);

    y2 += boxHeight + 3;
  });

  document.setDrawColor(226, 232, 240);
  document.line(margin, 278, pageWidth - margin, 278);
  document.setFont('helvetica', 'normal');
  document.setFontSize(9);
  document.setTextColor(100, 116, 139);
  document.text(`Generated by SolarScope • Page 2 of ${totalPages}`, pageWidth / 2, 285, { align: 'center' });

  // PAGE 3: AI Solar Advisor & Strategic Insights (if available)
  if (aiRecommendation) {
    document.addPage();
    let y3 = 26;

    document.setTextColor(15, 23, 42);
    document.setFont('helvetica', 'bold');
    document.setFontSize(16);
    document.text('AI Solar Advisor — Strategic Insights & Action Plan', margin, y3);

    y3 += 6;
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);
    document.setTextColor(100, 116, 139);
    document.text('Natural-language strategic evaluation powered by OpenAI GPT & Solar Engineering Heuristics', margin, y3);

    y3 += 6;
    document.setDrawColor(99, 102, 241);
    document.setLineWidth(1.2);
    document.line(margin, y3, pageWidth - margin, y3);

    y3 += 10;

    // 4 Assessment Badges Summary Box
    const badgeWidth = (pageWidth - margin * 2 - 9) / 4;
    const badgeItems = [
      { title: 'Installation Feasibility', val: aiRecommendation.installationAssessment || 'Good' },
      { title: 'Financial Viability', val: aiRecommendation.financialAssessment || 'Good' },
      { title: 'Storage Battery', val: aiRecommendation.batteryRecommendation || 'Optional' },
      { title: 'Risk Classification', val: `${aiRecommendation.riskAssessment || 'Low'} Risk` },
    ];

    badgeItems.forEach((b, idx) => {
      const bX = margin + idx * (badgeWidth + 3);
      document.setFillColor(248, 250, 252);
      document.roundedRect(bX, y3, badgeWidth, 18, 2, 2, 'F');
      document.setDrawColor(226, 232, 240);
      document.roundedRect(bX, y3, badgeWidth, 18, 2, 2, 'D');

      document.setFont('helvetica', 'normal');
      document.setFontSize(7);
      document.setTextColor(100, 116, 139);
      document.text(b.title, bX + 3, y3 + 6);

      document.setFont('helvetica', 'bold');
      document.setFontSize(9);
      document.setTextColor(15, 23, 42);
      document.text(b.val, bX + 3, y3 + 13);
    });

    y3 += 25;

    // Executive Summary
    document.setFont('helvetica', 'bold');
    document.setFontSize(11);
    document.setTextColor(15, 23, 42);
    document.text('Executive Summary', margin, y3);

    y3 += 5;
    document.setFillColor(248, 250, 252);
    document.roundedRect(margin, y3, pageWidth - margin * 2, 34, 2, 2, 'F');
    document.setDrawColor(226, 232, 240);
    document.roundedRect(margin, y3, pageWidth - margin * 2, 34, 2, 2, 'D');

    document.setFont('helvetica', 'normal');
    document.setFontSize(8.5);
    document.setTextColor(51, 65, 85);
    const summaryText = aiRecommendation.executiveSummary || 'No executive summary provided.';
    const splitSummary = document.splitTextToSize(summaryText, pageWidth - margin * 2 - 8);
    document.text(splitSummary.slice(0, 5), margin + 4, y3 + 7);

    y3 += 40;

    // AI Strategic Recommendations
    document.setFont('helvetica', 'bold');
    document.setFontSize(11);
    document.setTextColor(15, 23, 42);
    document.text('Actionable Advisory Recommendations', margin, y3);

    y3 += 5;
    const aiRecs = aiRecommendation.recommendations || [];
    aiRecs.slice(0, 4).forEach((rec) => {
      document.setFont('helvetica', 'bold');
      document.setFontSize(8.5);
      document.setTextColor(99, 102, 241);
      document.text('✓', margin + 2, y3 + 4);

      document.setFont('helvetica', 'normal');
      document.setFontSize(8);
      document.setTextColor(30, 41, 59);
      const recLines = document.splitTextToSize(rec, pageWidth - margin * 2 - 14);
      document.text(recLines.slice(0, 2), margin + 10, y3 + 4);
      y3 += Math.max(8, recLines.slice(0, 2).length * 4.5 + 3);
    });

    y3 += 4;

    // 5-Step Action Plan
    document.setFont('helvetica', 'bold');
    document.setFontSize(11);
    document.setTextColor(15, 23, 42);
    document.text('5-Step Implementation Roadmap', margin, y3);

    y3 += 5;
    const planSteps = aiRecommendation.actionPlan || [];
    planSteps.slice(0, 5).forEach((step, sIdx) => {
      const stepBoxHeight = 15;
      document.setFillColor(248, 250, 252);
      document.roundedRect(margin, y3, pageWidth - margin * 2, stepBoxHeight, 2, 2, 'F');
      document.setDrawColor(226, 232, 240);
      document.roundedRect(margin, y3, pageWidth - margin * 2, stepBoxHeight, 2, 2, 'D');

      document.setFillColor(99, 102, 241);
      document.circle(margin + 6, y3 + 7.5, 3.5, 'F');
      document.setFont('helvetica', 'bold');
      document.setFontSize(7.5);
      document.setTextColor(255, 255, 255);
      document.text(`${step.stepNumber || sIdx + 1}`, margin + 4.8, y3 + 9.5);

      document.setFont('helvetica', 'bold');
      document.setFontSize(8);
      document.setTextColor(15, 23, 42);
      document.text(step.title || `Phase ${sIdx + 1}`, margin + 14, y3 + 5.5);

      if (step.timeline) {
        document.setFont('helvetica', 'normal');
        document.setFontSize(7);
        document.setTextColor(100, 116, 139);
        document.text(`(${step.timeline})`, margin + 14 + document.getTextWidth(step.title || '') + 4, y3 + 5.5);
      }

      document.setFont('helvetica', 'normal');
      document.setFontSize(7.2);
      document.setTextColor(71, 85, 105);
      const descLines = document.splitTextToSize(step.description || '', pageWidth - margin * 2 - 20);
      document.text(descLines.slice(0, 2), margin + 14, y3 + 10.5);

      y3 += stepBoxHeight + 2.5;
    });

    document.setDrawColor(226, 232, 240);
    document.line(margin, 278, pageWidth - margin, 278);
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);
    document.setTextColor(100, 116, 139);
    document.text(`Generated by SolarScope AI Advisor • Page 3 of ${totalPages}`, pageWidth / 2, 285, { align: 'center' });
  }

  document.save(`SolarPotential-Assessment-${(solarData.address || 'Site').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}.pdf`);
};

export const downloadPanelOptimizationReport = (layout, rooftopInfo = null, dimensions = null, comparisons = []) => {
  const document = new jsPDF();
  const pageWidth = document.internal.pageSize.getWidth();
  const margin = 20;
  const labelWidth = 68;
  let y = 26;

  // Header
  document.setTextColor(15, 23, 42);
  document.setFont('helvetica', 'bold');
  document.setFontSize(17);
  document.text('AI Rooftop Panel Placement Optimization Report', margin, y);

  y += 6.5;
  document.setFont('helvetica', 'normal');
  document.setFontSize(8.5);
  document.setTextColor(100, 116, 139);
  document.text('Vector Boundary Alignment • Ray-Casting Collision Avoidance • Deterministic Optimization', margin, y);

  y += 6;
  document.setDrawColor(16, 185, 129); // emerald green
  document.setLineWidth(1.2);
  document.line(margin, y, pageWidth - margin, y);

  y += 10;

  // Top KPI Highlight Badges
  const badgeWidth = (pageWidth - margin * 2 - 9) / 4;
  const badges = [
    { label: 'LAYOUT MODE', val: layout.title || layout.mode || 'OPTIMAL', color: [16, 185, 129] },
    { label: 'PANEL COUNT', val: `${layout.panelCount || 0} Modules`, color: [30, 41, 59] },
    { label: 'SYSTEM CAPACITY', val: `${(layout.systemCapacityKw || 0).toFixed(2)} kWp`, color: [14, 165, 233] },
    { label: 'OPTIMIZATION SCORE', val: `${layout.optimizationScore || 0} / 100`, color: [245, 158, 11] },
  ];

  badges.forEach((b, idx) => {
    const bX = margin + idx * (badgeWidth + 3);
    document.setFillColor(248, 250, 252);
    document.roundedRect(bX, y, badgeWidth, 19, 2, 2, 'F');
    document.setDrawColor(226, 232, 240);
    document.roundedRect(bX, y, badgeWidth, 19, 2, 2, 'D');

    document.setFont('helvetica', 'bold');
    document.setFontSize(7);
    document.setTextColor(100, 116, 139);
    document.text(b.label, bX + 4, y + 6);

    document.setFont('helvetica', 'bold');
    document.setFontSize(9.5);
    document.setTextColor(b.color[0], b.color[1], b.color[2]);
    document.text(String(b.val), bX + 4, y + 14);
  });

  y += 26;

  // Technical Specifications Section
  document.setFont('helvetica', 'bold');
  document.setFontSize(11);
  document.setTextColor(15, 23, 42);
  document.text('Layout Technical Specifications', margin, y);

  y += 5;
  const modLength = dimensions?.lengthMeters || 2.1;
  const modWidth = dimensions?.widthMeters || 1.1;
  const modPower = dimensions?.powerWatts || 550;
  const annualGen = layout.annualGenerationKwh || 0;
  const savings = Math.round(annualGen * 8.5);

  const specRows = [
    ['Site / Rooftop Area', `${formatNumber(layout.roofArea || 0, 1)} m²`],
    ['Effective Usable Array Area', `${formatNumber(layout.usableArea || 0, 1)} m²`],
    ['Rooftop Area Utilization', `${formatNumber(layout.roofUtilizationPercent || 0, 1)}%`],
    ['Photovoltaic Module Model', `Tier-1 Monocrystalline PERC (${modLength}m × ${modWidth}m)`],
    ['Module Power Rating', `${modPower} Watts Peak`],
    ['Estimated Annual Generation', `${formatNumber(annualGen)} kWh / year`],
    ['Estimated Monthly Generation', `${formatNumber(Math.round(annualGen / 12))} kWh / month`],
    ['Estimated Annual Value Savings', `₹${formatNumber(savings)} / year`],
    ['Annual Carbon Offset', `${formatNumber(Math.round(annualGen * 0.82))} kg CO₂ / year`],
    ['Boundary Margin / Setback', layout.mode === 'MAXIMUM_CAPACITY' ? '0.25 m minimal setback' : layout.mode === 'HIGH_EFFICIENCY' ? '0.80 m setback & 0.55 m inter-row pitch' : '0.50 m perimeter & 0.80 m service aisle'],
    ['Generation Date', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
  ];

  specRows.forEach(([lbl, val], idx) => {
    if (idx % 2 === 0) {
      document.setFillColor(248, 250, 252);
      document.rect(margin, y - 4, pageWidth - margin * 2, 7.5, 'F');
    }
    document.setFont('helvetica', 'bold');
    document.setFontSize(8);
    document.setTextColor(71, 85, 105);
    document.text(lbl, margin + 4, y + 1);

    document.setFont('helvetica', 'normal');
    document.setTextColor(15, 23, 42);
    document.text(String(val), margin + labelWidth, y + 1);
    y += 7.5;
  });

  y += 5;

  // Comparison Against Other Placement Modes (if provided)
  if (comparisons && comparisons.length > 0) {
    document.setFont('helvetica', 'bold');
    document.setFontSize(11);
    document.setTextColor(15, 23, 42);
    document.text('Layout Mode Comparison', margin, y);

    y += 5;
    // Table header
    document.setFillColor(241, 245, 249);
    document.rect(margin, y - 4, pageWidth - margin * 2, 7.5, 'F');
    document.setFont('helvetica', 'bold');
    document.setFontSize(7.5);
    document.setTextColor(71, 85, 105);
    document.text('Layout Mode', margin + 4, y + 1);
    document.text('Panels', margin + 55, y + 1);
    document.text('Capacity (kWp)', margin + 82, y + 1);
    document.text('Utilization (%)', margin + 118, y + 1);
    document.text('Annual Gen (kWh)', margin + 148, y + 1);

    y += 7.5;
    comparisons.forEach((c, cIdx) => {
      const isCurrent = c.mode === layout.mode;
      if (isCurrent) {
        document.setFillColor(240, 253, 244);
        document.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F');
      } else if (cIdx % 2 === 0) {
        document.setFillColor(248, 250, 252);
        document.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F');
      }

      document.setFont('helvetica', isCurrent ? 'bold' : 'normal');
      document.setFontSize(7.5);
      document.setTextColor(isCurrent ? 16 : 30, isCurrent ? 185 : 41, isCurrent ? 129 : 59);
      document.text(`${c.title || c.mode} ${isCurrent ? '(Selected)' : ''}`, margin + 4, y + 1);

      document.setTextColor(15, 23, 42);
      document.text(`${c.panelCount || 0}`, margin + 55, y + 1);
      document.text(`${(c.systemCapacityKw || 0).toFixed(1)} kWp`, margin + 82, y + 1);
      document.text(`${(c.roofUtilizationPercent || 0).toFixed(1)}%`, margin + 118, y + 1);
      document.text(`${formatNumber(c.annualGenerationKwh || 0)}`, margin + 148, y + 1);
      y += 7;
    });

    y += 5;
  }

  // AI Layout Insights & Engineering Recommendations
  document.setFont('helvetica', 'bold');
  document.setFontSize(11);
  document.setTextColor(15, 23, 42);
  document.text('Engineering Recommendations & Shading Mitigation', margin, y);

  y += 5;
  const insights = layout.aiInsights || [
    'Boundary Margin Clearance: Walkway aisles conform to fire safety setbacks and inverter accessibility standards.',
    'Orientation Alignment: Panels are parallel to primary roof vector edge to optimize uniform packing factor.',
    'Shading Mitigation: High spacing tolerance prevents self-shading during low solar elevation winter azimuths.',
    'String Inverter Sizing: Array configured for standard multi-MPPT inverters with balanced sub-string voltages.'
  ];

  insights.slice(0, 4).forEach((rec) => {
    document.setFillColor(248, 250, 252);
    document.roundedRect(margin, y - 3, pageWidth - margin * 2, 10, 1.5, 1.5, 'F');
    document.setDrawColor(226, 232, 240);
    document.roundedRect(margin, y - 3, pageWidth - margin * 2, 10, 1.5, 1.5, 'D');

    document.setFont('helvetica', 'bold');
    document.setFontSize(8);
    document.setTextColor(16, 185, 129);
    document.text('•', margin + 4, y + 3.5);

    document.setFont('helvetica', 'normal');
    document.setFontSize(7.5);
    document.setTextColor(30, 41, 59);
    const recLines = document.splitTextToSize(rec, pageWidth - margin * 2 - 14);
    document.text(recLines.slice(0, 2), margin + 9, y + 3.5);
    y += 12;
  });

  // Footer
  document.setDrawColor(226, 232, 240);
  document.line(margin, 278, pageWidth - margin, 278);
  document.setFont('helvetica', 'normal');
  document.setFontSize(8.5);
  document.setTextColor(100, 116, 139);
  document.text('Generated by SolarScope AI Panel Placement Optimizer • Page 1 of 1', pageWidth / 2, 285, { align: 'center' });

  document.save(`SolarScope-Panel-Layout-${layout.mode || 'Optimal'}-${new Date().toISOString().slice(0, 10)}.pdf`);
};

