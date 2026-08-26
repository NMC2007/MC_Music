package com.example.catalogservice.model.dto.response;

import lombok.Data;

import java.util.UUID;

@Data
public class SongResponse {
    private UUID id;
    private String title;
    private Integer durationSeconds;
    private String audioUrl;
    private String coverImage;
    private String status;
}
