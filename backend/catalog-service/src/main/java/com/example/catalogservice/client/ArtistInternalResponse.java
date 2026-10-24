package com.example.catalogservice.client;

import lombok.Data;
import java.util.UUID;

@Data
public class ArtistInternalResponse {
    private UUID id;
    private String stageName;
    private String avatarUrl;
    private Integer followerCount;
}
