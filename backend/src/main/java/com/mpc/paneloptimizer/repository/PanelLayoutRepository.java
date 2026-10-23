package com.mpc.paneloptimizer.repository;

import com.mpc.paneloptimizer.domain.PanelLayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PanelLayoutRepository extends JpaRepository<PanelLayout, Long> {

    List<PanelLayout> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<PanelLayout> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<PanelLayout> findByIdAndUserId(Long id, Long userId);

    void deleteAllByUserId(Long userId);

    @Query("SELECT COALESCE(AVG(p.optimizationScore), 0.0) FROM PanelLayout p")
    Double findAverageOptimizationScore();

    @Query("SELECT COALESCE(AVG(p.roofUtilizationPercent), 0.0) FROM PanelLayout p")
    Double findAverageRoofUtilization();

    @Query("SELECT COALESCE(SUM(p.systemCapacityKw), 0.0) FROM PanelLayout p")
    Double findTotalCapacityPlanned();

    @Query(value = "SELECT layout_mode FROM panel_layouts GROUP BY layout_mode ORDER BY COUNT(id) DESC LIMIT 1", nativeQuery = true)
    String findMostSelectedLayoutMode();

    @Query("SELECT p FROM PanelLayout p ORDER BY p.createdAt DESC")
    List<PanelLayout> findRecentOptimizations(org.springframework.data.domain.Pageable pageable);
}
