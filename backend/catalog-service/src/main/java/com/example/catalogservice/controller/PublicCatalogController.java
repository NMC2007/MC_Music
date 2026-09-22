package com.example.catalogservice.controller;

import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.dto.response.ApiResponse;
import com.example.catalogservice.model.dto.response.GenreResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.service.PublicCatalogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/catalog/public")
public class PublicCatalogController {

    // Whitelist các field được phép sort để tránh SQL Injection qua tên field
    private static final Set<String> SONG_SORTABLE_FIELDS = Set.of(
            "playCount", "likeCount", "createdAt", "title"
    );
    private static final Set<String> ALBUM_SORTABLE_FIELDS = Set.of(
            "likeCount", "createdAt", "title", "releaseDate", "totalTracks"
    );

    private final PublicCatalogService publicCatalogService;

    public PublicCatalogController(PublicCatalogService publicCatalogService) {
        this.publicCatalogService = publicCatalogService;
    }

    /**
     * Tạo Sort an toàn từ tham số sort của client.
     * Định dạng: "field,direction" (VD: "playCount,desc") hoặc "field" (mặc định DESC).
     * Nếu field không nằm trong whitelist, trả về sort mặc định theo createdAt DESC.
     */
    private Sort buildSafeSort(String sortParam, Set<String> allowedFields, String defaultField) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Direction.DESC, defaultField);
        }
        String[] parts = sortParam.split(",");
        String field = parts[0].trim();
        Sort.Direction direction = Sort.Direction.DESC;
        if (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc")) {
            direction = Sort.Direction.ASC;
        }
        if (!allowedFields.contains(field)) {
            return Sort.by(Sort.Direction.DESC, defaultField);
        }
        return Sort.by(direction, field);
    }

    @GetMapping("/songs")
    public ResponseEntity<ApiResponse<Page<SongResponse>>> getPublicSongs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID genreId,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Sort resolvedSort = buildSafeSort(sort, SONG_SORTABLE_FIELDS, "createdAt");
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
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
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Sort resolvedSort = buildSafeSort(sort, ALBUM_SORTABLE_FIELDS, "createdAt");
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        Page<AlbumResponse> albums = publicCatalogService.getPublicAlbums(pageable);
        return ResponseEntity.ok(ApiResponse.success(albums, "Lấy danh sách album thành công"));
    }

    @GetMapping("/artists/{artistId}/songs")
    public ResponseEntity<ApiResponse<Page<SongResponse>>> getSongsByArtist(
            @PathVariable UUID artistId,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Sort resolvedSort = buildSafeSort(sort, SONG_SORTABLE_FIELDS, "createdAt");
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        Page<SongResponse> songs = publicCatalogService.getSongsByArtist(artistId, pageable);
        return ResponseEntity.ok(ApiResponse.success(songs, "Lấy danh sách bài hát của nghệ sĩ thành công"));
    }

    @GetMapping("/artists/{artistId}/albums")
    public ResponseEntity<ApiResponse<Page<AlbumResponse>>> getAlbumsByArtist(
            @PathVariable UUID artistId,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Sort resolvedSort = buildSafeSort(sort, ALBUM_SORTABLE_FIELDS, "createdAt");
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        Page<AlbumResponse> albums = publicCatalogService.getAlbumsByArtist(artistId, pageable);
        return ResponseEntity.ok(ApiResponse.success(albums, "Lấy danh sách album của nghệ sĩ thành công"));
    }

    @GetMapping("/albums/{albumId}/songs")
    public ResponseEntity<ApiResponse<Page<SongResponse>>> getSongsByAlbum(
            @PathVariable UUID albumId,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Sort resolvedSort = buildSafeSort(sort, SONG_SORTABLE_FIELDS, "createdAt");
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        Page<SongResponse> songs = publicCatalogService.getSongsByAlbum(albumId, pageable);
        return ResponseEntity.ok(ApiResponse.success(songs, "Lấy danh sách bài hát trong album thành công"));
    }
}
