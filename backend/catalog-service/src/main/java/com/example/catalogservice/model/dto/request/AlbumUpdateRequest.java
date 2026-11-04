package com.example.catalogservice.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
public class AlbumUpdateRequest {

    @NotBlank(message = "Tên album không được để trống")
    private String title;

    private String description;

    private String albumType; // ALBUM, SINGLE, EP

    private LocalDate releaseDate;

    private MultipartFile coverImage;
}

