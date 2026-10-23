package com.mpc.ai.repository;

import com.mpc.ai.domain.AIRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIRecommendationRepository extends JpaRepository<AIRecommendation, Long> {

    List<AIRecommendation> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<AIRecommendation> findFirstByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<AIRecommendation> findByIdAndUserId(Long id, Long userId);

    long countByRiskAssessmentIgnoreCase(String riskAssessment);

    @Query("SELECT AVG(r.solarScore) FROM AIRecommendation r WHERE r.solarScore IS NOT NULL")
    Double findAverageSolarScore();

    @Query("SELECT r.recommendations FROM AIRecommendation r WHERE r.recommendations IS NOT NULL")
    List<String> findAllRecommendationsJson();
}
