package com.mpc.common.web;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;

@Value
@Builder
public class ErrorResponse {

    Instant timestamp;
    int status;
    String error;
    String message;
    List<FieldError> fieldErrors;

    @Value
    @Builder
    public static class FieldError {
        String field;
        String message;
    }
}
