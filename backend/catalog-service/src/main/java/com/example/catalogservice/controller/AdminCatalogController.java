package com.example.catalogservice.controller;

import com.example.catalogservice.model.dto.response.ApiResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.service.SongService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/catalog/admin")
public class AdminCatalogController {

    private final SongService songService;

    public AdminCatalogController(SongService songService) {
        this.songService = songService;
    }

    @GetMapping("/songs/pending")
    public ResponseEntity<ApiResponse<List<SongResponse>>> getPendingSongs() {
        List<SongResponse> response = songService.getSongsByStatus("PENDING");
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách bài hát chờ duyệt thành công"));
    }

    @PatchMapping("/songs/{songId}/status")
    public ResponseEntity<ApiResponse<Void>> updateSongStatus(
            @PathVariable UUID songId,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null || (!status.equals("APPROVED") && !status.equals("REJECTED") && !status.equals("TAKEDOWN"))) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Trạng thái không hợp lệ"));
        }
        
        songService.updateSongStatus(songId, status);
        return ResponseEntity.ok(ApiResponse.success(null, "Cập nhật trạng thái bài hát thành công"));
    }
}
