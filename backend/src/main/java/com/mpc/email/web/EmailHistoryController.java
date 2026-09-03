package com.mpc.email.web;

import com.mpc.email.domain.EmailHistory;
import com.mpc.email.repository.EmailHistoryRepository;
import com.mpc.email.web.dto.EmailHistoryDTO;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/email/history")
public class EmailHistoryController {

    private final EmailHistoryRepository emailHistoryRepository;
    private final UserRepository userRepository;

    public EmailHistoryController(EmailHistoryRepository emailHistoryRepository,
                                  UserRepository userRepository) {
        this.emailHistoryRepository = emailHistoryRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<EmailHistoryDTO>> getHistory(Authentication authentication) {
        User user = getUser(authentication.getName());
        List<EmailHistory> list = emailHistoryRepository.findByUserIdOrderBySentAtDesc(user.getId());
        List<EmailHistoryDTO> dtos = list.stream().map(e -> new EmailHistoryDTO(
                e.getId(),
                e.getReport() != null ? e.getReport().getId() : null,
                e.getReport() != null ? e.getReport().getReportName() : "Feasibility Analysis",
                e.getRecipientEmail(),
                e.getSubject(),
                e.getStatus(),
                e.getSentAt(),
                e.getErrorMessage()
        )).toList();

        return ResponseEntity.ok(dtos);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}