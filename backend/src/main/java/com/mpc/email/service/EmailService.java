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
        return sendAnalysisReportEmail(user, report, analysis, user.getPreferredLanguage());
    }

    public EmailHistory sendAnalysisReportEmail(User user, Report report, Analysis analysis, String language) {
        String lang = normalizeLanguage(language != null ? language : user.getPreferredLanguage());
        String recipientEmail = user.getEmail();
        String subject = getLocalizedSubject(lang);
        Instant now = Instant.now();

        if (!isMailConfigured()) {
            String warning = "No email delivery provider configured (set RESEND_API_KEY, BREVO_API_KEY, or MAIL_USERNAME/PASSWORD).";
            log.warn("[AUTO-EMAIL] Skipped sending report email to {}: {}", recipientEmail, warning);
            EmailHistory history = new EmailHistory(user, report, recipientEmail, subject, "FAILED", now, warning);
            return emailHistoryRepository.save(history);
        }

        try {
            byte[] pdfBytes = pdfGenerationService.generateAnalysisPdf(analysis, lang);
            String htmlBody = buildHtmlBody(user, analysis, lang);

            if (isResendConfigured()) {
                log.info("[AUTO-EMAIL] Sending localized ({}) report to {} via Resend HTTPS API (Port 443)...", lang, recipientEmail);
                sendViaResendHttp(recipientEmail, subject, htmlBody, pdfBytes);
            } else if (isBrevoConfigured()) {
                log.info("[AUTO-EMAIL] Sending localized ({}) report to {} via Brevo HTTPS API (Port 443)...", lang, recipientEmail);
                sendViaBrevoHttp(recipientEmail, user.getUsername(), subject, htmlBody, pdfBytes);
            } else {
                log.info("[AUTO-EMAIL] Sending localized ({}) report to {} via standard SMTP ({}:{})...", lang, recipientEmail, mailHost, mailPort);
                sendViaSmtp(recipientEmail, subject, htmlBody, pdfBytes);
            }

            log.info("[AUTO-EMAIL] Successfully delivered localized ({}) report email with PDF attachment to {}", lang, recipientEmail);
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

    private String getLocalizedSubject(String lang) {
        return switch (lang) {
            case "hi" -> "SolarSaaS सौर विश्लेषण रिपोर्ट - Rooftop Solar Feasibility";
            case "mr" -> "SolarSaaS सौर विश्लेषण अहवाल - Rooftop Solar Feasibility";
            case "kn" -> "SolarSaaS ಸೌರ ವಿಶ್ಲೇಷಣಾ ವರದಿ - Rooftop Solar Feasibility";
            default -> "SolarSaaS Solar Analysis Report - Rooftop Feasibility";
        };
    }

    private String buildHtmlBody(User user, Analysis analysis, String lang) {
        String name = user.getUsername() != null ? user.getUsername() : "Solar Energy Pro";
        String area = format(analysis.getRoofArea()) + " m² (Usable: " + format(analysis.getUsableArea()) + " m²)";
        String panels = format(analysis.getEstimatedPanels()) + " modules";
        String systemSize = format(analysis.getSystemSize()) + " kWp";
        String generation = format(analysis.getAnnualGeneration()) + " kWh / year (" + format(analysis.getMonthlyGeneration()) + " kWh/mo)";
        String savings = "INR " + format(analysis.getAnnualSavings()) + " / year";
        String roi = format(analysis.getRoi()) + "% (Payback ~" + format(analysis.getPaybackPeriod()) + " yrs)";
        String weather = (analysis.getWeatherAdjustment() != null && analysis.getWeatherAdjustment() > 0 ? "+" : "") + format(analysis.getWeatherAdjustment()) + "% microclimate factor";
        String battery = format(analysis.getBatteryRecommendation()) + " kWh LiFePO4 battery pack";

        // Localized strings
        String headerTitle = switch (lang) {
            case "hi" -> "SolarSaaS सौर विश्लेषण रिपोर्ट";
            case "mr" -> "SolarSaaS सौर विश्लेषण अहवाल";
            case "kn" -> "SolarSaaS ಸೌರ ವಿಶ್ಲೇಷಣಾ ವರದಿ";
            default -> "SolarSaaS Solar Analysis Report";
        };

        String headerSubtitle = switch (lang) {
            case "hi" -> "स्वचालित व्यवहार्यता और आर्थिक मूल्यांकन";
            case "mr" -> "स्वयंचलित व्यवहार्यता आणि आर्थिक मूल्यांकन";
            case "kn" -> "ಸ್ವಯಂಚಾಲಿತ ಕಾರ್ಯಸಾಧ್ಯತೆ ಮತ್ತು ಆರ್ಥಿಕ ಮೌಲ್ಯಮಾಪನ";
            default -> "Automated Feasibility & Economic Appraisal";
        };

        String greeting = switch (lang) {
            case "hi" -> "नमस्ते <strong>" + name + "</strong>,";
            case "mr" -> "नमस्कार <strong>" + name + "</strong>,";
            case "kn" -> "ನಮಸ್ಕಾರ <strong>" + name + "</strong>,";
            default -> "Hello <strong>" + name + "</strong>,";
        };

        String intro = switch (lang) {
            case "hi" -> "आपका तकनीकी रूफटॉप सौर मूल्यांकन तैयार है। विस्तृत PDF रिपोर्ट इस ईमेल के साथ संलग्न है।";
            case "mr" -> "तुमचे तांत्रिक रूफटॉप सौर मूल्यांकन तयार आहे. तपशीलवार PDF अहवाल या ईमेलसोबत जोडलेला आहे.";
            case "kn" -> "ನಿಮ್ಮ ತಾಂತ್ರಿಕ ರೂಫ್‌ಟಾಪ್ ಸೌರ ಮೌಲ್ಯಮಾಪನ ಸಿದ್ಧವಾಗಿದೆ. ವಿವರವಾದ PDF ವರದಿಯನ್ನು ಈ ಇಮೇಲ್‌ನೊಂದಿಗೆ ಲಗತ್ತಿಸಲಾಗಿದೆ.";
            default -> "Your technical rooftop solar assessment is ready. A detailed PDF report is attached to this email.";
        };

        String lblSystemSize = switch (lang) {
            case "hi" -> "अनुमानित सिस्टम क्षमता";
            case "mr" -> "अंदाजे सिस्टम आकार";
            case "kn" -> "ಅಂದಾಜು ಸಿಸ್ಟಮ್ ಗಾತ್ರ";
            default -> "Estimated System Size";
        };

        String lblArea = switch (lang) {
            case "hi" -> "छत का क्षेत्रफल";
            case "mr" -> "छताचे क्षेत्रफळ";
            case "kn" -> "ಮೇಲ್ಛಾವಣಿ ವಿಸ್ತೀರ್ಣ";
            default -> "Rooftop Area";
        };

        String lblGen = switch (lang) {
            case "hi" -> "वार्षिक सौर ऊर्जा उत्पादन";
            case "mr" -> "वार्षिक सौर ऊर्जा निर्मिती";
            case "kn" -> "ವಾರ್ಷಿಕ ಸೌರ ಉತ್ಪಾದನೆ";
            default -> "Annual Solar Generation";
        };

        String lblSavings = switch (lang) {
            case "hi" -> "अनुमानित वार्षिक बचत";
            case "mr" -> "अंदाजे वार्षिक बचत";
            case "kn" -> "ಅಂದಾಜು ವಾರ್ಷಿಕ ಉಳಿತಾಯ";
            default -> "Estimated Annual Savings";
        };

        String lblRoi = switch (lang) {
            case "hi" -> "निवेश पर प्रतिलाभ (ROI)";
            case "mr" -> "गुंतवणुकीवरील परतावा (ROI)";
            case "kn" -> "ಹೂಡಿಕೆಯ ಮೇಲಿನ ಆದಾಯ (ROI)";
            default -> "Return on Investment (ROI)";
        };

        String lblWeather = switch (lang) {
            case "hi" -> "सौर विकिरण कारक";
            case "mr" -> "सौर विकिरण घटक";
            case "kn" -> "ಸೌರ ವಿಕಿರಣ ಅಂಶ";
            default -> "Solar Irradiance Factor";
        };

        String lblBattery = switch (lang) {
            case "hi" -> "बैटरी स्टोरेज सलाह";
            case "mr" -> "बॅटरी स्टोरेज सल्ला";
            case "kn" -> "ಬ್ಯಾಟರಿ ಸಂಗ್ರಹಣೆ ಸಲಹೆ";
            default -> "Battery Storage Advice";
        };

        String outro = switch (lang) {
            case "hi" -> "इंटरएक्टिव सोलर रे ट्रेसिंग, 3D शैडो, पैनल लेआउट देखने या औपचारिक ईपीसी प्रस्ताव प्रस्तुत करने के लिए अपने SolarSaaS डैशबोर्ड में लॉगिन करें।";
            case "mr" -> "परस्परसंवादी सौर रे ट्रेसिंग, 3D सावल्या, पॅनेल लेआउट पाहण्यासाठी किंवा औपचारिक ईपीसी प्रस्ताव सादर करण्यासाठी आपल्या SolarSaaS डॅशबोर्डवर साइन इन करा.";
            case "kn" -> "ಸಂವಾದಾತ್ಮಕ ಸೌರ ಕಿರಣ ಟ್ರೇಸಿಂಗ್, 3D ನೆರಳುಗಳು, ಪ್ಯಾನಲ್ ಲೇಔಟ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಅಥವಾ ಔಪಚಾರಿಕ ಇಪಿಸಿ ಪ್ರಸ್ತಾವನೆಗಳನ್ನು ಸಲ್ಲಿಸಲು ನಿಮ್ಮ SolarSaaS ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.";
            default -> "To view interactive solar ray tracing, 3D azimuth shadows, panel layouts, or submit formal EPC installation proposals, sign in to your SolarSaaS dashboard.";
        };

        String footer = switch (lang) {
            case "hi" -> "&copy; 2026 SolarSaaS प्लेटफॉर्म। सभी के लिए स्वच्छ ऊर्जा तकनीक।";
            case "mr" -> "&copy; 2026 SolarSaaS प्लॅटफॉर्म. प्रत्येकासाठी स्वच्छ ऊर्जा तंत्रज्ञान.";
            case "kn" -> "&copy; 2026 SolarSaaS ಪ್ಲಾಟ್‌ಫಾರ್ಮ್. ಎಲ್ಲರಿಗೂ ಸ್ವಚ್ಛ ಇಂಧನ ತಂತ್ರಜ್ಞಾನ.";
            default -> "&copy; 2026 SolarSaaS Platform. Clean Energy Technology for Everyone.";
        };

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
                  <h1>%s</h1>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">%s</p>
                </div>
                <div class="content">
                  <p>%s</p>
                  <p>%s</p>
                  
                  <div class="metric-box">
                    <div class="metric-row">
                      <span class="metric-label">%s</span>
                      <span class="metric-val">%s (%s)</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">%s</span>
                      <span class="metric-val">%s</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">%s</span>
                      <span class="metric-val">%s</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">%s</span>
                      <span class="metric-val">%s</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">%s</span>
                      <span class="metric-val">%s</span>
                    </div>
                    <div class="metric-row">
                      <span class="metric-label">%s</span>
                      <span class="metric-val">%s</span>
                    </div>
                    <div class="metric-row" style="border-bottom: none;">
                      <span class="metric-label">%s</span>
                      <span class="metric-val">%s</span>
                    </div>
                  </div>

                  <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                    %s
                  </p>
                </div>
                <div class="footer">
                  <p>%s</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                headerTitle, headerSubtitle, greeting, intro,
                lblSystemSize, systemSize, panels,
                lblArea, area,
                lblGen, generation,
                lblSavings, savings,
                lblRoi, roi,
                lblWeather, weather,
                lblBattery, battery,
                outro, footer
        );
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
