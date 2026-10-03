package com.example.usersservice.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.usersservice.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class CloudinaryService {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png"
    );
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png"
    );

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    /**
     * Validates and uploads image (avatar) to Cloudinary.
     * Only accepts jpg, jpeg, and png files.
     */
    public Map uploadAvatar(MultipartFile file) throws IOException {
        validateImageFile(file);
        return cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("resource_type", "image", "folder", "mcmusic/avatars")
        );
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File ảnh không được để trống");
        }

        // Validate by Content-Type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Định dạng file không hợp lệ. Chỉ chấp nhận JPG và PNG");
        }

        // Validate by file extension (defense in depth)
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tên file không hợp lệ");
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Phần mở rộng file không hợp lệ. Chỉ chấp nhận .jpg, .jpeg, .png");
        }
    }
}
