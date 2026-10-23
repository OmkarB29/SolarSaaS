package com.mpc.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.ai.domain.AIRecommendation;
import com.mpc.ai.repository.AIRecommendationRepository;
import com.mpc.ai.web.dto.AIRecommendationDTO;
import com.mpc.ai.web.dto.AIRecommendationRequest;
import com.mpc.ai.web.dto.ActionPlanStepDTO;
import com.mpc.analysis.domain.Analysis;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.user.domain.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AIRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(AIRecommendationService.class);

    private final OpenAIService openAiService;
    private final AIRecommendationRepository aiRecommendationRepository;
    private final AnalysisRepository analysisRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AIRecommendationService(OpenAIService openAiService,
                                   AIRecommendationRepository aiRecommendationRepository,
                                   AnalysisRepository analysisRepository) {
        this.openAiService = openAiService;
        this.aiRecommendationRepository = aiRecommendationRepository;
        this.analysisRepository = analysisRepository;
    }

    /**
     * Generate natural-language advisor advice based on technical solar metrics and persist to PostgreSQL.
     */
    @Transactional
    public AIRecommendationDTO generateRecommendation(User user, AIRecommendationRequest request) {
        // Backfill parameters from Analysis if analysisId is provided
        if (request.getAnalysisId() != null) {
            analysisRepository.findById(request.getAnalysisId()).ifPresent(analysis -> {
                if (request.getSolarScore() == null) {
                    request.setSolarScore(analysis.getRoi() != null ? Math.min(95.0, analysis.getRoi() * 4.0) : 75.0);
                }
                if (request.getAnnualGeneration() == null) {
                    request.setAnnualGeneration(analysis.getAnnualGeneration());
                }
                if (request.getAnnualSavings() == null) {
                    request.setAnnualSavings(analysis.getAnnualSavings());
                }
                if (request.getPaybackPeriod() == null) {
                    request.setPaybackPeriod(analysis.getPaybackPeriod());
                }
                if (request.getRoofArea() == null) {
                    request.setRoofArea(analysis.getRoofArea());
                }
                if (request.getUsableArea() == null) {
                    request.setUsableArea(analysis.getUsableArea());
                }
                if (request.getSystemSize() == null) {
                    request.setSystemSize(analysis.getSystemSize());
                }
                if (request.getPanelCount() == null) {
                    request.setPanelCount(analysis.getEstimatedPanels());
                }
                if (request.getCarbonOffset() == null) {
                    request.setCarbonOffset(analysis.getCo2Reduction());
                }
                if (request.getAddress() == null || request.getAddress().isBlank()) {
                    request.setAddress(analysis.getLocationName());
                }
            });
        }

        // Call OpenAI Advisor Service (with resilient fallback)
        AIRecommendationDTO advice = openAiService.generateAdvisorResponse(request);

        // Persist to PostgreSQL table: ai_recommendations
        AIRecommendation entity = new AIRecommendation();
        entity.setUser(user);
        entity.setAnalysisId(request.getAnalysisId());
        entity.setSolarScore(advice.getSolarScore());
        entity.setAnnualGeneration(advice.getAnnualGeneration());
        entity.setAnnualSavings(advice.getAnnualSavings());
        entity.setPaybackPeriod(advice.getPaybackPeriod());
        entity.setInstallationAssessment(advice.getInstallationAssessment());
        entity.setFinancialAssessment(advice.getFinancialAssessment());
        entity.setBatteryRecommendation(advice.getBatteryRecommendation());
        entity.setRiskAssessment(advice.getRiskAssessment());
        entity.setExecutiveSummary(advice.getExecutiveSummary());

        try {
            entity.setRecommendations(objectMapper.writeValueAsString(advice.getRecommendations()));
        } catch (Exception e) {
            entity.setRecommendations("[]");
        }

        try {
            entity.setActionPlan(objectMapper.writeValueAsString(advice.getActionPlan()));
        } catch (Exception e) {
            entity.setActionPlan("[]");
        }

        entity.setGeneratedAt(Instant.now());
        AIRecommendation saved = aiRecommendationRepository.save(entity);

        advice.setId(saved.getId());
        advice.setCreatedAt(saved.getCreatedAt());
        return advice;
    }

    /**
     * Retrieve latest advisor recommendation for current user.
     */
    @Transactional(readOnly = true)
    public Optional<AIRecommendationDTO> getLatestRecommendation(User user) {
        return aiRecommendationRepository.findFirstByUserIdOrderByCreatedAtDesc(user.getId())
                .map(this::toDTO);
    }

    /**
     * Retrieve recommendation history for current user (or all if admin).
     */
    @Transactional(readOnly = true)
    public List<AIRecommendationDTO> getRecommendationHistory(User user) {
        List<AIRecommendation> list;
        if ("ROLE_ADMIN".equalsIgnoreCase(user.getRole())) {
            list = aiRecommendationRepository.findAll();
            list.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        } else {
            list = aiRecommendationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }

        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Retrieve specific recommendation by ID.
     */
    @Transactional(readOnly = true)
    public Optional<AIRecommendationDTO> getRecommendationById(Long id, User user) {
        Optional<AIRecommendation> opt = "ROLE_ADMIN".equalsIgnoreCase(user.getRole())
                ? aiRecommendationRepository.findById(id)
                : aiRecommendationRepository.findByIdAndUserId(id, user.getId());

        return opt.map(this::toDTO);
    }

    public AIRecommendationDTO toDTO(AIRecommendation entity) {
        AIRecommendationDTO dto = new AIRecommendationDTO();
        dto.setId(entity.getId());
        dto.setAnalysisId(entity.getAnalysisId());
        dto.setSolarScore(entity.getSolarScore());
        dto.setAnnualGeneration(entity.getAnnualGeneration());
        dto.setAnnualSavings(entity.getAnnualSavings());
        dto.setPaybackPeriod(entity.getPaybackPeriod());
        dto.setInstallationAssessment(entity.getInstallationAssessment());
        dto.setFinancialAssessment(entity.getFinancialAssessment());
        dto.setBatteryRecommendation(entity.getBatteryRecommendation());
        dto.setRiskAssessment(entity.getRiskAssessment());
        dto.setExecutiveSummary(entity.getExecutiveSummary());
        dto.setGeneratedAt(entity.getGeneratedAt());
        dto.setCreatedAt(entity.getCreatedAt());

        try {
            if (entity.getRecommendations() != null && !entity.getRecommendations().isBlank()) {
                List<String> recs = objectMapper.readValue(entity.getRecommendations(), new TypeReference<List<String>>() {});
                dto.setRecommendations(recs);
            }
        } catch (Exception e) {
            dto.setRecommendations(new ArrayList<>());
        }

        try {
            if (entity.getActionPlan() != null && !entity.getActionPlan().isBlank()) {
                List<ActionPlanStepDTO> steps = objectMapper.readValue(entity.getActionPlan(), new TypeReference<List<ActionPlanStepDTO>>() {});
                dto.setActionPlan(steps);
            }
        } catch (Exception e) {
            dto.setActionPlan(new ArrayList<>());
        }

        return dto;
    }
}
