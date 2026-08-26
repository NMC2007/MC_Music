package com.example.catalogservice.repository;

import com.example.catalogservice.model.entity.SongArtist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SongArtistRepository extends JpaRepository<SongArtist, UUID> {
    List<SongArtist> findBySongId(UUID songId);
}
