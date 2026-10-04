package com.example.usersservice.controller;

import com.example.usersservice.model.dto.response.ApiResponse;
import com.example.usersservice.model.dto.response.FavoriteResponse;
import com.example.usersservice.service.FavoriteService;
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
@RequestMapping("/api/user/favorites")
@PreAuthorize("hasRole('USER')")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{songId}")
    public ResponseEntity<ApiResponse<Void>> addFavorite(
            @PathVariable UUID songId,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        favoriteService.addFavorite(userId, songId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(null, "Đã thêm vào danh sách yêu thích"));
    }

    @DeleteMapping("/{songId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @PathVariable UUID songId,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        favoriteService.removeFavorite(userId, songId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa khỏi danh sách yêu thích"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<FavoriteResponse>>> getUserFavorites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        Pageable pageable = PageRequest.of(page, size);
        Page<FavoriteResponse> data = favoriteService.getUserFavorites(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(data, "Lấy danh sách yêu thích thành công"));
    }

    @PostMapping("/albums/{albumId}")
    public ResponseEntity<ApiResponse<Void>> addFavoriteAlbum(
            @PathVariable UUID albumId,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        favoriteService.addFavoriteAlbum(userId, albumId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(null, "Đã thêm album vào danh sách yêu thích"));
    }

    @DeleteMapping("/albums/{albumId}")
    public ResponseEntity<ApiResponse<Void>> removeFavoriteAlbum(
            @PathVariable UUID albumId,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        favoriteService.removeFavoriteAlbum(userId, albumId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa album khỏi danh sách yêu thích"));
    }

    @GetMapping("/albums")
    public ResponseEntity<ApiResponse<Page<com.example.usersservice.model.dto.response.FavoriteAlbumResponse>>> getUserFavoriteAlbums(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        Pageable pageable = PageRequest.of(page, size);
        Page<com.example.usersservice.model.dto.response.FavoriteAlbumResponse> data = favoriteService.getUserFavoriteAlbums(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(data, "Lấy danh sách album yêu thích thành công"));
    }
}
