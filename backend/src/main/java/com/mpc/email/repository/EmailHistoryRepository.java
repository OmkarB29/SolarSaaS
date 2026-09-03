package com.mpc.email.repository;

import com.mpc.email.domain.EmailHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailHistoryRepository extends JpaRepository<EmailHistory, Long> {

    List<EmailHistory> findByUserIdOrderBySentAtDesc(Long userId);

    long countByStatus(String status);

    @Query("SELECT e FROM EmailHistory e ORDER BY e.sentAt DESC")
    List<EmailHistory> findTop10RecentEmails();
}