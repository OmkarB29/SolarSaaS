package com.mpc.analysis.repository;

import com.mpc.analysis.domain.Analysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnalysisRepository extends JpaRepository<Analysis, Long> {

    List<Analysis> findByUserId(Long userId);

    List<Analysis> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Analysis> findByIdAndUserId(Long id, Long userId);
}
