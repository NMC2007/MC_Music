package com.example.catalogservice.repository;

import com.example.catalogservice.model.entity.Song;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SongRepository extends JpaRepository<Song, UUID> {
    List<Song> findByOwnerId(UUID ownerId);
    Page<Song> findByOwnerIdAndStatusAndIsDeletedFalse(UUID ownerId, String status, Pageable pageable);
    List<Song> findByStatusAndIsDeletedFalse(String status);
    List<Song> findByStatus(String status);

    @Query("SELECT DISTINCT s FROM Song s LEFT JOIN s.genres g " +
           "WHERE s.status = 'APPROVED' AND s.isDeleted = false " +
           "AND (:keyword IS NULL OR LOWER(s.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))) " +
           "AND (:genreId IS NULL OR g.id = :genreId)")
    Page<Song> findPublicSongs(@Param("keyword") String keyword, @Param("genreId") UUID genreId, Pageable pageable);
}
