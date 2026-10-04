package com.example.catalogservice.controller;

import com.example.catalogservice.model.dto.request.AlbumCreateRequest;
import com.example.catalogservice.model.dto.request.SongUploadRequest;
import com.example.catalogservice.model.dto.request.LyricsUpdateRequest;
import com.example.catalogservice.model.dto.request.SongArtistAddRequest;
import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.dto.response.ApiResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.service.AlbumService;
import com.example.catalogservice.service.SongService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/catalog/artist")
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

    // ALBUMS
    
    @PostMapping("/albums")
    public ResponseEntity<ApiResponse<AlbumResponse>> createAlbum(
            @Valid @ModelAttribute AlbumCreateRequest request) throws IOException {
        AlbumResponse response = albumService.createAlbum(request, getCurrentArtistId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Tạo album thành công"));
    }

    @GetMapping("/albums")
    public ResponseEntity<ApiResponse<Page<AlbumResponse>>> getMyAlbums(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AlbumResponse> response = albumService.getAlbumsByOwner(getCurrentArtistId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách album thành công"));
    }

    // SONGS

    @PostMapping("/songs")
    public ResponseEntity<ApiResponse<SongResponse>> uploadSong(
            @Valid @ModelAttribute SongUploadRequest request) throws IOException {
        SongResponse response = songService.uploadSong(request, getCurrentArtistId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Upload nhạc thành công"));
    }

    @GetMapping("/songs")
    public ResponseEntity<ApiResponse<Page<SongResponse>>> getMySongs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<SongResponse> response = songService.getSongsByOwner(getCurrentArtistId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách bài hát thành công"));
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

    @PostMapping("/albums/{albumId}/songs")
    public ResponseEntity<ApiResponse<Void>> addSongToAlbum(
            @PathVariable UUID albumId,
            @Valid @RequestBody com.example.catalogservice.model.dto.request.AlbumSongAddRequest request) {
        songService.addSongToAlbum(albumId, request, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(null, "Thêm bài hát vào album thành công"));
    }

    @PutMapping("/albums/{albumId}/songs/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderSongsInAlbum(
            @PathVariable UUID albumId,
            @Valid @RequestBody com.example.catalogservice.model.dto.request.AlbumSongReorderRequest request) {
        songService.reorderSongsInAlbum(albumId, request, getCurrentArtistId());
        return ResponseEntity.ok(ApiResponse.success(null, "Cập nhật thứ tự bài hát thành công"));
    }
}
