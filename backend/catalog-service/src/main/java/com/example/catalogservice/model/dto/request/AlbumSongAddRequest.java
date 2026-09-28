package com.example.catalogservice.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class AlbumSongAddRequest {
    @NotNull(message = "songId không được để trống")
    private UUID songId;
    
    private Integer trackNumber;
}
