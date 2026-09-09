package com.example.usersservice.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "playlist_songs")
@IdClass(PlaylistSongId.class)
public class PlaylistSong {

    @Id
    @Column(name = "playlist_id")
    private UUID playlistId;

    @Id
    @Column(name = "song_id")
    private UUID songId;

    @Column(name = "song_title", nullable = false)
    private String songTitle;

    @Column(name = "artist_name", nullable = false)
    private String artistName;

    @Column(name = "cover_image")
    private String coverImage;

    @CreationTimestamp
    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt;
}
