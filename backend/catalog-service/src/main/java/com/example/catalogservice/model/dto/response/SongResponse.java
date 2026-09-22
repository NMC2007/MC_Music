package com.example.catalogservice.model.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class SongResponse {
    private UUID id;
    private UUID ownerId;
    private String ownerName;
    private String title;
    private Integer durationSeconds;
    private String audioUrl;
    private String coverImage;
    private Boolean explicit;
    private Integer playCount;
    private Integer likeCount;
    private String status;
    private LocalDateTime createdAt;
    private List<SongArtistResponse> artists;
    private List<GenreResponse> genres;
}
