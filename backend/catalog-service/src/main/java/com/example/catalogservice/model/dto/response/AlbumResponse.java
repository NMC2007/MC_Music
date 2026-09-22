package com.example.catalogservice.model.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AlbumResponse {
    private UUID id;
    private UUID ownerId;
    private String ownerName;
    private String title;
    private String albumType;
    private Integer totalTracks;
    private String description;
    private String coverImage;
    private LocalDate releaseDate;
    private String status;
    private Integer likeCount;
    private LocalDateTime createdAt;
}
