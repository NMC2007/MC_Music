package com.example.usersservice.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class PlayHistoryAddRequest {
    @NotNull(message = "ID bài hát không được để trống")
    private UUID songId;
    private Integer durationListened;
}
