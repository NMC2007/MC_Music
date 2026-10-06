package com.example.catalogservice.repository;

import com.example.catalogservice.model.entity.SongArtist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SongArtistRepository extends JpaRepository<SongArtist, UUID> {
    List<SongArtist> findBySongId(UUID songId);
    boolean existsBySongIdAndArtistId(UUID songId, UUID artistId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE SongArtist sa SET sa.artistName = :newName WHERE sa.artistId = :artistId")
    void updateArtistName(@org.springframework.data.repository.query.Param("artistId") UUID artistId, @org.springframework.data.repository.query.Param("newName") String newName);
}
