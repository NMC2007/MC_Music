package com.example.usersservice.model.dto.request;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class PlaylistUpdateRequest {

    private String name;

    private String description;

    // Hỗ trợ upload file ảnh bìa qua form-data với tên trường coverImage hoặc coverFile
    private MultipartFile coverImage;
    private MultipartFile coverFile;

    private Boolean isPublic;

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
