package com.mpc.email.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final EmailHistoryRepository emailHistoryRepository;
    private final PdfGenerationService pdfGenerationService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${resend.api.key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    @Value("${brevo.api.key:${BREVO_API_KEY:}}")
    private String brevoApiKey;

    private final NumberFormat numberFormat = NumberFormat.getNumberInstance(new Locale("en", "IN"));

    public EmailService(EmailHistoryRepository emailHistoryRepository,
                        PdfGenerationService pdfGenerationService) {
        this.emailHistoryRepository = emailHistoryRepository;
        this.pdfGenerationService = pdfGenerationService;
    }

    public boolean isResendConfigured() {
        return resendApiKey != null && !resendApiKey.trim().isEmpty() && !resendApiKey.startsWith("${");
    }

    public boolean isBrevoConfigured() {
        return brevoApiKey != null && !brevoApiKey.trim().isEmpty() && !brevoApiKey.startsWith("${");
    }

    public boolean isMailConfigured() {
        return isResendConfigured() || isBrevoConfigured() ||
               (mailUsername != null && !mailUsername.trim().isEmpty() &&
                mailPassword != null && !mailPassword.trim().isEmpty());
    }

    public EmailHistory sendAnalysisReportEmail(User user, Report report, Analysis analysis) {
        String recipientEmail = user.getEmail();
        String subject = "SolarSaaS Solar Analysis Report";
        Instant now = Instant.now();

        if (!isMailConfigured()) {
            String warning = "No email delivery provider configured (set RESEND_API_KEY, BREVO_API_KEY, or MAIL_USERNAME/PASSWORD).";
            log.warn("[AUTO-EMAIL] Skipped sending report email to {}: {}", recipientEmail, warning);
            EmailHistory history = new EmailHistory(user, report, recipientEmail, subject, "FAILED", now, warning);
            return emailHistoryRepository.save(history);
        }

        try {
            byte[] pdfBytes = pdfGenerationService.generateAnalysisPdf(analysis);
            String htmlBody = buildHtmlBody(user, analysis);

            if (isResendConfigured()) {
                log.info("[AUTO-EMAIL] Sending report to {} via Resend HTTPS API (Port 443)...", recipientEmail);
                sendViaResendHttp(recipientEmail, subject, htmlBody, pdfBytes);
            } else if (isBrevoConfigured()) {
                log.info("[AUTO-EMAIL] Sending report to {} via Brevo HTTPS API (Port 443)...", recipientEmail);
                sendViaBrevoHttp(recipientEmail, user.getUsername(), subject, htmlBody, pdfBytes);
            } else {
                log.info("[AUTO-EMAIL] Sending report to {} via standard SMTP ({}:{})...", recipientEmail, mailHost, mailPort);
                sendViaSmtp(recipientEmail, subject, htmlBody, pdfBytes);
            }

            log.info("[AUTO-EMAIL] Successfully delivered report email with PDF attachment to {}", recipientEmail);
            EmailHistory history = new EmailHistory(user, report, recipientEmail, subject, "SENT", now, null);
            return emailHistoryRepository.save(history);
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            if (errorMsg != null && (errorMsg.contains("timed out") || errorMsg.contains("MailConnectException"))) {
                errorMsg = "Render blocks direct SMTP ports 587/465. To send emails on Render, add RESEND_API_KEY (from resend.com) or BREVO_API_KEY (from brevo.com) to your Render environment variables.";
            } else {
                errorMsg = "Email delivery failed: " + errorMsg;
            }

            log.error("[AUTO-EMAIL] Failed to send report email to {}: {}", recipientEmail, errorMsg);
            EmailHistory history = new EmailHistory(user, report, recipientEmail, subject, "FAILED", now, errorMsg);
            return emailHistoryRepository.save(history);
        }
    }

    private void sendViaResendHttp(String recipientEmail, String subject, String htmlBody, byte[] pdfBytes) throws Exception {
        String base64Pdf = Base64.getEncoder().encodeToString(pdfBytes);
        Map<String, Object> attachment = Map.of(
                "filename", "SolarSaaS-Analysis-Report.pdf",
                "content", base64Pdf
        );

        String fromAddress = (mailUsername != null && mailUsername.contains("@")) 
                ? "SolarScope CleanEnergy <onboarding@resend.dev>" 
                : "SolarScope <onboarding@resend.dev>";

        Map<String, Object> payload = Map.of(
                "from", fromAddress,
                "to", List.of(recipientEmail),
                "subject", subject,
                "html", htmlBody,
                "attachments", List.of(attachment)
        );

        String jsonPayload = objectMapper.writeValueAsString(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + resendApiKey.trim())
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("Resend API rejected request (HTTP " + response.statusCode() + "): " + response.body());
        }
    }

    private void sendViaBrevoHttp(String recipientEmail, String recipientName, String subject, String htmlBody, byte[] pdfBytes) throws Exception {
        String base64Pdf = Base64.getEncoder().encodeToString(pdfBytes);
        Map<String, Object> attachment = Map.of(
                "name", "SolarSaaS-Analysis-Report.pdf",
                "content", base64Pdf
        );

        String senderEmail = (mailUsername != null && mailUsername.contains("@")) ? mailUsername.trim() : "solarsaas.project@gmail.com";
        Map<String, Object> sender = Map.of(
                "name", "SolarScope CleanEnergy",
                "email", senderEmail
        );

        Map<String, Object> to = Map.of(
                "email", recipientEmail,
                "name", recipientName != null && !recipientName.isBlank() ? recipientName : "Solar Energy Client"
        );

        Map<String, Object> payload = Map.of(
                "sender", sender,
                "to", List.of(to),
                "subject", subject,
                "htmlContent", htmlBody,
                "attachment", List.of(attachment)
        );

        String jsonPayload = objectMapper.writeValueAsString(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("api-key", brevoApiKey.trim())
                .header("Content-Type", "application/json")
                .header("accept", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("Brevo API rejected request (HTTP " + response.statusCode() + "): " + response.body());
        }
    }

    private void sendViaSmtp(String recipientEmail, String subject, String htmlBody, byte[] pdfBytes) throws Exception {
        JavaMailSender mailSender = createMailSender();
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        helper.setFrom(mailUsername, "SolarSaaS CleanEnergy");
        helper.setTo(recipientEmail);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);

        String filename = "SolarSaaS-Analysis-Report.pdf";
        helper.addAttachment(filename, new ByteArrayResource(pdfBytes), "application/pdf");

        mailSender.send(mimeMessage);
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
        if (mailPort == 465) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        } else {
            props.put("mail.smtp.starttls.enable", "true");
        }
        props.put("mail.smtp.ssl.trust", "*");
        props.put("mail.smtp.connectiontimeout", "20000");
        props.put("mail.smtp.timeout", "20000");
        props.put("mail.smtp.writetimeout", "20000");

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
                  <p>Your technical rooftop solar assessment is ready. A detailed PDF report is attached to this email.</p>
                  
                  <div class="metric-box">
                    <div class="metric-row">
                      <span class="metric-label">Estimated System Size</span>
                      <span class="metric-val">%s (%s)</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">Rooftop Area</span>
                      <span class="metric-val">%s</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">Annual Solar Generation</span>
                      <span class="metric-val">%s</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">Estimated Annual Savings</span>
                      <span class="metric-val">%s</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">Return on Investment (ROI)</span>
                      <span class="metric-val">%s</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">Solar Irradiance Factor</span>
                      <span class="metric-val">%s</span>
                    </div>
                    <div class="metric-row" style="border-bottom: none;">
                      <span class="metric-label">Battery Storage Advice</span>
                      <span class="metric-val">%s</span>
                    </div>
                  </div>

                  <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                    To view interactive solar ray tracing, 3D azimuth shadows, panel layouts, or submit formal EPC installation proposals, sign in to your SolarSaaS dashboard.
                  </p>
                </div>
                <div class="footer">
                  <p>&copy; 2026 SolarSaaS Platform. Clean Energy Technology for Everyone.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, systemSize, panels, area, generation, savings, roi, weather, battery);
    }

    private String format(Double value) {
        if (value == null) return "N/A";
        return numberFormat.format(Math.round(value * 10.0) / 10.0);
    }

    private String format(Integer value) {
        if (value == null) return "N/A";
        return numberFormat.format(value);
    }
}
