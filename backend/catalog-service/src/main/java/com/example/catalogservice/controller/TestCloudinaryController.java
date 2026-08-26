package com.example.catalogservice.controller;

import com.example.catalogservice.service.CloudinaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/catalog/test-cloudinary")
public class TestCloudinaryController {

    private final CloudinaryService cloudinaryService;

    public TestCloudinaryController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, Object>> testUploadImage(@RequestParam("file") MultipartFile file) {
        try {
            Map result = cloudinaryService.uploadImage(file);
            Map<String, Object> response = new HashMap<>();
            response.put("url", result.get("secure_url"));
            response.put("public_id", result.get("public_id"));
            response.put("message", "Image uploaded successfully");
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/upload-audio")
    public ResponseEntity<Map<String, Object>> testUploadAudio(@RequestParam("file") MultipartFile file) {
        try {
            Map result = cloudinaryService.uploadAudio(file);
            Map<String, Object> response = new HashMap<>();
            response.put("url", result.get("secure_url"));
            response.put("public_id", result.get("public_id"));
            response.put("message", "Audio uploaded successfully");
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
