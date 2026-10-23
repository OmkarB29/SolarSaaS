package com.mpc.proposal.repository;

import com.mpc.proposal.domain.Proposal;
import com.mpc.proposal.domain.ProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long> {

    List<Proposal> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Proposal> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    long countByStatus(ProposalStatus status);

    long countByUserIdAndStatus(Long userId, ProposalStatus status);

    List<Proposal> findAllByAnalysisId(Long analysisId);
}
