package com.example.catalogservice.controller;

import com.example.catalogservice.model.dto.request.AlbumCreateRequest;
import com.example.catalogservice.model.dto.request.AlbumSongAddRequest;
import com.example.catalogservice.model.dto.request.AlbumSongReorderRequest;
import com.example.catalogservice.model.dto.request.AlbumUpdateRequest;
import com.example.catalogservice.model.dto.request.LyricsUpdateRequest;
import com.example.catalogservice.model.dto.request.SongArtistAddRequest;
import com.example.catalogservice.model.dto.request.SongUploadRequest;
import com.example.catalogservice.model.dto.request.SongUpdateRequest;
import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.dto.response.ApiResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.service.AlbumService;
import com.example.catalogservice.service.SongService;
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

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/catalog/artist")
@PreAuthorize("hasRole('ARTIST')")
public class ArtistCatalogController {

    private final AlbumService albumService;
    private final SongService songService;

    public ArtistCatalogController(AlbumService albumService, SongService songService) {
        this.albumService = albumService;
        this.songService = songService;
    }
    
    private UUID getCurrentArtistId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return UUID.fromString((String) auth.getPrincipal());
    }

    // ==========================================
    // 1. ALBUMS MANAGEMENT
    // ==========================================
    
    @PostMapping(value = "/albums", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AlbumResponse>> createAlbum(
            @Valid @ModelAttribute AlbumCreateRequest request) throws IOException {
        AlbumResponse response = albumService.createAlbum(request, getCurrentArtistId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Tạo album thành công"));
    }

    @GetMapping("/albums")
    public ResponseEntity<ApiResponse<Page<AlbumResponse>>> getMyAlbums(
            @RequestParam(required = false) Boolean isDeleted,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AlbumResponse> response = albumService.getAlbumsByOwner(getCurrentArtistId(), isDeleted, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách album thành công"));
    }

    @PutMapping(value = "/albums/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AlbumResponse>> updateAlbum(
            @PathVariable UUID id,
            @Valid @ModelAttribute AlbumUpdateRequest request) throws IOException {
        AlbumResponse response = albumService.updateAlbum(id, request, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật album thành công, trạng thái chuyển về chờ duyệt"));
    }

    @DeleteMapping("/albums/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAlbum(@PathVariable UUID id) {
        albumService.softDeleteAlbum(id, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa album và các bài hát trong album thành công"));
    }

    @PutMapping("/albums/{id}/restore")
    public ResponseEntity<ApiResponse<AlbumResponse>> restoreAlbum(@PathVariable UUID id) {
        AlbumResponse response = albumService.restoreAlbum(id, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(response, "Khôi phục album và các bài hát thành công"));
    }

    @PostMapping("/albums/{albumId}/songs")
    public ResponseEntity<ApiResponse<Void>> addSongToAlbum(
            @PathVariable UUID albumId,
            @Valid @RequestBody AlbumSongAddRequest request) {
        songService.addSongToAlbum(albumId, request, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(null, "Thêm bài hát vào album thành công"));
    }

    @DeleteMapping("/albums/{albumId}/songs/{songId}")
    public ResponseEntity<ApiResponse<Void>> removeSongFromAlbum(
            @PathVariable UUID albumId,
            @PathVariable UUID songId) {
        albumService.removeSongFromAlbum(albumId, songId, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(null, "Gỡ bài hát khỏi album thành công"));
    }

    @PutMapping("/albums/{albumId}/songs/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderSongsInAlbum(
            @PathVariable UUID albumId,
            @Valid @RequestBody AlbumSongReorderRequest request) {
        songService.reorderSongsInAlbum(albumId, request, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(null, "Cập nhật thứ tự bài hát thành công"));
    }

    // ==========================================
    // 2. SONGS MANAGEMENT
    // ==========================================

    @PostMapping(value = "/songs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<SongResponse>> uploadSong(
            @Valid @ModelAttribute SongUploadRequest request) throws IOException {
        SongResponse response = songService.uploadSong(request, getCurrentArtistId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Upload nhạc thành công"));
    }

    @GetMapping({"/songs", "/song"})
    public ResponseEntity<ApiResponse<Page<SongResponse>>> getMySongs(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isDeleted,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<SongResponse> response = songService.getSongsByOwner(getCurrentArtistId(), status, isDeleted, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách bài hát thành công"));
    }

    @PutMapping(value = "/songs/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<SongResponse>> updateSong(
            @PathVariable UUID id,
            @Valid @ModelAttribute SongUpdateRequest request) throws IOException {
        SongResponse response = songService.updateSong(id, request, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật bài hát thành công, trạng thái chuyển về chờ duyệt"));
    }

    @DeleteMapping("/songs/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSong(@PathVariable UUID id) {
        songService.softDeleteSong(id, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa bài hát thành công"));
    }

    @PutMapping("/songs/{id}/restore")
    public ResponseEntity<ApiResponse<SongResponse>> restoreSong(@PathVariable UUID id) {
        SongResponse response = songService.restoreSong(id, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(response, "Khôi phục bài hát thành công"));
    }

    @PostMapping("/songs/{songId}/lyrics")
    public ResponseEntity<ApiResponse<Void>> updateLyrics(
            @PathVariable UUID songId,
            @Valid @RequestBody LyricsUpdateRequest request) {
        songService.updateLyrics(songId, request, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(null, "Cập nhật lời bài hát thành công"));
    }

    @PostMapping("/songs/{songId}/artists")
    public ResponseEntity<ApiResponse<Void>> addSongArtist(
            @PathVariable UUID songId,
            @Valid @RequestBody SongArtistAddRequest request) {
        songService.addSongArtist(songId, request, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(null, "Thêm nghệ sĩ phụ thành công"));
    }

    @DeleteMapping("/songs/{songId}/artists/{artistId}")
    public ResponseEntity<ApiResponse<Void>> removeSongArtist(
            @PathVariable UUID songId,
            @PathVariable UUID artistId) {
        songService.removeSongArtist(songId, artistId, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa nghệ sĩ phụ thành công"));
    }
}
