package com.mpc.user.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Size(min = 3, max = 100)
    private String username;

    @Email
    @Size(max = 255)
    private String email;

    @Size(min = 8, max = 128)
    private String password;
}
