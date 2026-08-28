package com.example.catalogservice.repository;

import com.example.catalogservice.model.entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlbumRepository extends JpaRepository<Album, UUID> {
    List<Album> findByOwnerId(UUID ownerId);
    List<Album> findByStatus(String status);
}
