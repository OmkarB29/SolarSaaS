package com.mpc.auth.web.dto;

public class LoginResponse {

    private final String token;
    private final String type;

    public LoginResponse(String token, String type) {
        this.token = token;
        this.type = type;
    }

    public String getToken() {
        return token;
    }

    public String getType() {
        return type;
    }
}