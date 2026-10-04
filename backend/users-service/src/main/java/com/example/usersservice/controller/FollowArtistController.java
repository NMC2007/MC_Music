package com.example.usersservice.controller;

import com.example.usersservice.model.dto.response.ApiResponse;
import com.example.usersservice.model.dto.response.FollowArtistResponse;
import com.example.usersservice.service.FollowArtistService;
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
@RequestMapping("/api/user/follows/artists")
@PreAuthorize("hasRole('USER')")
public class FollowArtistController {

    private final FollowArtistService followArtistService;

    public FollowArtistController(FollowArtistService followArtistService) {
        this.followArtistService = followArtistService;
    }

    @PostMapping("/{artistId}")
    public ResponseEntity<ApiResponse<Void>> followArtist(
            @PathVariable UUID artistId,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        followArtistService.followArtist(userId, artistId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(null, "Đã theo dõi nghệ sĩ"));
    }

    @DeleteMapping("/{artistId}")
    public ResponseEntity<ApiResponse<Void>> unfollowArtist(
            @PathVariable UUID artistId,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        followArtistService.unfollowArtist(userId, artistId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã hủy theo dõi nghệ sĩ"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<FollowArtistResponse>>> getUserFollowedArtists(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        Pageable pageable = PageRequest.of(page, size);
        Page<FollowArtistResponse> data = followArtistService.getUserFollowedArtists(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(data, "Lấy danh sách nghệ sĩ đang theo dõi thành công"));
    }
}
