package com.example.usersservice.repository;

import com.example.usersservice.model.entity.PlayHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlayHistoryRepository extends JpaRepository<PlayHistory, UUID> {
    List<PlayHistory> findByUserIdOrderByPlayedAtDesc(UUID userId);
}
