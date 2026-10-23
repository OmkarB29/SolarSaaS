package com.mpc.user.web;

import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.email.repository.EmailHistoryRepository;
import com.mpc.proposal.repository.ProposalRepository;
import com.mpc.report.repository.ReportRepository;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import com.mpc.user.web.dto.UserDashboardSummaryDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/user/dashboard-summary")
public class UserDashboardController {

    private final UserRepository userRepository;
    private final AnalysisRepository analysisRepository;
    private final ProposalRepository proposalRepository;
    private final ReportRepository reportRepository;
    private final EmailHistoryRepository emailHistoryRepository;

    public UserDashboardController(UserRepository userRepository,
                                   AnalysisRepository analysisRepository,
                                   ProposalRepository proposalRepository,
                                   ReportRepository reportRepository,
                                   EmailHistoryRepository emailHistoryRepository) {
        this.userRepository = userRepository;
        this.analysisRepository = analysisRepository;
        this.proposalRepository = proposalRepository;
        this.reportRepository = reportRepository;
        this.emailHistoryRepository = emailHistoryRepository;
    }

    @GetMapping
    public ResponseEntity<UserDashboardSummaryDTO> getSummary(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        long totalAnalyses = analysisRepository.findByUserId(user.getId()).size();
        long totalProposals = proposalRepository.countByUserId(user.getId());
        long reportsGenerated = reportRepository.findByUserId(user.getId()).size();
        long emailsSent = emailHistoryRepository.findByUserIdOrderBySentAtDesc(user.getId())
                .stream()
                .filter(e -> "SENT".equalsIgnoreCase(e.getStatus()))
                .count();

        return ResponseEntity.ok(new UserDashboardSummaryDTO(
                totalAnalyses,
                totalProposals,
                reportsGenerated,
                emailsSent
        ));
    }
}
