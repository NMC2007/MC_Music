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

import java.io.IOException;
import java.util.List;
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
    public ResponseEntity<ApiResponse<List<AlbumResponse>>> getMyAlbums() {
        List<AlbumResponse> response = albumService.getAlbumsByOwner(getCurrentArtistId());
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
    public ResponseEntity<ApiResponse<List<SongResponse>>> getMySongs() {
        List<SongResponse> response = songService.getSongsByOwner(getCurrentArtistId());
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
}
