package com.example.usersservice.controller;

import com.example.usersservice.model.dto.request.PlaylistCreateRequest;
import com.example.usersservice.model.dto.request.PlaylistSongAddRequest;
import com.example.usersservice.model.dto.request.PlaylistUpdateRequest;
import com.example.usersservice.model.dto.response.ApiResponse;
import com.example.usersservice.model.dto.response.PlaylistResponse;
import com.example.usersservice.model.dto.response.PlaylistSongResponse;
import com.example.usersservice.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<PlaylistResponse>> createPlaylist(
            @Valid @ModelAttribute PlaylistCreateRequest request) {
        PlaylistResponse response = playlistService.createPlaylist(request, getCurrentUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Tạo playlist thành công"));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<PlaylistResponse>> createPlaylistJson(
            @Valid @RequestBody PlaylistCreateRequest request) {
        PlaylistResponse response = playlistService.createPlaylist(request, getCurrentUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Tạo playlist thành công"));
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Page<PlaylistResponse>>> getMyPlaylists(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PlaylistResponse> response = playlistService.getUserPlaylists(getCurrentUserId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách playlist thành công"));
    }

    @GetMapping("/{playlistId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<PlaylistResponse>> getPlaylistById(
            @PathVariable UUID playlistId) {
        PlaylistResponse response = playlistService.getPlaylistById(playlistId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin playlist thành công"));
    }

    @PutMapping(value = "/{playlistId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<PlaylistResponse>> updatePlaylist(
            @PathVariable UUID playlistId,
            @Valid @ModelAttribute PlaylistUpdateRequest request) {
        PlaylistResponse response = playlistService.updatePlaylist(playlistId, request, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật playlist thành công"));
    }

    @DeleteMapping("/{playlistId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Void>> deletePlaylist(
            @PathVariable UUID playlistId) {
        playlistService.deletePlaylist(playlistId, getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa playlist thành công"));
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
    public ResponseEntity<ApiResponse<Page<PlaylistSongResponse>>> getPlaylistSongs(
            @PathVariable UUID playlistId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PlaylistSongResponse> response = playlistService.getPlaylistSongs(playlistId, getCurrentUserId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách bài hát trong playlist thành công"));
    }
}
