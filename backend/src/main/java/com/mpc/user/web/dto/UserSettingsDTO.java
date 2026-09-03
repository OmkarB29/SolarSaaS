package com.mpc.user.web.dto;

public class UserSettingsDTO {

    private Boolean autoEmailReports;
    private String email;
    private String username;

    public UserSettingsDTO() {
    }

    public UserSettingsDTO(Boolean autoEmailReports, String email, String username) {
        this.autoEmailReports = autoEmailReports;
        this.email = email;
        this.username = username;
    }

    public Boolean getAutoEmailReports() {
        return autoEmailReports != null && autoEmailReports;
    }

    public void setAutoEmailReports(Boolean autoEmailReports) {
        this.autoEmailReports = autoEmailReports;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}