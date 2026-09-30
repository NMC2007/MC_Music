package com.example.adminservice.controller;

import com.example.adminservice.client.UserServiceClient;
import com.example.adminservice.model.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserServiceClient userServiceClient;

    public AdminUserController(UserServiceClient userServiceClient) {
        this.userServiceClient = userServiceClient;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort) {
        Map<String, Object> response = userServiceClient.getAllUsers(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách người dùng thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserById(@PathVariable UUID id) {
        Map<String, Object> response = userServiceClient.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin người dùng thành công"));
    }

    /**
     * Khóa hoặc mở khóa tài khoản User.
     * Admin gọi endpoint này, Admin Service sẽ tiếp tục gọi Internal API sang User Service.
     * Body: { "isActive": true } để mở khóa, { "isActive": false } để khóa.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> payload) {
        Boolean isActive = payload.get("isActive");
        if (isActive == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "Trường 'isActive' là bắt buộc"));
        }
        userServiceClient.updateUserStatus(id, payload);
        String message = Boolean.TRUE.equals(isActive)
                ? "Mở khóa tài khoản thành công"
                : "Khóa tài khoản thành công";
        return ResponseEntity.ok(ApiResponse.success(null, message));
    }
}
