package com.mpc.email.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.mpc.analysis.domain.Analysis;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;

@Service
public class PdfGenerationService {

    private final NumberFormat numberFormat = NumberFormat.getNumberInstance(new Locale("en", "IN"));

    public byte[] generateAnalysisPdf(Analysis analysis) {
        return generateAnalysisPdf(analysis, "en");
    }

    public byte[] generateAnalysisPdf(Analysis analysis, String language) {
        String lang = normalizeLanguage(language);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Header Banner Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(15, 23, 42));
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(100, 116, 139));
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(71, 85, 105));
            Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(15, 23, 42));

            String title = getTitle(lang);
            Paragraph pTitle = new Paragraph(title, titleFont);
            pTitle.setSpacingAfter(3);
            document.add(pTitle);

            String formattedDate = analysis.getCreatedAt() != null
                    ? DateTimeFormatter.ofPattern("dd MMMM yyyy, HH:mm").withZone(ZoneId.of("Asia/Kolkata")).format(analysis.getCreatedAt())
                    : "Live Generation";
            String siteName = analysis.getLocationName() != null ? analysis.getLocationName() : "Rooftop Site";
            String dateLabel = getDateLabel(lang);
            String siteLabel = getSiteLabel(lang);
            Paragraph pSub = new Paragraph(dateLabel + ": " + formattedDate + " • " + siteLabel + ": " + siteName + " • [" + getLangTag(lang) + "]", subtitleFont);
            pSub.setSpacingAfter(15);
            document.add(pSub);

            // Table of Key Analysis Metrics
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(15f);
            table.setWidths(new float[]{1.3f, 1.7f});

            addTableRow(table, getLabel("location", lang), analysis.getLocationName(), labelFont, valFont);
            addTableRow(table, getLabel("coordinates", lang), (analysis.getLatitude() != null && analysis.getLongitude() != null) ? String.format("%.4f, %.4f", analysis.getLatitude(), analysis.getLongitude()) : "N/A", labelFont, valFont);
            addTableRow(table, getLabel("roofArea", lang), format(analysis.getRoofArea()) + " m²", labelFont, valFont);
            addTableRow(table, getLabel("usableArea", lang), format(analysis.getUsableArea()) + " m²", labelFont, valFont);
            addTableRow(table, getLabel("panels", lang), format(analysis.getEstimatedPanels()) + " Modules (400W Mono PERC)", labelFont, valFont);
            addTableRow(table, getLabel("systemSize", lang), format(analysis.getSystemSize()) + " kWp", labelFont, valFont);
            addTableRow(table, getLabel("monthlyGen", lang), format(analysis.getMonthlyGeneration()) + " kWh / month", labelFont, valFont);
            addTableRow(table, getLabel("annualGen", lang), format(analysis.getAnnualGeneration()) + " kWh / year", labelFont, valFont);
            addTableRow(table, getLabel("cost", lang), "INR " + format(analysis.getInstallationCost()), labelFont, valFont);
            addTableRow(table, getLabel("savings", lang), "INR " + format(analysis.getAnnualSavings()) + " / year", labelFont, valFont);
            addTableRow(table, getLabel("roi", lang), format(analysis.getRoi()) + " %", labelFont, valFont);
            addTableRow(table, getLabel("payback", lang), format(analysis.getPaybackPeriod()) + " Years", labelFont, valFont);
            addTableRow(table, getLabel("weather", lang), (analysis.getWeatherAdjustment() != null && analysis.getWeatherAdjustment() > 0 ? "+" : "") + format(analysis.getWeatherAdjustment()) + "%", labelFont, valFont);
            addTableRow(table, getLabel("battery", lang), format(analysis.getBatteryRecommendation()) + " kWh (LiFePO4 / LFP)", labelFont, valFont);
            addTableRow(table, getLabel("co2", lang), format(analysis.getCo2Reduction()) + " kg CO2 / year", labelFont, valFont);

            document.add(table);

            // Footer Note
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, new Color(148, 163, 184));
            String footerText = getFooter(lang);
            Paragraph pFooter = new Paragraph(footerText, footerFont);
            pFooter.setAlignment(Element.ALIGN_CENTER);
            document.add(pFooter);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report: " + e.getMessage(), e);
        }
    }

    private String normalizeLanguage(String lang) {
        if (lang == null) return "en";
        String lower = lang.toLowerCase().trim();
        return switch (lower) {
            case "hi", "hindi" -> "hi";
            case "mr", "marathi" -> "mr";
            case "kn", "kannada" -> "kn";
            default -> "en";
        };
    }

    private String getTitle(String lang) {
        return switch (lang) {
            case "hi" -> "SolarSaaS Feasibility Analysis Report (सौर विश्लेषण अहवाल)";
            case "mr" -> "SolarSaaS Feasibility Analysis Report (सौर व्यवहार्यता अहवाल)";
            case "kn" -> "SolarSaaS Feasibility Analysis Report (ಸೌರ ವಿಶ್ಲೇಷಣಾ ವರದಿ)";
            default -> "SolarSaaS Feasibility Analysis Report";
        };
    }

    private String getDateLabel(String lang) {
        return switch (lang) {
            case "hi" -> "Generated on / निर्माण तिथि";
            case "mr" -> "Generated on / निर्मिती दिनांक";
            case "kn" -> "Generated on / ದಿನಾಂಕ";
            default -> "Generated on";
        };
    }

    private String getSiteLabel(String lang) {
        return switch (lang) {
            case "hi" -> "Site / स्थल";
            case "mr" -> "Site / ठिकाण";
            case "kn" -> "Site / ಸ್ಥಳ";
            default -> "Site";
        };
    }

    private String getLangTag(String lang) {
        return switch (lang) {
            case "hi" -> "Language: हिन्दी (HI)";
            case "mr" -> "Language: मराठी (MR)";
            case "kn" -> "Language: ಕನ್ನಡ (KN)";
            default -> "Language: English (EN)";
        };
    }

    private String getFooter(String lang) {
        return switch (lang) {
            case "hi" -> "Engineered by SolarSaaS Enterprise Platform • NASA POWER & Open-Meteo Satellite Microclimate Analytics • स्वच्छ ऊर्जा तंत्रज्ञान";
            case "mr" -> "Engineered by SolarSaaS Enterprise Platform • NASA POWER & Open-Meteo Satellite Microclimate Analytics • सौर ऊर्जा तंत्रज्ञान";
            case "kn" -> "Engineered by SolarSaaS Enterprise Platform • NASA POWER & Open-Meteo Satellite Microclimate Analytics • ಸೌರ ಶಕ್ತಿ ತಂತ್ರಜ್ಞಾನ";
            default -> "Engineered by SolarSaaS Enterprise Platform • NASA POWER & Open-Meteo Satellite Microclimate Analytics";
        };
    }

    private String getLabel(String key, String lang) {
        return switch (key) {
            case "location" -> switch (lang) {
                case "hi" -> "Location (स्थान)";
                case "mr" -> "Location (स्थान / पत्ता)";
                case "kn" -> "Location (ಸ್ಥಳ)";
                default -> "Location";
            };
            case "coordinates" -> switch (lang) {
                case "hi" -> "Coordinates (भौगोलिक निर्देशांक)";
                case "mr" -> "Coordinates (अक्षांश-रेखांश)";
                case "kn" -> "Coordinates (ನಿರ್ದೇಶಾಂಕಗಳು)";
                default -> "Coordinates";
            };
            case "roofArea" -> switch (lang) {
                case "hi" -> "Total Roof Area (कुल छत क्षेत्रफल)";
                case "mr" -> "Total Roof Area (एकूण छताचे क्षेत्रफळ)";
                case "kn" -> "Total Roof Area (ಒಟ್ಟು ಛಾವಣಿ ವಿಸ್ತೀರ್ಣ)";
                default -> "Total Roof Area";
            };
            case "usableArea" -> switch (lang) {
                case "hi" -> "Usable Roof Area (उपयोगी छत क्षेत्रफल)";
                case "mr" -> "Usable Roof Area (वापरण्यायोग्य क्षेत्रफळ)";
                case "kn" -> "Usable Roof Area (ಬಳಸಬಹುದಾದ ವಿಸ್ತೀರ್ಣ)";
                default -> "Usable Roof Area";
            };
            case "panels" -> switch (lang) {
                case "hi" -> "Estimated Panel Count (अनुमानित पैनल संख्या)";
                case "mr" -> "Estimated Panel Count (अंदाजे पॅनेल संख्या)";
                case "kn" -> "Estimated Panel Count (ಅಂದಾಜು ಫಲಕಗಳ ಸಂಖ್ಯೆ)";
                default -> "Estimated Panel Count";
            };
            case "systemSize" -> switch (lang) {
                case "hi" -> "System Size (सौर प्रणाली क्षमता)";
                case "mr" -> "System Size (प्रणाली क्षमता kWp)";
                case "kn" -> "System Size (ಸೌರ ಸಿಸ್ಟಮ್ ಸಾಮರ್ಥ್ಯ)";
                default -> "System Size";
            };
            case "monthlyGen" -> switch (lang) {
                case "hi" -> "Monthly Generation (मासिक ऊर्जा उत्पादन)";
                case "mr" -> "Monthly Generation (मासिक ऊर्जा निर्मिती)";
                case "kn" -> "Monthly Generation (ಮಾಸಿಕ ಉತ್ಪಾದನೆ)";
                default -> "Monthly Solar Generation";
            };
            case "annualGen" -> switch (lang) {
                case "hi" -> "Annual Generation (वार्षिक ऊर्जा उत्पादन)";
                case "mr" -> "Annual Generation (वार्षिक ऊर्जा निर्मिती)";
                case "kn" -> "Annual Generation (ವಾರ್ಷಿಕ ಉತ್ಪಾದನೆ)";
                default -> "Annual Solar Generation";
            };
            case "cost" -> switch (lang) {
                case "hi" -> "Installation Cost (स्थापना पूंजीगत लागत)";
                case "mr" -> "Installation Cost (प्रकल्प खर्च)";
                case "kn" -> "Installation Cost (ಅನುಸ್ಥಾಪನಾ ವೆಚ್ಚ)";
                default -> "Installation Capital Cost";
            };
            case "savings" -> switch (lang) {
                case "hi" -> "Annual Electricity Savings (वार्षिक बिजली बचत)";
                case "mr" -> "Annual Electricity Savings (वार्षिक वीज बचत)";
                case "kn" -> "Annual Electricity Savings (ವಾರ್ಷಿಕ ವಿದ್ಯುತ್ ಉಳಿತಾಯ)";
                default -> "Annual Electricity Savings";
            };
            case "roi" -> switch (lang) {
                case "hi" -> "Projected ROI (अनुमानित प्रतिलाभ दर)";
                case "mr" -> "Projected ROI (परतावा दर)";
                case "kn" -> "Projected ROI (ನಿರೀಕ್ಷಿತ ಆದಾಯ ದರ)";
                default -> "Projected ROI";
            };
            case "payback" -> switch (lang) {
                case "hi" -> "Payback Period (लागत वसूली समय)";
                case "mr" -> "Payback Period (परतफेड कालावधी)";
                case "kn" -> "Payback Period (ಮರುಪಾವತಿ ಅವಧಿ)";
                default -> "Payback Period";
            };
            case "weather" -> switch (lang) {
                case "hi" -> "Weather Microclimate Factor (मौसम विकिरण प्रभाव)";
                case "mr" -> "Weather Microclimate Factor (हवामान विकिरण घटक)";
                case "kn" -> "Weather Microclimate Factor (ಹವಾಮಾನ ಅಂಶ)";
                default -> "Weather Microclimate Factor";
            };
            case "battery" -> switch (lang) {
                case "hi" -> "Recommended Battery Storage (अनुशंसित बैटरी बैकअप)";
                case "mr" -> "Recommended Battery Storage (शिफारस केलेली बॅटरी)";
                case "kn" -> "Recommended Battery Storage (ಶಿಫಾರಸು ಮಾಡಿದ ಬ್ಯಾಟರಿ)";
                default -> "Recommended Battery Storage";
            };
            case "co2" -> switch (lang) {
                case "hi" -> "Annual CO2 Avoidance (वार्षिक कार्बन कमी)";
                case "mr" -> "Annual CO2 Avoidance (कार्बन उत्सर्जन घट)";
                case "kn" -> "Annual CO2 Avoidance (ಕಾರ್ಬನ್ ಕಡಿತ)";
                default -> "Annual CO2 Avoidance";
            };
            default -> key;
        };
    }

    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setBackgroundColor(new Color(248, 250, 252));
        c1.setPadding(6);
        c1.setBorderColor(new Color(226, 232, 240));

        PdfPCell c2 = new PdfPCell(new Phrase(value != null ? value : "-", valFont));
        c2.setPadding(6);
        c2.setBorderColor(new Color(226, 232, 240));

        table.addCell(c1);
        table.addCell(c2);
    }

    private String format(Object num) {
        if (num == null) return "-";
        if (num instanceof Number) {
            return numberFormat.format(num);
        }
        return num.toString();
    }
}
