package com.example.catalogservice.model.dto.response;

import lombok.Data;

import java.util.UUID;

@Data
public class AlbumResponse {
    private UUID id;
    private String title;
    private String albumType;
    private String description;
    private String coverImage;
    private String status;
}
