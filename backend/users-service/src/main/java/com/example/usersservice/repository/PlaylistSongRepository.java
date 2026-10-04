package com.example.usersservice.repository;

import com.example.usersservice.model.entity.PlaylistSong;
import com.example.usersservice.model.entity.PlaylistSongId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

@Repository
public interface PlaylistSongRepository extends JpaRepository<PlaylistSong, PlaylistSongId> {
    Page<PlaylistSong> findByPlaylistIdOrderByAddedAtDesc(UUID playlistId, Pageable pageable);
}
