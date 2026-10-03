package com.example.usersservice.controller;

import com.example.usersservice.model.dto.response.UserInternalResponse;
import com.example.usersservice.model.entity.User;
import com.example.usersservice.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.example.usersservice.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/internal/users")
public class InternalUserController {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("email", "fullName", "createdAt");

    private final UserRepository userRepository;

    public InternalUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<Page<UserInternalResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "createdAt,desc") String sort) {
        
        Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            Sort.Direction direction = Sort.Direction.DESC;
            if (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc")) {
                direction = Sort.Direction.ASC;
            }
            if (!ALLOWED_SORT_FIELDS.contains(field)) {
                field = "createdAt";
            }
            sortObj = Sort.by(direction, field);
        }
        
        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<User> users = userRepository.findAll(pageable);
        
        Page<UserInternalResponse> response = users.map(user -> UserInternalResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build());
                
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserInternalResponse> getUserById(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với ID: " + id));
                
        UserInternalResponse response = UserInternalResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
                
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật trạng thái khóa/mở khóa tài khoản User.
     * Chỉ được gọi từ Admin Service thông qua Internal API (yêu cầu header X-Internal-Secret).
     */
    @PatchMapping("/{id}/status")
    @Transactional
    public ResponseEntity<Void> updateUserStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> payload) {
        Boolean isActive = payload.get("isActive");
        if (isActive == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trường 'isActive' là bắt buộc");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng với ID: " + id));
        user.setIsActive(isActive);
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }
}
