package com.example.catalogservice.model.dto.response;

import lombok.Data;
import java.util.UUID;

@Data
public class LyricsResponse {
    private UUID id;
    private String content;
    private String language;
}
