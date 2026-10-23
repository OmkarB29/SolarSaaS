package com.mpc.paneloptimizer.web;

import com.mpc.paneloptimizer.service.PanelOptimizerService;
import com.mpc.paneloptimizer.web.dto.OptimizationLayoutDTO;
import com.mpc.paneloptimizer.web.dto.OptimizationRequestDTO;
import com.mpc.paneloptimizer.web.dto.PanelLayoutDTO;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/panel-optimizer")
public class PanelOptimizerController {

    private final PanelOptimizerService panelOptimizerService;
    private final UserRepository userRepository;

    public PanelOptimizerController(PanelOptimizerService panelOptimizerService, UserRepository userRepository) {
        this.panelOptimizerService = panelOptimizerService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    @PostMapping("/optimize")
    public ResponseEntity<List<OptimizationLayoutDTO>> optimizeLayouts(@RequestBody OptimizationRequestDTO request) {
        try {
            List<OptimizationLayoutDTO> layouts = panelOptimizerService.generateOptimizedLayouts(request);
            return ResponseEntity.ok(layouts);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Layout optimization failed: " + ex.getMessage());
        }
    }

    @PostMapping("/save")
    public ResponseEntity<PanelLayoutDTO> saveLayout(@RequestBody PanelLayoutDTO dto,
                                                     Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        try {
            PanelLayoutDTO saved = panelOptimizerService.saveLayout(user, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save layout: " + ex.getMessage());
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<PanelLayoutDTO> getLatestLayout(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return panelOptimizerService.getLatestLayout(user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/history")
    public ResponseEntity<List<PanelLayoutDTO>> getLayoutHistory(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        List<PanelLayoutDTO> history = panelOptimizerService.getLayoutHistory(user);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PanelLayoutDTO> getLayoutById(@PathVariable Long id,
                                                        Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return panelOptimizerService.getLayoutById(user, id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Layout not found with ID: " + id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLayout(@PathVariable Long id,
                                             Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        boolean deleted = panelOptimizerService.deleteLayout(user, id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Layout not found with ID: " + id);
        }
    }
}
