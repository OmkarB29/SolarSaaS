package com.mpc.solar.repository;

import com.mpc.solar.domain.SolarPotential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolarPotentialRepository extends JpaRepository<SolarPotential, Long> {

    List<SolarPotential> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<SolarPotential> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT AVG(s.solarScore) FROM SolarPotential s")
    Double findAverageSolarScore();

    Optional<SolarPotential> findTopByOrderByAnnualGenerationKwhDesc();

    Optional<SolarPotential> findTopByOrderBySolarScoreDesc();

    @Query("SELECT SUM(s.annualGenerationKwh) FROM SolarPotential s")
    Double findTotalAnnualEnergy();

    @Query("SELECT SUM(s.carbonOffsetKg) FROM SolarPotential s")
    Double findTotalCarbonOffset();

    @Query("SELECT SUM(s.annualSavings) FROM SolarPotential s")
    Double findTotalAnnualSavings();

    List<SolarPotential> findTop10ByOrderByCreatedAtDesc();
}
