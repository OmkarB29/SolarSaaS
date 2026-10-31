package com.mpc.scene3d.web;

import com.mpc.scene3d.dto.Scene3DRequest;
import com.mpc.scene3d.dto.Scene3DResponse;
import com.mpc.scene3d.service.Scene3DService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/scene3d")
public class Scene3DController {

    private final Scene3DService scene3DService;

    public Scene3DController(Scene3DService scene3DService) {
        this.scene3DService = scene3DService;
    }

    /**
     * POST /api/scene3d/build
     * Accepts a polygon and optional panel array, returns a fully localized Three.js-ready scene JSON.
     * This endpoint is public (no auth required) so the 3D view works without login for demos.
     */
    @PostMapping("/build")
    public ResponseEntity<Scene3DResponse> buildScene(@RequestBody Scene3DRequest request) {
        try {
            Scene3DResponse response = scene3DService.buildScene(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to build 3D scene: " + e.getMessage());
        }
    }
}
