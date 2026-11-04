package com.example.catalogservice.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Data
public class SongUpdateRequest {

    @NotBlank(message = "Tên bài hát không được để trống")
    private String title;

    private List<UUID> genreIds;

    private MultipartFile coverImage;

    private UUID albumId;

    private Boolean clearAlbum = false;

    private Integer trackNumber;

    private Boolean explicit;
}

