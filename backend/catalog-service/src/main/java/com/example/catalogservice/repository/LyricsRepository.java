package com.example.catalogservice.repository;

import com.example.catalogservice.model.entity.Lyrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LyricsRepository extends JpaRepository<Lyrics, UUID> {
}
