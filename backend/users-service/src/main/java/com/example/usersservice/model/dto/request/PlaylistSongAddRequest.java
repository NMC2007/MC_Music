package com.example.usersservice.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class PlaylistSongAddRequest {
    @NotNull(message = "songId không được để trống")
    private UUID songId;
}
