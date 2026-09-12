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

import java.util.List;
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
    public ResponseEntity<ApiResponse<List<PlayHistoryResponse>>> getUserPlayHistory(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        List<PlayHistoryResponse> data = playHistoryService.getUserPlayHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(data, "Lấy lịch sử nghe nhạc thành công"));
    }
}
