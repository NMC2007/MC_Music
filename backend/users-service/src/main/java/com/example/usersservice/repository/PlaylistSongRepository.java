package com.example.usersservice.repository;

import com.example.usersservice.model.entity.PlaylistSong;
import com.example.usersservice.model.entity.PlaylistSongId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlaylistSongRepository extends JpaRepository<PlaylistSong, PlaylistSongId> {
    List<PlaylistSong> findByPlaylistIdOrderByAddedAtDesc(UUID playlistId);
}
