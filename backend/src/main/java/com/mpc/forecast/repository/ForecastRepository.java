package com.mpc.forecast.repository;

import com.mpc.forecast.domain.Forecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForecastRepository extends JpaRepository<Forecast, Long> {

    List<Forecast> findByAnalysisIdOrderByForecastDateAsc(Long analysisId);

    List<Forecast> findByUserIdOrderByForecastDateAsc(Long userId);

    @Query("SELECT AVG(f.predictedGeneration) FROM Forecast f")
    Double findAveragePredictedGeneration();

    @Query("SELECT AVG(f.cloudCover) FROM Forecast f")
    Double findAverageCloudCover();
}