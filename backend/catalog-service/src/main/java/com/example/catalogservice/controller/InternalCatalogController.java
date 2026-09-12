package com.example.catalogservice.controller;

import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.service.InternalCatalogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/internal/catalog")
public class InternalCatalogController {

    private final InternalCatalogService internalCatalogService;

    public InternalCatalogController(InternalCatalogService internalCatalogService) {
        this.internalCatalogService = internalCatalogService;
    }

    @PutMapping("/songs/{id}/increment-play")
    public ResponseEntity<Void> incrementPlay(@PathVariable UUID id) {
        internalCatalogService.incrementPlay(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/songs/{id}/increment-like")
    public ResponseEntity<Void> incrementLike(@PathVariable UUID id) {
        internalCatalogService.incrementLike(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/songs/{id}/decrement-like")
    public ResponseEntity<Void> decrementLike(@PathVariable UUID id) {
        internalCatalogService.decrementLike(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/songs/{id}")
    public ResponseEntity<SongResponse> getSongDetails(@PathVariable UUID id) {
        return ResponseEntity.ok(internalCatalogService.getSongDetails(id));
    }

    @PutMapping("/albums/{id}/increment-like")
    public ResponseEntity<Void> incrementAlbumLike(@PathVariable UUID id) {
        internalCatalogService.incrementAlbumLike(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/albums/{id}/decrement-like")
    public ResponseEntity<Void> decrementAlbumLike(@PathVariable UUID id) {
        internalCatalogService.decrementAlbumLike(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/albums/{id}")
    public ResponseEntity<AlbumResponse> getAlbumDetails(@PathVariable UUID id) {
        return ResponseEntity.ok(internalCatalogService.getAlbumDetails(id));
    }
}
