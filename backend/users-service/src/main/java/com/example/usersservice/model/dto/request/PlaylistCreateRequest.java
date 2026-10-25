package com.example.usersservice.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class PlaylistCreateRequest {
    @NotBlank(message = "Tên playlist không được để trống")
    private String name;

    private String description;

    // Hỗ trợ upload file ảnh bìa qua form-data với tên trường coverImage hoặc coverFile
    private MultipartFile coverImage;
    private MultipartFile coverFile;

    // Mặc định là false (danh sách phát riêng tư)
    private Boolean isPublic = false;

    public MultipartFile getEffectiveCoverFile() {
        if (coverImage != null && !coverImage.isEmpty()) {
            return coverImage;
        }
        if (coverFile != null && !coverFile.isEmpty()) {
            return coverFile;
        }
        return null;
    }
}

