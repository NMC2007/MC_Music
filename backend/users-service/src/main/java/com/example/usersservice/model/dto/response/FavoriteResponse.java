package com.example.usersservice.model.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class FavoriteResponse {
    private UUID songId;
    private String songTitle;
    private String artistName;
    private String coverImage;
    private LocalDateTime createdAt;
}
