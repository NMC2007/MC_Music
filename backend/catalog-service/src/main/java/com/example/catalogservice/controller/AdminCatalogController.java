package com.example.catalogservice.controller;

import com.example.catalogservice.model.dto.request.UpdateStatusRequest;
import com.example.catalogservice.model.dto.response.ApiResponse;
import com.example.catalogservice.model.dto.response.LyricsResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.service.SongService;
import com.example.catalogservice.service.AlbumService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/catalog/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminCatalogController {

    private static final Set<String> SONG_SORTABLE_FIELDS = Set.of(
            "playCount", "likeCount", "createdAt", "title"
    );
    private static final Set<String> ALBUM_SORTABLE_FIELDS = Set.of(
            "likeCount", "createdAt", "title", "releaseDate", "totalTracks"
    );

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

    private final SongService songService;
    private final AlbumService albumService;

    public AdminCatalogController(SongService songService, AlbumService albumService) {
        this.songService = songService;
        this.albumService = albumService;
    }

    @GetMapping("/songs/pending")
    public ResponseEntity<ApiResponse<Page<SongResponse>>> getPendingSongs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort) {
        
        Sort sortObj = buildSafeSort(sort, SONG_SORTABLE_FIELDS, "createdAt");
        
        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<SongResponse> response = songService.getSongsByStatus("PENDING", pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách bài hát chờ duyệt thành công"));
    }

    @PatchMapping(value = {"/songs/{songId}/status", "/songs/{songId}"})
    public ResponseEntity<ApiResponse<Void>> updateSongStatus(
            @PathVariable UUID songId,
            @Valid @RequestBody UpdateStatusRequest request) {
        String status = request.getStatus();
        String rejectionReason = request.getRejectionReason();
        
        if (("REJECTED".equals(status) || "TAKEDOWN".equals(status)) && (rejectionReason == null || rejectionReason.trim().isEmpty())) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lý do vi phạm không được để trống khi từ chối hoặc gỡ bài hát"));
        }
        
        songService.updateSongStatus(songId, status, rejectionReason);
        return ResponseEntity.ok(ApiResponse.success(null, "Cập nhật trạng thái bài hát thành công"));
    }

    @GetMapping("/albums/pending")
    public ResponseEntity<ApiResponse<Page<AlbumResponse>>> getPendingAlbums(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort) {
        Sort sortObj = buildSafeSort(sort, ALBUM_SORTABLE_FIELDS, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<AlbumResponse> response = albumService.getAlbumsByStatus("PENDING", pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách album chờ duyệt thành công"));
    }

    @PatchMapping(value = {"/albums/{albumId}/status", "/albums/{albumId}"})
    public ResponseEntity<ApiResponse<Void>> updateAlbumStatus(
            @PathVariable UUID albumId,
            @Valid @RequestBody UpdateStatusRequest request) {
        String status = request.getStatus();
        String rejectionReason = request.getRejectionReason();
        
        if (("REJECTED".equals(status) || "TAKEDOWN".equals(status)) && (rejectionReason == null || rejectionReason.trim().isEmpty())) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Lý do vi phạm không được để trống khi từ chối hoặc gỡ album"));
        }
        
        albumService.updateAlbumStatus(albumId, status, rejectionReason);
        return ResponseEntity.ok(ApiResponse.success(null, "Cập nhật trạng thái album thành công"));
    }

    @GetMapping("/songs/{songId}/lyrics")
    public ResponseEntity<ApiResponse<LyricsResponse>> getSongLyrics(@PathVariable UUID songId) {
        LyricsResponse response = songService.getLyrics(songId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy lời bài hát thành công"));
    }

    @GetMapping("/albums/{albumId}/songs")
    public ResponseEntity<ApiResponse<List<SongResponse>>> getAlbumSongs(@PathVariable UUID albumId) {
        List<SongResponse> response = songService.getSongsByAlbumForAdmin(albumId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách bài hát trong album thành công"));
    }
}
