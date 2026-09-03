package com.mpc.admin.web;

import com.mpc.admin.service.AdminService;
import com.mpc.admin.web.dto.AdminAnalyticsDTO;
import com.mpc.admin.web.dto.AdminDashboardDTO;
import com.mpc.admin.web.dto.AdminUserDTO;
import com.mpc.admin.web.dto.AdminUserDetailDTO;
import com.mpc.analysis.domain.Analysis;
import com.mpc.report.domain.Report;
import com.mpc.analysis.web.dto.AnalysisResponse;
import com.mpc.report.web.dto.ReportResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDTO> getDashboard() {
        AdminDashboardDTO dashboard = adminService.getDashboardStats();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDTO>> getUsers() {
        List<AdminUserDTO> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminUserDetailDTO> getUserDetail(@PathVariable Long userId) {
        return adminService.getUserDetail(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/{userId}/analyses")
    public ResponseEntity<List<AnalysisResponse>> getUserAnalyses(@PathVariable Long userId) {
        List<AnalysisResponse> analyses = adminService.getUserAnalyses(userId).stream()
                .map(this::toAnalysisResponse)
                .toList();
        return ResponseEntity.ok(analyses);
    }

    @GetMapping("/users/{userId}/reports")
    public ResponseEntity<List<ReportResponse>> getUserReports(@PathVariable Long userId) {
        List<ReportResponse> reports = adminService.getUserReports(userId).stream()
                .map(this::toReportResponse)
                .toList();
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/analyses")
    public ResponseEntity<List<AnalysisResponse>> getAnalyses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<AnalysisResponse> analyses = adminService.getAllAnalyses(page, size).stream()
                .map(this::toAnalysisResponse)
                .toList();
        return ResponseEntity.ok(analyses);
    }

    @GetMapping("/reports")
    public ResponseEntity<List<ReportResponse>> getReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<ReportResponse> reports = adminService.getAllReports(page, size).stream()
                .map(this::toReportResponse)
                .toList();
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsDTO> getAnalytics() {
        AdminAnalyticsDTO analytics = adminService.getAnalyticsTrends();
        return ResponseEntity.ok(analytics);
    }

    private AnalysisResponse toAnalysisResponse(Analysis a) {
        return new AnalysisResponse(
                a.getId(),
                a.getUser().getId(),
                a.getLocationName(),
                a.getLatitude(),
                a.getLongitude(),
                a.getRoofArea(),
                a.getEstimatedPanels(),
                a.getMonthlyGeneration(),
                a.getInstallationCost(),
                a.getRoi(),
                a.getCo2Reduction(),
                a.getCreatedAt()
        );
    }

    private ReportResponse toReportResponse(Report r) {
        return new ReportResponse(
                r.getId(),
                r.getReportName(),
                r.getReportType(),
                r.getGeneratedAt(),
                r.getFilePath(),
                r.getAnalysis().getId(),
                r.getCreatedAt()
        );
    }
}
