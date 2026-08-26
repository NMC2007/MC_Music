package com.example.catalogservice.controller;

import com.example.catalogservice.model.dto.response.ApiResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.service.SongService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/catalog/public")
public class PublicCatalogController {

    private final SongService songService;

    public PublicCatalogController(SongService songService) {
        this.songService = songService;
    }

    @GetMapping("/songs")
    public ResponseEntity<ApiResponse<List<SongResponse>>> getPublicSongs() {
        List<SongResponse> response = songService.getPublicSongs();
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách bài hát công khai thành công"));
    }
}
