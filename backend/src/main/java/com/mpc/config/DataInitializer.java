package com.mpc.config;

import com.mpc.analysis.domain.Analysis;
import com.mpc.analysis.repository.AnalysisRepository;
import com.mpc.report.domain.Report;
import com.mpc.report.repository.ReportRepository;
import com.mpc.user.domain.User;
import com.mpc.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final AnalysisRepository analysisRepository;
    private final ReportRepository reportRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           AnalysisRepository analysisRepository,
                           ReportRepository reportRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.analysisRepository = analysisRepository;
        this.reportRepository = reportRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Seed Admin User if not present
        User admin = userRepository.findByEmail("admin@solarsaas.com").orElseGet(() -> {
            User newAdmin = new User();
            newAdmin.setUsername("Admin");
            newAdmin.setEmail("admin@solarsaas.com");
            newAdmin.setPasswordHash(passwordEncoder.encode("Admin@12345"));
            newAdmin.setRole("ROLE_ADMIN");
            log.info("Seeding default admin user: admin@solarsaas.com");
            return userRepository.save(newAdmin);
        });

        // Seed Regular User if not present
        User demoUser = userRepository.findByEmail("user@solarsaas.com").orElseGet(() -> {
            User newUser = new User();
            newUser.setUsername("Solar User");
            newUser.setEmail("user@solarsaas.com");
            newUser.setPasswordHash(passwordEncoder.encode("User@12345"));
            newUser.setRole("ROLE_USER");
            log.info("Seeding default demo user: user@solarsaas.com");
            return userRepository.save(newUser);
        });

        // Seed sample analysis and reports if none exist
        if (analysisRepository.count() == 0) {
            log.info("Seeding sample solar analyses and reports...");
            Analysis analysis1 = new Analysis();
            analysis1.setUser(admin);
            analysis1.setLocationName("Shivaji Nagar, Pune, Maharashtra");
            analysis1.setLatitude(18.5308);
            analysis1.setLongitude(73.8475);
            analysis1.setRoofArea(180.0);
            analysis1.setUsableArea(144.0);
            analysis1.setEstimatedPanels(36);
            analysis1.setSystemSize(14.4);
            analysis1.setMonthlyGeneration(1850.0);
            analysis1.setAnnualGeneration(22200.0);
            analysis1.setInstallationCost(576000.0);
            analysis1.setAnnualSavings(177600.0);
            analysis1.setRoi(30.8);
            analysis1.setPaybackPeriod(3.2);
            analysis1.setCo2Reduction(18200.0);
            Analysis savedAnalysis1 = analysisRepository.save(analysis1);

            Report report1 = new Report();
            report1.setUser(admin);
            report1.setAnalysis(savedAnalysis1);
            report1.setReportName("Solar Feasibility - Shivaji Nagar");
            report1.setReportType("PDF");
            report1.setFilePath("/reports/solar_feasibility_shivaji_nagar.pdf");
            report1.setGeneratedAt(Instant.now());
            reportRepository.save(report1);

            Analysis analysis2 = new Analysis();
            analysis2.setUser(demoUser);
            analysis2.setLocationName("Kothrud, Pune, Maharashtra");
            analysis2.setLatitude(18.5074);
            analysis2.setLongitude(73.8077);
            analysis2.setRoofArea(120.0);
            analysis2.setUsableArea(96.0);
            analysis2.setEstimatedPanels(24);
            analysis2.setSystemSize(9.6);
            analysis2.setMonthlyGeneration(1240.0);
            analysis2.setAnnualGeneration(14880.0);
            analysis2.setInstallationCost(384000.0);
            analysis2.setAnnualSavings(119000.0);
            analysis2.setRoi(31.0);
            analysis2.setPaybackPeriod(3.2);
            analysis2.setCo2Reduction(12200.0);
            Analysis savedAnalysis2 = analysisRepository.save(analysis2);

            Report report2 = new Report();
            report2.setUser(demoUser);
            report2.setAnalysis(savedAnalysis2);
            report2.setReportName("Solar Feasibility - Kothrud");
            report2.setReportType("PDF");
            report2.setFilePath("/reports/solar_feasibility_kothrud.pdf");
            report2.setGeneratedAt(Instant.now());
            reportRepository.save(report2);
            log.info("Sample data initialization complete.");
        }
    }
}