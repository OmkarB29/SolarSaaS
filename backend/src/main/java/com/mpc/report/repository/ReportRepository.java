package com.mpc.report.repository;

import com.mpc.report.domain.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByUserId(Long userId);

    @Query("SELECT r FROM Report r JOIN FETCH r.analysis WHERE r.user.id = :userId ORDER BY r.generatedAt DESC")
    List<Report> findByUserIdOrderByGeneratedAtDesc(Long userId);

    Optional<Report> findByIdAndUserId(Long id, Long userId);
}
