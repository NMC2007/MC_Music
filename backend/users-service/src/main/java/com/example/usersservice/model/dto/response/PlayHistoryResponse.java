package com.example.usersservice.model.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PlayHistoryResponse {
    private UUID id;
    private UUID songId;
    private String songTitle;
    private String artistName;
    private LocalDateTime playedAt;
    private Integer durationListened;
}
