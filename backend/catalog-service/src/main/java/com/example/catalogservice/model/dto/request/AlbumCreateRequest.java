package com.example.catalogservice.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;

@Data
public class AlbumCreateRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String albumType;
    private String description;
    
    // We allow uploading cover image along with the request as multipart/form-data
    private MultipartFile coverImage;
    
    private LocalDate releaseDate;
}
