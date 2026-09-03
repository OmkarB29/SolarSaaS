package com.mpc.email.service;

import com.mpc.analysis.domain.Analysis;
import com.mpc.email.domain.EmailHistory;
import com.mpc.email.repository.EmailHistoryRepository;
import com.mpc.report.domain.Report;
import com.mpc.user.domain.User;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.Instant;
import java.util.Locale;
import java.util.Properties;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final EmailHistoryRepository emailHistoryRepository;
    private final PdfGenerationService pdfGenerationService;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:#{environment.MAIL_USERNAME}}")
    private String mailUsername;

    @Value("${spring.mail.password:#{environment.MAIL_PASSWORD}}")
    private String mailPassword;

    private final NumberFormat numberFormat = NumberFormat.getNumberInstance(new Locale("en", "IN"));

    public EmailService(EmailHistoryRepository emailHistoryRepository,
                        PdfGenerationService pdfGenerationService) {
        this.emailHistoryRepository = emailHistoryRepository;
        this.pdfGenerationService = pdfGenerationService;
    }

    public boolean isMailConfigured() {
        return mailUsername != null && !mailUsername.trim().isEmpty() &&
               mailPassword != null && !mailPassword.trim().isEmpty();
    }

    public EmailHistory sendAnalysisReportEmail(User user, Report report, Analysis analysis) {
        String recipientEmail = user.getEmail();
        String subject = "SolarSaaS Solar Analysis Report";
        Instant now = Instant.now();

        if (!isMailConfigured()) {
            String warning = "SMTP credentials not configured in environment (MAIL_USERNAME / MAIL_PASSWORD not set).";
            log.warn("[AUTO-EMAIL] Skipped sending report email to {}: {}", recipientEmail, warning);
            EmailHistory history = new EmailHistory(user, report, recipientEmail, subject, "FAILED", now, warning);
            return emailHistoryRepository.save(history);
        }

        try {
            JavaMailSender mailSender = createMailSender();
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(mailUsername, "SolarSaaS CleanEnergy");
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(buildHtmlBody(user, analysis), true);

            // Generate PDF Attachment
            byte[] pdfBytes = pdfGenerationService.generateAnalysisPdf(analysis);
            String filename = "SolarSaaS-Analysis-Report.pdf";
            helper.addAttachment(filename, new ByteArrayResource(pdfBytes), "application/pdf");

            mailSender.send(mimeMessage);
            log.info("[AUTO-EMAIL] Successfully delivered report email with PDF attachment to {}", recipientEmail);

            EmailHistory history = new EmailHistory(user, report, recipientEmail, subject, "SENT", now, null);
            return emailHistoryRepository.save(history);
        } catch (Exception e) {
            String errorMsg = "Email delivery failed: " + e.getMessage();
            log.error("[AUTO-EMAIL] Failed to send report email to {}: {}", recipientEmail, e.getMessage());
            EmailHistory history = new EmailHistory(user, report, recipientEmail, subject, "FAILED", now, errorMsg);
            return emailHistoryRepository.save(history);
        }
    }

    private JavaMailSender createMailSender() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(mailHost);
        sender.setPort(mailPort);
        sender.setUsername(mailUsername);
        sender.setPassword(mailPassword);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");

        return sender;
    }

    private String buildHtmlBody(User user, Analysis analysis) {
        String name = user.getUsername() != null ? user.getUsername() : "Solar Energy Pro";
        String area = format(analysis.getRoofArea()) + " m² (Usable: " + format(analysis.getUsableArea()) + " m²)";
        String panels = format(analysis.getEstimatedPanels()) + " modules";
        String systemSize = format(analysis.getSystemSize()) + " kWp";
        String generation = format(analysis.getAnnualGeneration()) + " kWh / year (" + format(analysis.getMonthlyGeneration()) + " kWh/mo)";
        String savings = "INR " + format(analysis.getAnnualSavings()) + " / year";
        String roi = format(analysis.getRoi()) + "% (Payback ~" + format(analysis.getPaybackPeriod()) + " yrs)";
        String weather = (analysis.getWeatherAdjustment() != null && analysis.getWeatherAdjustment() > 0 ? "+" : "") + format(analysis.getWeatherAdjustment()) + "% microclimate irradiance adjustment";
        String battery = format(analysis.getBatteryRecommendation()) + " kWh LiFePO4 storage pack recommended";

        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
                .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 22px; color: #f59e0b; }
                .content { padding: 24px; }
                .metric-box { background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
                .metric-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
                .metric-label { color: #64748b; font-size: 13px; }
                .metric-val { font-weight: 600; color: #0f172a; font-size: 13px; text-align: right; }
                .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>SolarSaaS Solar Analysis Report</h1>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Automated Feasibility & Economic Appraisal</p>
                </div>
                <div class="content">
                  <p>Hello <strong>%s</strong>,</p>
                  <p>Your latest rooftop solar analysis has been processed. Below is a summary of your system design and financial projections:</p>
                  
                  <div class="metric-box">
                    <div class="metric-row"><span class="metric-label">Rooftop Area:</span><span class="metric-val">%s</span></div>
                    <div class="metric-row"><span class="metric-label">Panel Count:</span><span class="metric-val">%s</span></div>
                    <div class="metric-row"><span class="metric-label">System Size:</span><span class="metric-val">%s</span></div>
                    <div class="metric-row"><span class="metric-label">Annual Solar Yield:</span><span class="metric-val">%s</span></div>
                    <div class="metric-row"><span class="metric-label">Estimated Savings:</span><span class="metric-val">%s</span></div>
                    <div class="metric-row"><span class="metric-label">Return on Investment:</span><span class="metric-val">%s</span></div>
                    <div class="metric-row"><span class="metric-label">Weather Summary:</span><span class="metric-val">%s</span></div>
                    <div class="metric-row" style="border-bottom:none;"><span class="metric-label">Battery Recommendation:</span><span class="metric-val">%s</span></div>
                  </div>

                  <p style="font-size: 13px; color: #475569;">
                    The complete official PDF feasibility report is attached to this email for your records and client proposals.
                  </p>
                </div>
                <div class="footer">
                  SolarSaaS Platform • Enterprise Solar Photovoltaic Analytics
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, area, panels, systemSize, generation, savings, roi, weather, battery);
    }

    private String format(Object num) {
        if (num == null) return "-";
        if (num instanceof Number) {
            return numberFormat.format(num);
        }
        return num.toString();
    }
}