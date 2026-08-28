package com.example.catalogservice.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "albums")
public class Album {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "owner_name")
    private String ownerName;

    @Column(nullable = false)
    private String title;

    @Column(name = "album_type")
    private String albumType = "ALBUM"; // ALBUM, SINGLE, EP

    @Column(name = "total_tracks")
    private Integer totalTracks = 0;

    private String description;

    @Column(name = "cover_image")
    private String coverImage;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, TAKEDOWN

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
