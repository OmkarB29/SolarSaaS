package com.mpc.model3d.web;

import com.mpc.model3d.domain.Model3DJob;
import com.mpc.model3d.service.Model3DService;
import com.mpc.model3d.web.dto.Model3DJobRequestDTO;
import com.mpc.model3d.web.dto.Model3DJobResponseDTO;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/model3d")
public class Model3DController {

    private final Model3DService model3DService;
    private final UserRepository userRepository;

    public Model3DController(Model3DService model3DService, UserRepository userRepository) {
        this.model3DService = model3DService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    /**
     * POST /api/model3d/jobs: Creates a new 3D model generation job or returns cached equivalent
     */
    @PostMapping("/jobs")
    public ResponseEntity<Model3DJobResponseDTO> createJob(
            Authentication authentication,
            @RequestBody Model3DJobRequestDTO request) {
        User user = getAuthenticatedUser(authentication);
        Model3DJob job = model3DService.createJob(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Model3DJobResponseDTO.fromEntity(job));
    }

    /**
     * GET /api/model3d/jobs/{id}: Returns status and progress
     */
    @GetMapping("/jobs/{id}")
    public ResponseEntity<Model3DJobResponseDTO> getJob(
            Authentication authentication,
            @PathVariable Long id) {
        User user = getAuthenticatedUser(authentication);
        Model3DJob job = model3DService.getJob(id, user);
        return ResponseEntity.ok(Model3DJobResponseDTO.fromEntity(job));
    }

    /**
     * GET /api/model3d/jobs/{id}/model: Streams the stored GLB file
     * Permitted for WebGL 3D viewers (Three.js useGLTF) without auth token hurdles
     */
    @GetMapping(value = "/jobs/{id}/model", produces = "model/gltf-binary")
    public ResponseEntity<byte[]> getModelGlb(@PathVariable Long id) {
        try {
            byte[] glbBytes = model3DService.getJobGlb(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "model/gltf-binary")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"model_" + id + ".glb\"")
                    .body(glbBytes);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * GET /api/model3d/jobs: Lists all jobs for current user
     */
    @GetMapping("/jobs")
    public ResponseEntity<List<Model3DJobResponseDTO>> listJobs(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        List<Model3DJob> jobs = model3DService.listUserJobs(user);
        List<Model3DJobResponseDTO> dtos = jobs.stream()
                .map(Model3DJobResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
