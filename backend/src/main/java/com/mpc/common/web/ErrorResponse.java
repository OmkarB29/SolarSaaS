package com.mpc.common.web;

import java.time.Instant;
import java.util.List;

public class ErrorResponse {

    private final Instant timestamp;
    private final int status;
    private final String error;
    private final String message;
    private final List<FieldError> fieldErrors;

    public ErrorResponse(Instant timestamp, int status, String error, String message, List<FieldError> fieldErrors) {
        this.timestamp = timestamp;
        this.status = status;
        this.error = error;
        this.message = message;
        this.fieldErrors = fieldErrors;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public List<FieldError> getFieldErrors() {
        return fieldErrors;
    }

    public static final class Builder {
        private Instant timestamp;
        private int status;
        private String error;
        private String message;
        private List<FieldError> fieldErrors;

        public Builder timestamp(Instant timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder status(int status) {
            this.status = status;
            return this;
        }

        public Builder error(String error) {
            this.error = error;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder fieldErrors(List<FieldError> fieldErrors) {
            this.fieldErrors = fieldErrors;
            return this;
        }

        public ErrorResponse build() {
            return new ErrorResponse(timestamp, status, error, message, fieldErrors);
        }
    }

    public static class FieldError {
        private final String field;
        private final String message;

        public FieldError(String field, String message) {
            this.field = field;
            this.message = message;
        }

        public static Builder builder() {
            return new Builder();
        }

        public String getField() {
            return field;
        }

        public String getMessage() {
            return message;
        }

        public static final class Builder {
            private String field;
            private String message;

            public Builder field(String field) {
                this.field = field;
                return this;
            }

            public Builder message(String message) {
                this.message = message;
                return this;
            }

            public FieldError build() {
                return new FieldError(field, message);
            }
        }
    }
}
