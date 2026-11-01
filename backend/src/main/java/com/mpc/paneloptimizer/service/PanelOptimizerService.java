package com.mpc.paneloptimizer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpc.analysis.domain.Analysis;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.paneloptimizer.domain.PanelLayout;
import com.mpc.paneloptimizer.repository.PanelLayoutRepository;
import com.mpc.paneloptimizer.web.dto.OptimizationLayoutDTO;
import com.mpc.paneloptimizer.web.dto.OptimizationRequestDTO;
import com.mpc.paneloptimizer.web.dto.PanelLayoutDTO;
import com.mpc.proposal.domain.Proposal;
import com.mpc.proposal.repository.ProposalRepository;
import com.mpc.report.domain.Report;
import com.mpc.report.repository.ReportRepository;
import com.mpc.user.domain.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PanelOptimizerService {

    private static final Logger log = LoggerFactory.getLogger(PanelOptimizerService.class);

    private final OptimizationEngine optimizationEngine;
    private final PanelLayoutRepository panelLayoutRepository;
    private final AnalysisRepository analysisRepository;
    private final ProposalRepository proposalRepository;
    private final ReportRepository reportRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PanelOptimizerService(OptimizationEngine optimizationEngine,
                                 PanelLayoutRepository panelLayoutRepository,
                                 AnalysisRepository analysisRepository,
                                 ProposalRepository proposalRepository,
                                 ReportRepository reportRepository) {
        this.optimizationEngine = optimizationEngine;
        this.panelLayoutRepository = panelLayoutRepository;
        this.analysisRepository = analysisRepository;
        this.proposalRepository = proposalRepository;
        this.reportRepository = reportRepository;
    }

    public List<OptimizationLayoutDTO> generateOptimizedLayouts(OptimizationRequestDTO request) {
        if (request == null || request.getPolygonCoordinates() == null) {
            throw new IllegalArgumentException("Optimization request must contain rooftop polygon coordinates.");
        }

        return optimizationEngine.generateOptimizedLayouts(
                request.getPolygonCoordinates(),
                request.getPanelDimensions(),
                request.getAnnualIrradiance(),
                request.getObstacles(),
                request.getObstacleBufferMeters()
        );
    }

    @Transactional
    public PanelLayoutDTO saveLayout(User user, PanelLayoutDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Layout payload cannot be null.");
        }

        PanelLayout entity = new PanelLayout();
        entity.setUser(user);
        entity.setRoofArea(dto.getRoofArea() != null ? dto.getRoofArea() : 0.0);
        entity.setUsableArea(dto.getUsableArea() != null ? dto.getUsableArea() : 0.0);
        entity.setPanelCount(dto.getPanelCount() != null ? dto.getPanelCount() : 0);
        entity.setSystemCapacityKw(dto.getSystemCapacityKw() != null ? dto.getSystemCapacityKw() : 0.0);
        entity.setAnnualGenerationKwh(dto.getAnnualGenerationKwh() != null ? dto.getAnnualGenerationKwh() : 0.0);
        entity.setRoofUtilizationPercent(dto.getRoofUtilizationPercent() != null ? dto.getRoofUtilizationPercent() : 0.0);
        entity.setOptimizationScore(dto.getOptimizationScore() != null ? dto.getOptimizationScore() : 90.0);
        entity.setLayoutMode(dto.getLayoutMode() != null ? dto.getLayoutMode() : "BALANCED");
        entity.setLayoutJson(dto.getLayoutJson() != null ? dto.getLayoutJson() : "{}");

        // Link to Analysis if provided
        if (dto.getAnalysisId() != null) {
            Optional<Analysis> analysisOpt = analysisRepository.findByIdAndUserId(dto.getAnalysisId(), user.getId());
            if (analysisOpt.isPresent()) {
                Analysis analysis = analysisOpt.get();
                entity.setAnalysis(analysis);

                // Update analysis metrics with selected optimized layout values
                updateAnalysisFromLayout(analysis, entity);
            }
        }

        PanelLayout saved = panelLayoutRepository.save(entity);
        log.info("Saved optimized panel layout #{} [Mode: {}] for user: {}", saved.getId(), saved.getLayoutMode(), user.getEmail());
        return toDTO(saved);
    }

    private void updateAnalysisFromLayout(Analysis analysis, PanelLayout layout) {
        analysis.setEstimatedPanels(layout.getPanelCount());
        analysis.setSystemSize(layout.getSystemCapacityKw());
        analysis.setAnnualGeneration(layout.getAnnualGenerationKwh());
        analysis.setMonthlyGeneration(Math.round((layout.getAnnualGenerationKwh() / 12.0) * 10.0) / 10.0);

        // Update financial parameters proportionally
        double systemCost = layout.getSystemCapacityKw() * 45000.0;
        double yearlySavings = layout.getAnnualGenerationKwh() * 8.0;
        double payback = yearlySavings > 0 ? Math.round((systemCost / yearlySavings) * 10.0) / 10.0 : 5.0;
        double roi = systemCost > 0 ? Math.round(((yearlySavings * 25.0 - systemCost) / systemCost) * 1000.0) / 10.0 : 18.0;
        double co2Reduction = Math.round(layout.getAnnualGenerationKwh() * 0.82);

        analysis.setInstallationCost(systemCost);
        analysis.setAnnualSavings(yearlySavings);
        analysis.setPaybackPeriod(payback);
        analysis.setRoi(roi);
        analysis.setCo2Reduction(co2Reduction);

        analysisRepository.save(analysis);
        log.info("Updated Analysis #{} with optimized panel parameters: {} panels, {} kW", 
                analysis.getId(), layout.getPanelCount(), layout.getSystemCapacityKw());

        // Also update associated proposals
        List<Proposal> proposals = proposalRepository.findAllByAnalysisId(analysis.getId());
        for (Proposal prop : proposals) {
            prop.setSystemSize(layout.getSystemCapacityKw());
            prop.setCost(systemCost);
            prop.setRoi(roi);
            proposalRepository.save(prop);
        }
    }

    public Optional<PanelLayoutDTO> getLatestLayout(User user) {
        return panelLayoutRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .map(this::toDTO);
    }

    public List<PanelLayoutDTO> getLayoutHistory(User user) {
        return panelLayoutRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<PanelLayoutDTO> getLayoutById(User user, Long id) {
        return panelLayoutRepository.findByIdAndUserId(id, user.getId())
                .map(this::toDTO);
    }

    @Transactional
    public boolean deleteLayout(User user, Long id) {
        Optional<PanelLayout> layoutOpt = panelLayoutRepository.findByIdAndUserId(id, user.getId());
        if (layoutOpt.isPresent()) {
            panelLayoutRepository.delete(layoutOpt.get());
            log.info("Deleted panel layout #{} for user {}", id, user.getEmail());
            return true;
        }
        return false;
    }

    public PanelLayoutDTO toDTO(PanelLayout entity) {
        PanelLayoutDTO dto = new PanelLayoutDTO();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUser() != null ? entity.getUser().getId() : null);
        dto.setAnalysisId(entity.getAnalysis() != null ? entity.getAnalysis().getId() : null);
        dto.setRoofArea(entity.getRoofArea());
        dto.setUsableArea(entity.getUsableArea());
        dto.setPanelCount(entity.getPanelCount());
        dto.setSystemCapacityKw(entity.getSystemCapacityKw());
        dto.setAnnualGenerationKwh(entity.getAnnualGenerationKwh());
        dto.setRoofUtilizationPercent(entity.getRoofUtilizationPercent());
        dto.setOptimizationScore(entity.getOptimizationScore());
        dto.setLayoutMode(entity.getLayoutMode());
        dto.setLayoutJson(entity.getLayoutJson());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
