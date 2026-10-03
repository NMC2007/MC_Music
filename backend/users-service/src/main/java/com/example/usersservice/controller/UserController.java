package com.example.usersservice.controller;

import com.example.usersservice.model.dto.request.UserProfileUpdateRequest;
import com.example.usersservice.model.dto.response.ApiResponse;
import com.example.usersservice.model.dto.response.UserProfileResponse;
import com.example.usersservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return UUID.fromString((String) authentication.getPrincipal());
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentProfile() {
        UserProfileResponse response = userService.getCurrentProfile(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin profile thành công"));
    }

    /**
     * Cập nhật profile người dùng.
     * Content-Type: multipart/form-data
     * - fullName: String (bắt buộc)
     * - avatarFile: File (không bắt buộc, chỉ chấp nhận jpg/jpeg/png, tối đa 5MB)
     */
    @PutMapping(value = "/me", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @ModelAttribute UserProfileUpdateRequest request) {
        UserProfileResponse response = userService.updateProfile(getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật thông tin profile thành công"));
    }
}

