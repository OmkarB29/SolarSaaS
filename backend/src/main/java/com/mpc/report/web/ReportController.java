package com.mpc.report.web;

import com.mpc.report.service.ReportService;
import com.mpc.report.web.dto.ReportRequest;
import com.mpc.report.web.dto.ReportResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse save(@Valid @RequestBody ReportRequest request, Authentication authentication) {
        return reportService.saveReport(authentication.getName(), request);
    }

    @GetMapping
    public List<ReportResponse> list(Authentication authentication) {
        return reportService.getUserReports(authentication.getName());
    }

    @GetMapping("/{id}")
    public ReportResponse get(@PathVariable Long id, Authentication authentication) {
        return reportService.getReportById(authentication.getName(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication authentication) {
        reportService.deleteReport(authentication.getName(), id);
    }
}