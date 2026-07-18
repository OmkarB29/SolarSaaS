package com.mpc.user.web.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class UserResponse {

    Long id;
    String username;
    String email;
    Instant createdAt;
    Instant updatedAt;
}
