package com.example.catalogservice.controller;

import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.dto.response.ApiResponse;
import com.example.catalogservice.model.dto.response.GenreResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.service.PublicCatalogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/catalog/public")
public class PublicCatalogController {

    private final PublicCatalogService publicCatalogService;

    public PublicCatalogController(PublicCatalogService publicCatalogService) {
        this.publicCatalogService = publicCatalogService;
    }

    @GetMapping("/songs")
    public ResponseEntity<ApiResponse<Page<SongResponse>>> getPublicSongs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID genreId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<SongResponse> result = publicCatalogService.searchPublicSongs(keyword, genreId, pageable);
        return ResponseEntity.ok(ApiResponse.success(result, "Lấy danh sách bài hát thành công"));
    }

    @GetMapping("/genres")
    public ResponseEntity<ApiResponse<List<GenreResponse>>> getAllGenres() {
        List<GenreResponse> genres = publicCatalogService.getAllGenres();
        return ResponseEntity.ok(ApiResponse.success(genres, "Lấy danh sách thể loại thành công"));
    }

    @GetMapping("/albums")
    public ResponseEntity<ApiResponse<Page<AlbumResponse>>> getPublicAlbums(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AlbumResponse> albums = publicCatalogService.getPublicAlbums(pageable);
        return ResponseEntity.ok(ApiResponse.success(albums, "Lấy danh sách album thành công"));
    }

    @GetMapping("/artists/{artistId}/songs")
    public ResponseEntity<ApiResponse<Page<SongResponse>>> getSongsByArtist(
            @PathVariable UUID artistId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SongResponse> songs = publicCatalogService.getSongsByArtist(artistId, pageable);
        return ResponseEntity.ok(ApiResponse.success(songs, "Lấy danh sách bài hát của nghệ sĩ thành công"));
    }

    @GetMapping("/artists/{artistId}/albums")
    public ResponseEntity<ApiResponse<Page<AlbumResponse>>> getAlbumsByArtist(
            @PathVariable UUID artistId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AlbumResponse> albums = publicCatalogService.getAlbumsByArtist(artistId, pageable);
        return ResponseEntity.ok(ApiResponse.success(albums, "Lấy danh sách album của nghệ sĩ thành công"));
    }
}
