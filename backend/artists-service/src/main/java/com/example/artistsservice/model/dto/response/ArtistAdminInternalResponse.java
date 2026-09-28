package com.example.artistsservice.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtistAdminInternalResponse {
    private UUID id;
    private String email;
    private String stageName;
    private String avatarUrl;
    private Boolean isActive;
    private Integer followerCount;
    private LocalDateTime createdAt;
}
