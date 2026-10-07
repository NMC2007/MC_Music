package com.example.usersservice.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.usersservice.model.entity.PlayHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PlayHistoryRepository extends JpaRepository<PlayHistory, UUID> {
    Page<PlayHistory> findByUserIdOrderByPlayedAtDesc(UUID userId, Pageable pageable);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE PlayHistory ph SET ph.artistName = :newName WHERE ph.artistName = :oldName")
    void updateArtistName(@org.springframework.data.repository.query.Param("oldName") String oldName, @org.springframework.data.repository.query.Param("newName") String newName);
}
