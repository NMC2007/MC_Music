package com.example.catalogservice.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;
import java.util.List;

@Data
public class SongUploadRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private UUID albumId;
    
    private Integer trackNumber;
    
    @NotNull(message = "Audio file is required")
    private MultipartFile audioFile;
    
    private MultipartFile coverImage;
    
    private Boolean explicit = false;
    
    private List<UUID> genreIds;
}
