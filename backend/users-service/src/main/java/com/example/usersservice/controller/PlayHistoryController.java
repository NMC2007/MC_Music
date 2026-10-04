package com.example.usersservice.controller;

import com.example.usersservice.model.dto.request.PlayHistoryAddRequest;
import com.example.usersservice.model.dto.response.ApiResponse;
import com.example.usersservice.model.dto.response.PlayHistoryResponse;
import com.example.usersservice.service.PlayHistoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@RestController
@RequestMapping("/api/user/history")
@PreAuthorize("hasRole('USER')")
public class PlayHistoryController {

    private final PlayHistoryService playHistoryService;

    public PlayHistoryController(PlayHistoryService playHistoryService) {
        this.playHistoryService = playHistoryService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> addPlayHistory(
            @Valid @RequestBody PlayHistoryAddRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        playHistoryService.addPlayHistory(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(null, "Đã ghi nhận lịch sử nghe nhạc"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PlayHistoryResponse>>> getUserPlayHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        Pageable pageable = PageRequest.of(page, size);
        Page<PlayHistoryResponse> data = playHistoryService.getUserPlayHistory(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(data, "Lấy lịch sử nghe nhạc thành công"));
    }
}
