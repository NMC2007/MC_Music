package com.example.usersservice.controller;

import com.example.usersservice.model.dto.request.PlaylistCreateRequest;
import com.example.usersservice.model.dto.request.PlaylistSongAddRequest;
import com.example.usersservice.model.dto.response.ApiResponse;
import com.example.usersservice.model.dto.response.PlaylistResponse;
import com.example.usersservice.model.dto.response.PlaylistSongResponse;
import com.example.usersservice.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/user/playlists")
public class PlaylistController {

    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return UUID.fromString((String) auth.getPrincipal());
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<PlaylistResponse>> createPlaylist(@Valid @RequestBody PlaylistCreateRequest request) {
        PlaylistResponse response = playlistService.createPlaylist(request, getCurrentUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Tạo playlist thành công"));
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<PlaylistResponse>>> getMyPlaylists() {
        List<PlaylistResponse> response = playlistService.getUserPlaylists(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách playlist thành công"));
    }

    @PostMapping("/{playlistId}/songs")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<PlaylistSongResponse>> addSongToPlaylist(
            @PathVariable UUID playlistId,
            @Valid @RequestBody PlaylistSongAddRequest request) {
        PlaylistSongResponse response = playlistService.addSongToPlaylist(playlistId, request, getCurrentUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Thêm bài hát vào playlist thành công"));
    }

    @DeleteMapping("/{playlistId}/songs/{songId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Void>> removeSongFromPlaylist(
            @PathVariable UUID playlistId,
            @PathVariable UUID songId) {
        playlistService.removeSongFromPlaylist(playlistId, songId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa bài hát khỏi playlist thành công"));
    }

    @GetMapping("/{playlistId}/songs")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<PlaylistSongResponse>>> getPlaylistSongs(@PathVariable UUID playlistId) {
        List<PlaylistSongResponse> response = playlistService.getPlaylistSongs(playlistId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách bài hát trong playlist thành công"));
    }
}
