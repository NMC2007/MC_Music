package com.example.catalogservice.model.dto.response;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SongResponse {
    private UUID id;
    private String title;
    private Integer durationSeconds;
    private String audioUrl;
    private String coverImage;
    private String status;
    private String ownerName;
    private List<SongArtistResponse> artists;
    private List<GenreResponse> genres;
}
