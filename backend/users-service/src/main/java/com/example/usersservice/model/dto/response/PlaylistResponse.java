package com.example.usersservice.model.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PlaylistResponse {
    private UUID id;
    private UUID userId;
    private String name;
    private String description;
    private String coverImage;
    private Boolean isPublic;
    private LocalDateTime createdAt;
}
