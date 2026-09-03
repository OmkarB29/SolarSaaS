package com.mpc.user.web;

import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import com.mpc.user.web.dto.UserSettingsDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/user/settings")
public class UserSettingsController {

    private final UserRepository userRepository;

    public UserSettingsController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<UserSettingsDTO> getSettings(Authentication authentication) {
        User user = getUser(authentication.getName());
        return ResponseEntity.ok(new UserSettingsDTO(
                user.getAutoEmailReports(),
                user.getEmail(),
                user.getUsername()
        ));
    }

    @PatchMapping
    public ResponseEntity<UserSettingsDTO> updateSettings(@RequestBody UserSettingsDTO request,
                                                          Authentication authentication) {
        User user = getUser(authentication.getName());
        if (request.getAutoEmailReports() != null) {
            user.setAutoEmailReports(request.getAutoEmailReports());
            userRepository.save(user);
        }
        return ResponseEntity.ok(new UserSettingsDTO(
                user.getAutoEmailReports(),
                user.getEmail(),
                user.getUsername()
        ));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}