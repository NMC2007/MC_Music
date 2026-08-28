package com.example.catalogservice.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class SongArtistAddRequest {
    @NotNull(message = "artistId không được để trống")
    private UUID artistId;
    
    @NotBlank(message = "role không được để trống (VD: FEATURED, PRODUCER)")
    private String role;
}
