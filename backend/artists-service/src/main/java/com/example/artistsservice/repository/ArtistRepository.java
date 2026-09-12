package com.example.artistsservice.repository;

import com.example.artistsservice.model.entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, UUID> {
    Optional<Artist> findByEmail(String email);
    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Artist a SET a.followerCount = a.followerCount + 1 WHERE a.id = :id")
    void incrementFollowerCount(@org.springframework.data.repository.query.Param("id") UUID id);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Artist a SET a.followerCount = a.followerCount - 1 WHERE a.id = :id AND a.followerCount > 0")
    void decrementFollowerCount(@org.springframework.data.repository.query.Param("id") UUID id);
}
