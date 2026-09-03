package com.mpc.report.service;

import com.mpc.analysis.domain.Analysis;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.report.domain.Report;
import com.mpc.report.repository.ReportRepository;
import com.mpc.report.web.dto.ReportRequest;
import com.mpc.report.web.dto.ReportResponse;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final AnalysisRepository analysisRepository;

    public ReportService(ReportRepository reportRepository,
                         UserRepository userRepository,
                         AnalysisRepository analysisRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.analysisRepository = analysisRepository;
    }

    @Transactional
    public ReportResponse saveReport(String email, ReportRequest request) {
        User user = getUser(email);
        Analysis analysis = getAnalysisAndValidateOwnership(request.getAnalysisId(), user.getId());

        Report report = new Report();
        report.setUser(user);
        report.setAnalysis(analysis);
        report.setReportName(request.getReportName());
        report.setReportType(request.getReportType());
        report.setFilePath(request.getFilePath());
        report.setReportPath(request.getFilePath());

        return toResponse(reportRepository.save(report));
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getUserReports(String email) {
        User user = getUser(email);
        return reportRepository.findByUserIdOrderByGeneratedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReportResponse getReportById(String email, Long id) {
        User user = getUser(email);
        return reportRepository.findByIdAndUserId(id, user.getId())
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
    }

    @Transactional
    public void deleteReport(String email, Long id) {
        User user = getUser(email);
        Report report = reportRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        reportRepository.delete(report);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private Analysis getAnalysisAndValidateOwnership(Long analysisId, Long userId) {
        return analysisRepository.findByIdAndUserId(analysisId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Analysis not found or does not belong to user"));
    }

    private ReportResponse toResponse(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getReportName(),
                report.getReportType(),
                report.getGeneratedAt(),
                report.getFilePath(),
                report.getAnalysis().getId(),
                report.getCreatedAt()
        );
    }
}