package com.example.usersservice.model.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

@Data
public class UserProfileUpdateRequest {
    // Optional: tên hiển thị mới (nếu truyền lên sẽ được cập nhật)
    private String fullName;

    // Optional: file ảnh avatar (chỉ chấp nhận jpg, jpeg, png)
    private MultipartFile avatarFile;
}

