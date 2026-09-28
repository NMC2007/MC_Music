package com.example.adminservice.controller;

import com.example.adminservice.client.ArtistServiceClient;
import com.example.adminservice.model.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/artists")
public class AdminArtistController {

    private final ArtistServiceClient artistServiceClient;

    public AdminArtistController(ArtistServiceClient artistServiceClient) {
        this.artistServiceClient = artistServiceClient;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllArtists(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort) {
        Map<String, Object> response = artistServiceClient.getAllArtists(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách nghệ sĩ thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getArtistById(@PathVariable UUID id) {
        Map<String, Object> response = artistServiceClient.getArtistById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin nghệ sĩ thành công"));
    }
}
