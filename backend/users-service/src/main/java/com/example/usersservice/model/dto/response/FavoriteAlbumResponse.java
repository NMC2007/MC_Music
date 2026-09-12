package com.example.usersservice.model.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class FavoriteAlbumResponse {
    private UUID albumId;
    private String albumTitle;
    private String artistName;
    private String coverImage;
    private LocalDateTime createdAt;
}
