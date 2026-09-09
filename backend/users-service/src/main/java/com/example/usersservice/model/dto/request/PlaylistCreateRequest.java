package com.example.usersservice.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PlaylistCreateRequest {
    @NotBlank(message = "Tên playlist không được để trống")
    private String name;
    private String description;
    private String coverImage;
    private Boolean isPublic = false;
}
