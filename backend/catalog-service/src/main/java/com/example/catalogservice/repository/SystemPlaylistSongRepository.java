package com.example.catalogservice.repository;

import com.example.catalogservice.model.entity.SystemPlaylistSong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemPlaylistSongRepository extends JpaRepository<SystemPlaylistSong, Long> {
}
