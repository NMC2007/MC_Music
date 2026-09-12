package com.example.usersservice.model.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class FollowArtistResponse {
    private UUID artistId;
    private String artistName;
    private String avatar;
    private LocalDateTime createdAt;
}
