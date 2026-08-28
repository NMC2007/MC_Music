package com.example.catalogservice.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LyricsUpdateRequest {
    @NotBlank(message = "Nội dung lời bài hát không được để trống")
    private String content;
    
    private String language;
}
