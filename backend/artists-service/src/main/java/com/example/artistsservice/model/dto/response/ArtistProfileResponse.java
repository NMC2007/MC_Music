package com.example.artistsservice.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtistProfileResponse {
    private UUID id;
    private String email;
    private String stageName;
    private String biography;
    private String avatarUrl;
    private String coverUrl;
    private Long followerCount;
}
