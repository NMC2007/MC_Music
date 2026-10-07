package com.example.usersservice.repository;

import com.example.usersservice.model.entity.FavoriteAlbum;
import com.example.usersservice.model.entity.FavoriteAlbumId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

@Repository
public interface FavoriteAlbumRepository extends JpaRepository<FavoriteAlbum, FavoriteAlbumId> {
    Page<FavoriteAlbum> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE FavoriteAlbum fa SET fa.artistName = :newName WHERE fa.artistName = :oldName")
    void updateArtistName(@org.springframework.data.repository.query.Param("oldName") String oldName, @org.springframework.data.repository.query.Param("newName") String newName);
}
