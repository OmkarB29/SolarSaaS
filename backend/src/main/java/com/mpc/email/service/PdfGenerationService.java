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

@Service
public class PdfGenerationService {

    private final NumberFormat numberFormat = NumberFormat.getNumberInstance(new Locale("en", "IN"));

    public byte[] generateAnalysisPdf(Analysis analysis) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Header Banner
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(15, 23, 42));
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(100, 116, 139));
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(15, 23, 42));
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(71, 85, 105));
            Font valFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(15, 23, 42));

            Paragraph pTitle = new Paragraph("SolarSaaS Feasibility Analysis Report", titleFont);
            pTitle.setSpacingAfter(3);
            document.add(pTitle);

            String formattedDate = analysis.getCreatedAt() != null
                    ? DateTimeFormatter.ofPattern("dd MMMM yyyy, HH:mm").withZone(ZoneId.of("Asia/Kolkata")).format(analysis.getCreatedAt())
                    : "Live Generation";
            Paragraph pSub = new Paragraph("Generated on: " + formattedDate + " • Site: " + (analysis.getLocationName() != null ? analysis.getLocationName() : "Rooftop Site"), subtitleFont);
            pSub.setSpacingAfter(15);
            document.add(pSub);

            // Table of Key Analysis Metrics
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(15f);
            table.setWidths(new float[]{1.2f, 1.8f});

            addTableRow(table, "Location", analysis.getLocationName(), labelFont, valFont);
            addTableRow(table, "Coordinates", (analysis.getLatitude() != null && analysis.getLongitude() != null) ? String.format("%.4f, %.4f", analysis.getLatitude(), analysis.getLongitude()) : "N/A", labelFont, valFont);
            addTableRow(table, "Total Roof Area", format(analysis.getRoofArea()) + " m²", labelFont, valFont);
            addTableRow(table, "Usable Roof Area", format(analysis.getUsableArea()) + " m²", labelFont, valFont);
            addTableRow(table, "Estimated Panel Count", format(analysis.getEstimatedPanels()) + " Modules (400W Mono PERC)", labelFont, valFont);
            addTableRow(table, "System Size", format(analysis.getSystemSize()) + " kWp", labelFont, valFont);
            addTableRow(table, "Monthly Solar Generation", format(analysis.getMonthlyGeneration()) + " kWh / month", labelFont, valFont);
            addTableRow(table, "Annual Solar Generation", format(analysis.getAnnualGeneration()) + " kWh / year", labelFont, valFont);
            addTableRow(table, "Installation Capital Cost", "INR " + format(analysis.getInstallationCost()), labelFont, valFont);
            addTableRow(table, "Annual Electricity Savings", "INR " + format(analysis.getAnnualSavings()) + " / year", labelFont, valFont);
            addTableRow(table, "Projected ROI", format(analysis.getRoi()) + " %", labelFont, valFont);
            addTableRow(table, "Payback Period", format(analysis.getPaybackPeriod()) + " Years", labelFont, valFont);
            addTableRow(table, "Weather Microclimate Factor", (analysis.getWeatherAdjustment() != null && analysis.getWeatherAdjustment() > 0 ? "+" : "") + format(analysis.getWeatherAdjustment()) + "%", labelFont, valFont);
            addTableRow(table, "Recommended Battery Storage", format(analysis.getBatteryRecommendation()) + " kWh (LiFePO4 / LFP)", labelFont, valFont);
            addTableRow(table, "Annual CO2 Avoidance", format(analysis.getCo2Reduction()) + " kg CO2 / year", labelFont, valFont);

            document.add(table);

            // Footer Note
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, new Color(148, 163, 184));
            Paragraph pFooter = new Paragraph("Engineered by SolarSaaS Enterprise Platform • NASA POWER & Open-Meteo Satellite Microclimate Analytics", footerFont);
            pFooter.setAlignment(Element.ALIGN_CENTER);
            document.add(pFooter);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report: " + e.getMessage(), e);
        }
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