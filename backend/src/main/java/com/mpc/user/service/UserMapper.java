package com.mpc.user.service;

import com.mpc.user.domain.User;
import com.mpc.user.web.dto.UserResponse;
import lombok.experimental.UtilityClass;

@UtilityClass
public class UserMapper {

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
