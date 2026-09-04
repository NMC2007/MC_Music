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
@Table(name = "favorite_albums")
@IdClass(FavoriteAlbumId.class)
public class FavoriteAlbum {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "album_id")
    private UUID albumId;

    @Column(name = "album_title", nullable = false)
    private String albumTitle;

    @Column(name = "artist_name")
    private String artistName;

    @Column(name = "cover_image")
    private String coverImage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
