package com.example.catalogservice.repository;

import com.example.catalogservice.model.entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

@Repository
public interface AlbumRepository extends JpaRepository<Album, UUID> {
    List<Album> findByOwnerId(UUID ownerId);

    Page<Album> findByOwnerIdAndStatus(UUID ownerId, String status, Pageable pageable);

    Page<Album> findByStatus(String status, Pageable pageable);

    List<Album> findByStatus(String status);

    @Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Album a SET a.likeCount = a.likeCount + 1 WHERE a.id = :id")
    void incrementLikeCount(@org.springframework.data.repository.query.Param("id") UUID id);

    @Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Album a SET a.likeCount = a.likeCount - 1 WHERE a.id = :id AND a.likeCount > 0")
    void decrementLikeCount(@org.springframework.data.repository.query.Param("id") UUID id);
}