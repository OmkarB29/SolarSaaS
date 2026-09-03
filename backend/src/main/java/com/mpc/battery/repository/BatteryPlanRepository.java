package com.mpc.battery.repository;

import com.mpc.battery.domain.BatteryPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatteryPlanRepository extends JpaRepository<BatteryPlan, Long> {

    List<BatteryPlan> findByAnalysisIdOrderByCreatedAtDesc(Long analysisId);

    List<BatteryPlan> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT AVG(b.recommendedCapacity) FROM BatteryPlan b")
    Double findAverageRecommendedCapacity();

    @Query("SELECT SUM(b.recommendedCapacity) FROM BatteryPlan b")
    Double findTotalStorageCapacityPlanned();
}