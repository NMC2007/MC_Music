package com.example.catalogservice.model.dto.response;

import lombok.Data;
import java.util.UUID;

@Data
public class GenreResponse {
    private UUID id;
    private String name;
    private String coverImage;
}
