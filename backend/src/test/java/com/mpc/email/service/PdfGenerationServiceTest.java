package com.mpc.email.service;

import com.mpc.analysis.domain.Analysis;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

public class PdfGenerationServiceTest {

    private final PdfGenerationService pdfGenerationService = new PdfGenerationService();

    @Test
    void testMultilingualPdfGeneration() {
        Analysis analysis = new Analysis();
        analysis.setLocationName("Shivaji Nagar, Pune, Maharashtra");
        analysis.setLatitude(18.5308);
        analysis.setLongitude(73.8475);
        analysis.setRoofArea(180.0);
        analysis.setUsableArea(144.0);
        analysis.setEstimatedPanels(36);
        analysis.setSystemSize(14.4);
        analysis.setMonthlyGeneration(1850.0);
        analysis.setAnnualGeneration(22200.0);
        analysis.setInstallationCost(576000.0);
        analysis.setAnnualSavings(177600.0);
        analysis.setRoi(30.8);
        analysis.setPaybackPeriod(3.2);
        analysis.setBatteryRecommendation(30.0);
        analysis.setCo2Reduction(18200.0);
        analysis.setCreatedAt(Instant.now());

        for (String lang : new String[]{"en", "hi", "mr", "kn"}) {
            byte[] pdfBytes = pdfGenerationService.generateAnalysisPdf(analysis, lang);
            assertNotNull(pdfBytes, "PDF bytes should not be null for lang " + lang);
            assertTrue(pdfBytes.length > 500, "PDF should have content for lang " + lang);
            // Verify PDF magic header %PDF-
            assertEquals('%', (char) pdfBytes[0]);
            assertEquals('P', (char) pdfBytes[1]);
            assertEquals('D', (char) pdfBytes[2]);
            assertEquals('F', (char) pdfBytes[3]);
        }
    }
}
