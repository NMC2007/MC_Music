package com.example.catalogservice.repository;

import com.example.catalogservice.model.entity.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SongRepository extends JpaRepository<Song, UUID> {
    List<Song> findByOwnerId(UUID ownerId);
    List<Song> findByStatusAndIsDeletedFalse(String status);
    List<Song> findByStatus(String status);
}
