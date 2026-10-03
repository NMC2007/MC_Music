package com.example.artistsservice.controller;

import com.example.artistsservice.model.dto.request.ArtistProfileUpdateRequest;
import com.example.artistsservice.model.dto.response.ApiResponse;
import com.example.artistsservice.model.dto.response.ArtistDashboardResponse;
import com.example.artistsservice.model.dto.response.ArtistProfileResponse;
import com.example.artistsservice.service.ArtistService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/artist")
@PreAuthorize("hasRole('ARTIST')")
public class ArtistController {

    private final ArtistService artistService;

    public ArtistController(ArtistService artistService) {
        this.artistService = artistService;
    }

    private UUID getCurrentArtistId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return UUID.fromString((String) authentication.getPrincipal());
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ArtistProfileResponse>> getCurrentProfile() {
        ArtistProfileResponse response = artistService.getCurrentProfile(getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy hồ sơ nghệ sĩ thành công"));
    }

    @PutMapping(value = "/me", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<ArtistProfileResponse>> updateProfile(
            @Valid @ModelAttribute ArtistProfileUpdateRequest request) {
        ArtistProfileResponse response = artistService.updateProfile(getCurrentArtistId(), request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật hồ sơ nghệ sĩ thành công"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<ArtistDashboardResponse>> getDashboardStats() {
        ArtistDashboardResponse response = artistService.getDashboardStats(getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thống kê dashboard thành công"));
    }
}
