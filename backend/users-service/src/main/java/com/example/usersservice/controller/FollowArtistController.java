package com.example.usersservice.controller;

import com.example.usersservice.model.dto.response.ApiResponse;
import com.example.usersservice.model.dto.response.FollowArtistResponse;
import com.example.usersservice.service.FollowArtistService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    public ResponseEntity<ApiResponse<List<FollowArtistResponse>>> getUserFollowedArtists(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        List<FollowArtistResponse> data = followArtistService.getUserFollowedArtists(userId);
        return ResponseEntity.ok(ApiResponse.success(data, "Lấy danh sách nghệ sĩ đang theo dõi thành công"));
    }
}
