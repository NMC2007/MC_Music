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
@Table(name = "follow_artists")
@IdClass(FollowArtistId.class)
public class FollowArtist {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "artist_id")
    private UUID artistId;

    @Column(name = "artist_name", nullable = false)
    private String artistName;

    @Column(name = "avatar")
    private String avatar;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
