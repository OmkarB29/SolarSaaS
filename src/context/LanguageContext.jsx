import React, { createContext, useContext, useState, useEffect } from 'react';
import { userSettingsService } from '../services/userSettingsService';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

const TRANSLATIONS = {
  en: {
    // Nav & Common
    appName: 'SolarScope',
    dashboard: 'Dashboard',
    mapSelection: 'Map Selection',
    analysis: 'Analysis',
    solarPotential: 'Solar Potential',
    panelOptimizer: 'AI Panel Optimizer',
    model3D: '3D Model View',
    history: 'History',
    myProposals: 'My Proposals',
    reports: 'Reports',
    settings: 'Settings',
    adminPortal: 'Admin Portal',
    adminDashboard: 'Admin Dashboard',
    adminUsers: 'Admin Users',
    adminAnalyses: 'Admin Analyses',
    adminReports: 'Admin Reports',
    adminAnalytics: 'Admin Analytics',
    logout: 'Logout',
    searchPlaceholder: 'Search projects, locations, or reports...',
    roleAdmin: 'Administrator',
    roleUser: 'Standard User',
    language: 'Language',
    preferredLanguage: 'Preferred Language',

    // Dashboard
    projectOverview: 'Project Overview',
    projectSubtitle: 'Clean Energy Photovoltaic Feasibility & Financial Analytics',
    generateReport: 'Generate Report',
    totalAnalyses: 'Total Analyses',
    savedRooftopModels: 'Saved rooftop models',
    totalProposals: 'Total Proposals',
    commercialProposals: 'Commercial proposals',
    reportsGenerated: 'Reports Generated',
    pdfFeasibilityDocs: 'PDF feasibility docs',
    emailsSent: 'Emails Sent',
    dispatchedToInbox: 'Dispatched to inbox',
    estMonthlyEnergy: 'Est. Monthly Energy',
    installationCost: 'Installation Cost',
    projectedRoi: 'Projected ROI',
    paybackPeriod: 'Payback Period',
    co2Reduction: 'CO₂ Reduction',
    monthlyEnergyGeneration: 'Monthly Energy Generation',
    savingsOverTime: 'Savings Over Time',
    roiGrowthTrajectory: 'ROI Growth Trajectory',
    runAnalysisFirst: 'Please run an analysis first.',
    weatherForecast: '10-Day Solar Energy & Weather Forecast',
    batteryPlanner: 'Battery Storage Planner & Deficit Prediction',

    // Reports page
    reportsTitle: 'Reports & Solar Assessments',
    reportsSubtitle: 'Export, download, and email official feasibility reports and financial projections',
    tabFeasibilityReports: 'Feasibility Reports',
    tabSolarAssessments: 'Solar Assessments',
    tabEmailHistory: 'Email Delivery History',
    downloadPdf: 'Download PDF',
    resendEmail: 'Re-send Email',
    delete: 'Delete',
    reportName: 'Report Name',
    generatedDate: 'Generated Date',
    format: 'Format',
    status: 'Status',
    actions: 'Actions',
    sent: 'SENT',
    failed: 'FAILED',
    disabled: 'DISABLED',
    pending: 'PENDING',
    noReportsYet: 'No feasibility reports generated yet.',
    noAssessmentsYet: 'No satellite solar assessments saved yet.',
    noEmailHistoryYet: 'No report emails have been dispatched yet.',
    recipient: 'Recipient',
    subject: 'Subject',
    sentAt: 'Sent At',
    details: 'Details',
    successResent: 'Report email re-sent successfully!',
    successDeleted: 'Report deleted successfully.',

    // Settings page
    settingsTitle: 'Settings & Preferences',
    settingsSubtitle: 'Manage your profile, language, regional parameters, and email preferences',
    tabProfile: 'Profile',
    tabPreferences: 'Preferences',
    tabOrganization: 'Organization',
    tabBilling: 'Plan & Billing',
    tabRegional: 'Regional & Constants',
    tabSecurity: 'Security',
    autoEmailTitle: 'Auto-email Feasibility Reports',
    autoEmailDesc: 'Automatically send a detailed PDF feasibility report whenever a solar assessment is saved.',
    languageSelectLabel: 'System & Report Language',
    languageSelectDesc: 'Select your preferred language for the UI, PDF downloads, and automated email reports.',
    saveSettings: 'Save Settings',
    settingsSaved: 'Settings saved successfully!',

    // Metrics
    systemSize: 'System Size',
    roofArea: 'Roof Area',
    usableArea: 'Usable Area',
    annualGeneration: 'Annual Generation',
    annualSavings: 'Annual Savings',
    roi: 'Projected ROI',
    batteryStorage: 'Recommended Battery',
  },

  hi: {
    // Nav & Common
    appName: 'SolarScope',
    dashboard: 'डैशबोर्ड',
    mapSelection: 'मानचित्र चयन',
    analysis: 'सौर विश्लेषण',
    solarPotential: 'सौर क्षमता',
    panelOptimizer: 'AI पैनल ऑप्टिमाइज़र',
    model3D: '3D मॉडल दृश्य',
    history: 'इतिहास',
    myProposals: 'मेरे प्रस्ताव',
    reports: 'रिपोर्ट और दस्तावेज़',
    settings: 'सेटिंग्स',
    adminPortal: 'व्यवस्थापक पोर्टल',
    adminDashboard: 'व्यवस्थापक डैशबोर्ड',
    adminUsers: 'उपयोगकर्ता सूची',
    adminAnalyses: 'सभी विश्लेषण',
    adminReports: 'सभी रिपोर्ट',
    adminAnalytics: 'एनालिटिक्स',
    logout: 'लॉग आउट',
    searchPlaceholder: 'परियोजनाएं, स्थान या रिपोर्ट खोजें...',
    roleAdmin: 'व्यवस्थापक (Admin)',
    roleUser: 'मानक उपयोगकर्ता',
    language: 'भाषा',
    preferredLanguage: 'पसंदीदा भाषा',

    // Dashboard
    projectOverview: 'प्रोजेक्ट अवलोकन',
    projectSubtitle: 'स्वच्छ ऊर्जा फोटोवोल्टिक व्यवहार्यता और वित्तीय विश्लेषण',
    generateReport: 'रिपोर्ट तैयार करें',
    totalAnalyses: 'कुल विश्लेषण',
    savedRooftopModels: 'सहेजे गए रूफटॉप मॉडल',
    totalProposals: 'कुल प्रस्ताव',
    commercialProposals: 'व्यावसायिक प्रस्ताव',
    reportsGenerated: 'तैयार की गई रिपोर्ट',
    pdfFeasibilityDocs: 'PDF व्यवहार्यता दस्तावेज',
    emailsSent: 'भेजे गए ईमेल',
    dispatchedToInbox: 'इनबॉक्स में प्रेषित',
    estMonthlyEnergy: 'अनुमानित मासिक ऊर्जा',
    installationCost: 'स्थापना लागत',
    projectedRoi: 'अनुमानित प्रतिलाभ (ROI)',
    paybackPeriod: 'लागत वसूली समय',
    co2Reduction: 'CO₂ उत्सर्जन कमी',
    monthlyEnergyGeneration: 'मासिक सौर ऊर्जा उत्पादन',
    savingsOverTime: 'समय के साथ संचयी बचत',
    roiGrowthTrajectory: 'ROI विकास प्रक्षेपवक्र',
    runAnalysisFirst: 'कृपया पहले एक विश्लेषण चलाएं।',
    weatherForecast: '10-दिवसीय सौर ऊर्जा और मौसम का पूर्वानुमान',
    batteryPlanner: 'बैटरी स्टोरेज योजना और कमी शमन',

    // Reports page
    reportsTitle: 'रिपोर्ट और सौर मूल्यांकन',
    reportsSubtitle: 'आधिकारिक सौर व्यवहार्यता रिपोर्ट डाउनलोड करें और अपनी पसंदीदा भाषा में ईमेल भेजें',
    tabFeasibilityReports: 'व्यवहार्यता रिपोर्ट',
    tabSolarAssessments: 'सौर मूल्यांकन',
    tabEmailHistory: 'ईमेल वितरण इतिहास',
    downloadPdf: 'PDF डाउनलोड करें',
    resendEmail: 'ईमेल पुनः भेजें',
    delete: 'हटाएं',
    reportName: 'रिपोर्ट का नाम',
    generatedDate: 'निर्माण तिथि',
    format: 'प्रारूप',
    status: 'स्थिति',
    actions: 'कार्रवाई',
    sent: 'भेजा गया (SENT)',
    failed: 'विफल (FAILED)',
    disabled: 'अक्षम (DISABLED)',
    pending: 'प्रतीक्षारत (PENDING)',
    noReportsYet: 'अभी तक कोई व्यवहार्यता रिपोर्ट तैयार नहीं की गई है।',
    noAssessmentsYet: 'अभी तक कोई सौर मूल्यांकन सहेजा नहीं गया है।',
    noEmailHistoryYet: 'अभी तक कोई रिपोर्ट ईमेल नहीं भेजी गई है।',
    recipient: 'प्राप्तकर्ता',
    subject: 'विषय',
    sentAt: 'भेजने का समय',
    details: 'विवरण',
    successResent: 'रिपोर्ट आपकी ईमेल पर सफलतापूर्वक पुनः भेजी गई!',
    successDeleted: 'रिपोर्ट सफलतापूर्वक हटाई गई।',

    // Settings page
    settingsTitle: 'सेटिंग्स और प्राथमिकताएं',
    settingsSubtitle: 'अपनी प्रोफ़ाइल, भाषा, क्षेत्रीय सौर पैरामीटर और ईमेल प्राथमिकताएं प्रबंधित करें',
    tabProfile: 'प्रोफ़ाइल',
    tabPreferences: 'प्राथमिकताएं',
    tabOrganization: 'संगठन',
    tabBilling: 'योजना और बिलिंग',
    tabRegional: 'क्षेत्रीय और सौर स्थिरांक',
    tabSecurity: 'सुरक्षा',
    autoEmailTitle: 'स्वचालित ईमेल रिपोर्ट (Auto-email)',
    autoEmailDesc: 'सौर विश्लेषण सहेजते ही स्वचालित रूप से चुनी गई भाषा में PDF रिपोर्ट ईमेल करें।',
    languageSelectLabel: 'सिस्टम और रिपोर्ट भाषा',
    languageSelectDesc: 'UI, डाउनलोड की जाने वाली PDF और स्वचालित ईमेल के लिए अपनी पसंदीदा भाषा चुनें।',
    saveSettings: 'सेटिंग्स सहेजें',
    settingsSaved: 'सेटिंग्स सफलतापूर्वक सहेजी गईं!',

    // Metrics
    systemSize: 'सिस्टम क्षमता',
    roofArea: 'छत का क्षेत्रफल',
    usableArea: 'उपयोगी क्षेत्रफल',
    annualGeneration: 'वार्षिक सौर ऊर्जा',
    annualSavings: 'वार्षिक बचत',
    roi: 'अनुमानित प्रतिलाभ (ROI)',
    batteryStorage: 'अनुशंसित बैटरी बैकअप',
  },

  mr: {
    // Nav & Common
    appName: 'SolarScope',
    dashboard: 'डॅशबोर्ड',
    mapSelection: 'नकाशा निवड',
    analysis: 'सौर विश्लेषण',
    solarPotential: 'सौर क्षमता',
    panelOptimizer: 'AI पॅनेल ऑप्टिमायझर',
    model3D: '3D मॉडेल दृश्य',
    history: 'इतिहास',
    myProposals: 'माझे प्रस्ताव',
    reports: 'अहवाल आणि दस्तऐवज',
    settings: 'सेटिंग्ज',
    adminPortal: 'प्रशासक पोर्टल',
    adminDashboard: 'प्रशासक डॅशबोर्ड',
    adminUsers: 'वापरकर्ते सूची',
    adminAnalyses: 'सर्व विश्लेषणे',
    adminReports: 'सर्व अहवाल',
    adminAnalytics: 'अनालिटिक्स',
    logout: 'बाहेर पडा (Logout)',
    searchPlaceholder: 'प्रकल्प, ठिकाण किंवा अहवाल शोधा...',
    roleAdmin: 'प्रशासक (Admin)',
    roleUser: 'नियमित वापरकर्ता',
    language: 'भाषा',
    preferredLanguage: 'पसंतीची भाषा',

    // Dashboard
    projectOverview: 'प्रकल्प आढावा',
    projectSubtitle: 'स्वच्छ ऊर्जा फोटोव्होल्टेइक व्यवहार्यता आणि आर्थिक विश्लेषण',
    generateReport: 'अहवाल तयार करा',
    totalAnalyses: 'एकूण विश्लेषणे',
    savedRooftopModels: 'जतन केलेले छताचे मॉडेल',
    totalProposals: 'एकूण व्यावसायिक प्रस्ताव',
    commercialProposals: 'व्यावसायिक प्रस्ताव',
    reportsGenerated: 'तयार केलेले अहवाल',
    pdfFeasibilityDocs: 'PDF व्यवहार्यता दस्तऐवज',
    emailsSent: 'पाठवलेले ईमेल',
    dispatchedToInbox: 'इनबॉक्समध्ये पाठवले',
    estMonthlyEnergy: 'अंदाजे मासिक ऊर्जा',
    installationCost: 'एकूण प्रकल्प खर्च',
    projectedRoi: 'अंदाजे परतावा (ROI)',
    paybackPeriod: 'परतफेड कालावधी',
    co2Reduction: 'कार्बन उत्सर्जन घट',
    monthlyEnergyGeneration: 'मासिक सौर ऊर्जा निर्मिती',
    savingsOverTime: 'कालांतराने होणारी बचत',
    roiGrowthTrajectory: 'ROI वाढीचा मार्ग',
    runAnalysisFirst: 'कृपया प्रथम एक विश्लेषण चालवा.',
    weatherForecast: '१० दिवसांचा सौर ऊर्जा आणि हवामान अंदाज',
    batteryPlanner: 'बॅटरी स्टोरेज नियोजन आणि तूट अंदाज',

    // Reports page
    reportsTitle: 'अहवाल आणि सौर मूल्यांकन',
    reportsSubtitle: 'अधिकृत सौर व्यवहार्यता अहवाल डाउनलोड करा आणि आपल्या भाषेत ईमेल प्राप्त करा',
    tabFeasibilityReports: 'व्यवहार्यता अहवाल',
    tabSolarAssessments: 'सौर मूल्यांकन',
    tabEmailHistory: 'ईमेल वितरण इतिहास',
    downloadPdf: 'PDF डाउनलोड करा',
    resendEmail: 'ईमेल पुन्हा पाठवा',
    delete: 'हटवा',
    reportName: 'अहवालाचे नाव',
    generatedDate: 'निर्मिती दिनांक',
    format: 'स्वरूप',
    status: 'स्थिती',
    actions: 'कृती',
    sent: 'पाठवले (SENT)',
    failed: 'अयशस्वी (FAILED)',
    disabled: 'बंद (DISABLED)',
    pending: 'प्रलंबित (PENDING)',
    noReportsYet: 'अद्याप कोणतेही व्यवहार्यता अहवाल तयार केलेले नाहीत.',
    noAssessmentsYet: 'अद्याप कोणतेही सौर मूल्यांकन जतन केलेले नाही.',
    noEmailHistoryYet: 'अद्याप कोणतेही अहवाल ईमेल पाठवले गेलेले नाहीत.',
    recipient: 'प्राप्तकर्ता',
    subject: 'विषय',
    sentAt: 'पाठवल्याची वेळ',
    details: 'तपशील',
    successResent: 'अहवाल आपल्या ईमेलवर यशस्वीरित्या पुन्हा पाठवला गेला!',
    successDeleted: 'अहवाल यशस्वीरित्या हटवला गेला.',

    // Settings page
    settingsTitle: 'सेटिंग्ज आणि प्राधान्ये',
    settingsSubtitle: 'आपले प्रोफाइल, भाषा, प्रादेशिक सौर घटक आणि ईमेल प्राधान्ये व्यवस्थापित करा',
    tabProfile: 'प्रोफाइल',
    tabPreferences: 'प्राधान्ये',
    tabOrganization: 'संस्था / कंपनी',
    tabBilling: 'योजना आणि बिलिंग',
    tabRegional: 'प्रादेशिक आणि सौर घटक',
    tabSecurity: 'सुरक्षा',
    autoEmailTitle: 'स्वयंचलित ईमेल अहवाल (Auto-email)',
    autoEmailDesc: 'सौर मूल्यांकन जतन केल्यावर निवडलेल्या भाषेत PDF अहवाल थेट ईमेलवर मिळवा.',
    languageSelectLabel: 'प्रणाली आणि अहवाल भाषा',
    languageSelectDesc: 'UI, डाउनलोड PDF आणि स्वयंचलित ईमेलसाठी आपली पसंतीची भाषा निवडा.',
    saveSettings: 'सेटिंग्ज जतन करा',
    settingsSaved: 'सेटिंग्ज यशस्वीरित्या जतन केल्या!',

    // Metrics
    systemSize: 'प्रणाली क्षमता (kWp)',
    roofArea: 'छताचे क्षेत्रफळ',
    usableArea: 'वापरण्यायोग्य क्षेत्रफळ',
    annualGeneration: 'वार्षिक सौर ऊर्जा निर्मिती',
    annualSavings: 'वार्षिक वीज बचत',
    roi: 'गुंतवणुकीवरील परतावा (ROI)',
    batteryStorage: 'शिफारस केलेली बॅटरी',
  },

  kn: {
    // Nav & Common
    appName: 'SolarScope',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    mapSelection: 'ನಕ್ಷೆ ಆಯ್ಕೆ',
    analysis: 'ಸೌರ ವಿಶ್ಲೇಷಣೆ',
    solarPotential: 'ಸೌರ ಸಾಮರ್ಥ್ಯ',
    panelOptimizer: 'AI ಪ್ಯಾನಲ್ ಆಪ್ಟಿಮೈಜರ್',
    model3D: '3D ಮಾದರಿ ನೋಟ',
    history: 'ಇತಿಹಾಸ',
    myProposals: 'ನನ್ನ ಪ್ರಸ್ತಾವನೆಗಳು',
    reports: 'ವರದಿಗಳು ಮತ್ತು ದಾಖಲೆಗಳು',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    adminPortal: 'ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್',
    adminDashboard: 'ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    adminUsers: 'ಬಳಕೆದಾರರ ಪಟ್ಟಿ',
    adminAnalyses: 'ಎಲ್ಲಾ ವಿಶ್ಲೇಷಣೆಗಳು',
    adminReports: 'ಎಲ್ಲಾ ವರದಿಗಳು',
    adminAnalytics: 'ಅನಾಲಿಟಿಕ್ಸ್',
    logout: 'ಲಾಗ್ ಔಟ್ (Logout)',
    searchPlaceholder: 'ಯೋಜನೆಗಳು, ಸ್ಥಳಗಳು ಅಥವಾ ವರದಿಗಳನ್ನು ಹುಡುಕಿ...',
    roleAdmin: 'ನಿರ್ವಾಹಕ (Admin)',
    roleUser: 'ಪ್ರಮಾಣಿತ ಬಳಕೆದಾರ',
    language: 'ಭಾಷೆ',
    preferredLanguage: 'ಆದ್ಯತೆಯ ಭಾಷೆ',

    // Dashboard
    projectOverview: 'ಯೋಜನೆಯ ಅವಲೋಕನ',
    projectSubtitle: 'ಸ್ವಚ್ಛ ಇಂಧನ ದ್ಯುತಿವಿದ್ಯುಜ್ಜನಕ ಕಾರ್ಯಸಾಧ್ಯತೆ ಮತ್ತು ಹಣಕಾಸು ವಿಶ್ಲೇಷಣೆ',
    generateReport: 'ವರದಿ ರಚಿಸಿ',
    totalAnalyses: 'ಒಟ್ಟು ವಿಶ್ಲೇಷಣೆಗಳು',
    savedRooftopModels: 'ಉಳಿಸಲಾದ ಮಾದರಿಗಳು',
    totalProposals: 'ಒಟ್ಟು ವಾಣಿಜ್ಯ ಪ್ರಸ್ತಾವನೆಗಳು',
    commercialProposals: 'ವಾಣಿಜ್ಯ ಪ್ರಸ್ತಾವನೆಗಳು',
    reportsGenerated: 'ರಚಿಸಲಾದ ವರದಿಗಳು',
    pdfFeasibilityDocs: 'PDF ಕಾರ್ಯಸಾಧ್ಯತಾ ದಾಖಲೆಗಳು',
    emailsSent: 'ಕಳುಹಿಸಲಾದ ಇಮೇಲ್‌ಗಳು',
    dispatchedToInbox: 'ಇನ್‌ಬಾಕ್ಸ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ',
    estMonthlyEnergy: 'ಅಂದಾಜು ಮಾಸಿಕ ಶಕ್ತಿ',
    installationCost: 'ಅನುಸ್ಥಾಪನಾ ವೆಚ್ಚ',
    projectedRoi: 'ನಿರೀಕ್ಷಿತ ಆದಾಯ (ROI)',
    paybackPeriod: 'ಮರುಪಾವತಿ ಅವಧಿ',
    co2Reduction: 'CO₂ ಕಡಿತ',
    monthlyEnergyGeneration: 'ಮಾಸಿಕ ಸೌರ ಉತ್ಪಾದನೆ',
    savingsOverTime: 'ಕಾಲಾನಂತರದಲ್ಲಿ ಉಳಿತಾಯ',
    roiGrowthTrajectory: 'ROI ಬೆಳವಣಿಗೆಯ ಪಥ',
    runAnalysisFirst: 'ದಯವಿಟ್ಟು ಮೊದಲು ವಿಶ್ಲೇಷಣೆಯನ್ನು ಚಲಾಯಿಸಿ.',
    weatherForecast: '10-ದಿನಗಳ ಸೌರ ಶಕ್ತಿ ಮತ್ತು ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ',
    batteryPlanner: 'ಬ್ಯಾಟರಿ ಶೇಖರಣಾ ಯೋಜನೆ ಮತ್ತು ಕೊರತೆಯ ಮುನ್ಸೂಚನೆ',

    // Reports page
    reportsTitle: 'ವರದಿಗಳು ಮತ್ತು ಸೌರ ಮೌಲ್ಯಮಾಪನಗಳು',
    reportsSubtitle: 'ಅಧಿಕೃತ ಸೌರ ಕಾರ್ಯಸಾಧ್ಯತಾ ವರದಿಗಳನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಇಮೇಲ್ ಪಡೆಯಿರಿ',
    tabFeasibilityReports: 'ಕಾರ್ಯಸಾಧ್ಯತಾ ವರದಿಗಳು',
    tabSolarAssessments: 'ಸೌರ ಮೌಲ್ಯಮಾಪನಗಳು',
    tabEmailHistory: 'ಇಮೇಲ್ ವಿತರಣಾ ಇತಿಹಾಸ',
    downloadPdf: 'PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    resendEmail: 'ಇಮೇಲ್ ಮರುಕಳುಹಿಸಿ',
    delete: 'ಅಳಿಸಿ',
    reportName: 'ವರದಿಯ ಹೆಸರು',
    generatedDate: 'ರಚಿಸಲಾದ ದಿನಾಂಕ',
    format: 'ಸ್ವರೂಪ',
    status: 'ಸ್ಥಿತಿ',
    actions: 'ಕ್ರಮಗಳು',
    sent: 'ಕಳುಹಿಸಲಾಗಿದೆ (SENT)',
    failed: 'ವಿಫಲವಾಗಿದೆ (FAILED)',
    disabled: 'ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ (DISABLED)',
    pending: 'ಬಾಕಿ ಉಳಿದಿದೆ (PENDING)',
    noReportsYet: 'ಇನ್ನೂ ಯಾವುದೇ ಕಾರ್ಯಸಾಧ್ಯತಾ ವರದಿಗಳು ರಚನೆಯಾಗಿಲ್ಲ.',
    noAssessmentsYet: 'ಇನ್ನೂ ಯಾವುದೇ ಸೌರ ಮೌಲ್ಯಮಾಪನಗಳನ್ನು ಉಳಿಸಲಾಗಿಲ್ಲ.',
    noEmailHistoryYet: 'ಇನ್ನೂ ಯಾವುದೇ ವರದಿ ಇಮೇಲ್‌ಗಳನ್ನು ಕಳುಹಿಸಲಾಗಿಲ್ಲ.',
    recipient: 'ಸ್ವೀಕರಿಸುವವರು',
    subject: 'ವಿಷಯ',
    sentAt: 'ಕಳುಹಿಸಿದ ಸಮಯ',
    details: 'ವಿವರಗಳು',
    successResent: 'ವರದಿಯನ್ನು ನಿಮ್ಮ ಇಮೇಲ್‌ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಮರುಕಳುಹಿಸಲಾಗಿದೆ!',
    successDeleted: 'ವರದಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.',

    // Settings page
    settingsTitle: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಮತ್ತು ಆದ್ಯತೆಗಳು',
    settingsSubtitle: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್, ಭಾಷೆ, ಪ್ರಾದೇಶಿಕ ಸೌರ ನಿಯತಾಂಕಗಳು ಮತ್ತು ಇಮೇಲ್ ಆದ್ಯತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    tabProfile: 'ಪ್ರೊಫೈಲ್',
    tabPreferences: 'ಆದ್ಯತೆಗಳು',
    tabOrganization: 'ಸಂಸ್ಥೆ / ಕಂಪನಿ',
    tabBilling: 'ಯೋಜನೆ ಮತ್ತು ಬಿಲ್ಲಿಂಗ್',
    tabRegional: 'ಪ್ರಾದೇಶಿಕ ಮತ್ತು ಸೌರ ಸ್ಥಿರಾಂಕಗಳು',
    tabSecurity: 'ಭದ್ರತೆ',
    autoEmailTitle: 'ಸ್ವಯಂಚಾಲಿತ ಇಮೇಲ್ ವರದಿಗಳು (Auto-email)',
    autoEmailDesc: 'ಸೌರ ಮೌಲ್ಯಮಾಪನವನ್ನು ಉಳಿಸಿದಾಗ ಆಯ್ಕೆಮಾಡಿದ ಭಾಷೆಯಲ್ಲಿ ನೇರವಾಗಿ PDF ವರದಿಯನ್ನು ಇಮೇಲ್ ಮಾಡಿ.',
    languageSelectLabel: 'ಸಿಸ್ಟಮ್ ಮತ್ತು ವರದಿ ಭಾಷೆ',
    languageSelectDesc: 'UI, ಡೌನ್‌ಲೋಡ್ PDF ಮತ್ತು ಸ್ವಯಂಚಾಲಿತ ಇಮೇಲ್‌ಗಳಿಗಾಗಿ ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    saveSettings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ',
    settingsSaved: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!',

    // Metrics
    systemSize: 'ಸಿಸ್ಟಮ್ ಸಾಮರ್ಥ್ಯ (kWp)',
    roofArea: 'ಮೇಲ್ಛಾವಣಿ ವಿಸ್ತೀರ್ಣ',
    usableArea: 'ಬಳಸಬಹುದಾದ ವಿಸ್ತೀರ್ಣ',
    annualGeneration: 'ವಾರ್ಷಿಕ ಸೌರ ಉತ್ಪಾದನೆ',
    annualSavings: 'ವಾರ್ಷಿಕ ಉಳಿತಾಯ',
    roi: 'ನಿರೀಕ್ಷಿತ ಆದಾಯ (ROI)',
    batteryStorage: 'ಶಿಫಾರಸು ಮಾಡಿದ ಬ್ಯಾಟರಿ',
  },
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('solarscope.language') || 'en';
    } catch {
      return 'en';
    }
  });

  // Attempt to load preferredLanguage from backend settings on mount
  useEffect(() => {
    userSettingsService.getSettings()
      .then((settings) => {
        if (settings?.preferredLanguage) {
          const lang = settings.preferredLanguage.toLowerCase();
          if (['en', 'hi', 'mr', 'kn'].includes(lang)) {
            setLanguageState(lang);
            localStorage.setItem('solarscope.language', lang);
          }
        }
      })
      .catch(() => {
        // user not logged in or backend unavailable; keep local preference
      });
  }, []);

  const changeLanguage = async (newLang) => {
    if (!['en', 'hi', 'mr', 'kn'].includes(newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem('solarscope.language', newLang);
      // Persist to backend user profile if authenticated
      await userSettingsService.updateSettings({ preferredLanguage: newLang }).catch(() => {});
    } catch {
      // storage or network error ignored
    }
  };

  const t = (key, fallback = '') => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict[key] ?? TRANSLATIONS.en[key] ?? fallback ?? key;
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        currentLanguage: currentLangObj,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
