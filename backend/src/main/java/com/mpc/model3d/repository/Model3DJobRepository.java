package com.mpc.model3d.repository;

import com.mpc.model3d.domain.Model3DJob;
import com.mpc.model3d.domain.Model3DStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface Model3DJobRepository extends JpaRepository<Model3DJob, Long> {

    List<Model3DJob> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Model3DJob> findFirstByPolygonHashAndStatusOrderByCreatedAtDesc(String polygonHash, Model3DStatus status);

    long countByUserIdAndCreatedAtAfter(Long userId, Instant since);

    long countByCreatedAtAfter(Instant since);
}
