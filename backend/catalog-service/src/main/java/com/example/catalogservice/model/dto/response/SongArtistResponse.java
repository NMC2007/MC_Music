package com.example.catalogservice.model.dto.response;

import lombok.Data;
import java.util.UUID;

@Data
public class SongArtistResponse {
    private UUID artistId;
    private String artistName;
    private String role;
}
