package com.mpc.analysis.web;

import com.mpc.analysis.service.AnalysisService;
import com.mpc.analysis.web.dto.AnalysisRequest;
import com.mpc.analysis.web.dto.AnalysisResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AnalysisResponse save(@Valid @RequestBody AnalysisRequest request, Authentication authentication) {
        return analysisService.saveAnalysis(authentication.getName(), request);
    }

    @GetMapping
    public List<AnalysisResponse> list(Authentication authentication) {
        return analysisService.getUserAnalyses(authentication.getName());
    }

    @GetMapping("/{id}")
    public AnalysisResponse get(@PathVariable Long id, Authentication authentication) {
        return analysisService.getAnalysisById(authentication.getName(), id);
    }
}
