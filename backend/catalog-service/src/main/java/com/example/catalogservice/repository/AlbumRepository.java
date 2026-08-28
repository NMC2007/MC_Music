package com.example.catalogservice.repository;

import com.example.catalogservice.model.entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
