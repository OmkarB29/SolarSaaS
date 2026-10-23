package com.mpc.ai.web;

import com.mpc.ai.service.AIRecommendationService;
import com.mpc.ai.web.dto.AIRecommendationDTO;
import com.mpc.ai.web.dto.AIRecommendationRequest;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/ai/recommendation")
public class AIRecommendationController {

    private final AIRecommendationService aiRecommendationService;
    private final UserRepository userRepository;

    public AIRecommendationController(AIRecommendationService aiRecommendationService,
                                    UserRepository userRepository) {
        this.aiRecommendationService = aiRecommendationService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .or(() -> userRepository.findByUsername(authentication.getName()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account not found"));
    }

    /**
     * Generate natural-language solar advisor recommendations and persist to PostgreSQL.
     */
    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    public AIRecommendationDTO generateRecommendation(@RequestBody(required = false) AIRecommendationRequest request,
                                                      Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (request == null) {
            request = new AIRecommendationRequest();
        }
        return aiRecommendationService.generateRecommendation(user, request);
    }

    /**
     * Retrieve the latest recommendation for the logged-in user.
     */
    @GetMapping("/latest")
    public ResponseEntity<AIRecommendationDTO> getLatestRecommendation(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return aiRecommendationService.getLatestRecommendation(user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * Retrieve recommendation history (User views own, Admin views all).
     */
    @GetMapping("/history")
    public List<AIRecommendationDTO> getHistory(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return aiRecommendationService.getRecommendationHistory(user);
    }

    /**
     * Retrieve a specific recommendation by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<AIRecommendationDTO> getById(@PathVariable Long id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return aiRecommendationService.getRecommendationById(id, user)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AI Recommendation #" + id + " not found"));
    }
}
