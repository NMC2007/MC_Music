package com.example.artistsservice.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtistProfileUpdateRequest {
    
    @NotBlank(message = "Tên nghệ danh không được để trống")
    private String stageName;
    
    private String biography;
    
    private MultipartFile avatarFile;
    
    private MultipartFile coverFile;
}
