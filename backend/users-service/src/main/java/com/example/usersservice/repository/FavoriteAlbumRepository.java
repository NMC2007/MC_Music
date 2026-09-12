package com.example.usersservice.repository;

import com.example.usersservice.model.entity.FavoriteAlbum;
import com.example.usersservice.model.entity.FavoriteAlbumId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FavoriteAlbumRepository extends JpaRepository<FavoriteAlbum, FavoriteAlbumId> {
    List<FavoriteAlbum> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
