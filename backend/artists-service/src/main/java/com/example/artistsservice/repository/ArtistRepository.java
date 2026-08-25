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
}
