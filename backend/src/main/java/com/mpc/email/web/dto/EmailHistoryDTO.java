package com.mpc.email.web.dto;

import java.time.Instant;

public class EmailHistoryDTO {

    private Long id;
    private Long reportId;
    private String reportName;
    private String recipientEmail;
    private String subject;
    private String status;
    private Instant sentAt;
    private String errorMessage;

    public EmailHistoryDTO() {
    }

    public EmailHistoryDTO(Long id, Long reportId, String reportName, String recipientEmail, String subject, String status, Instant sentAt, String errorMessage) {
        this.id = id;
        this.reportId = reportId;
        this.reportName = reportName;
        this.recipientEmail = recipientEmail;
        this.subject = subject;
        this.status = status;
        this.sentAt = sentAt;
        this.errorMessage = errorMessage;
    }

    public Long getId() {
        return id;
    }

    public Long getReportId() {
        return reportId;
    }

    public String getReportName() {
        return reportName;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public String getSubject() {
        return subject;
    }

    public String getStatus() {
        return status;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public String getErrorMessage() {
        return errorMessage;
    }
}