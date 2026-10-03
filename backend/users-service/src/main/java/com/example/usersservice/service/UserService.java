package com.example.usersservice.service;

import com.example.usersservice.exception.ApiException;
import com.example.usersservice.model.dto.request.UserProfileUpdateRequest;
import com.example.usersservice.model.dto.response.UserProfileResponse;
import com.example.usersservice.model.entity.User;
import com.example.usersservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final ModelMapper modelMapper;

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        return modelMapper.map(user, UserProfileResponse.class);
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UserProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        boolean hasFullName = request != null && request.getFullName() != null && !request.getFullName().trim().isEmpty();
        boolean hasAvatar = request != null && request.getAvatarFile() != null && !request.getAvatarFile().isEmpty();

        if (!hasFullName && !hasAvatar) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng cung cấp ít nhất một thông tin cần cập nhật (tên hoặc ảnh đại diện)");
        }

        // Cập nhật tên nếu có truyền lên
        if (hasFullName) {
            String newName = request.getFullName().trim();
            if (newName.length() < 2 || newName.length() > 50) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Tên phải từ 2 đến 50 ký tự");
            }
            user.setFullName(newName);
        }

        // Upload ảnh avatar nếu có file truyền vào
        MultipartFile avatarFile = request.getAvatarFile();
        if (avatarFile != null && !avatarFile.isEmpty()) {
            try {
                // CloudinaryService đã validate định dạng bên trong (chỉ jpg/jpeg/png)
                Map uploadResult = cloudinaryService.uploadAvatar(avatarFile);
                user.setAvatarUrl((String) uploadResult.get("secure_url"));
            } catch (ApiException e) {
                // Re-throw ApiException (lỗi validate định dạng file) để controller trả về chuẩn
                throw e;
            } catch (IOException e) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Upload ảnh thất bại, vui lòng thử lại sau");
            }
        }

        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserProfileResponse.class);
    }
}

