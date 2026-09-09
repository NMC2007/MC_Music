package com.example.usersservice.client;

import com.example.usersservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.UUID;

@FeignClient(name = "catalog-service", url = "${catalog.service.url}", configuration = FeignConfig.class)
public interface CatalogServiceClient {

    @PutMapping("/api/internal/catalog/songs/{id}/increment-play")
    void incrementPlay(@PathVariable("id") UUID id);

    @PutMapping("/api/internal/catalog/songs/{id}/increment-like")
    void incrementLike(@PathVariable("id") UUID id);

    @PutMapping("/api/internal/catalog/songs/{id}/decrement-like")
    void decrementLike(@PathVariable("id") UUID id);

    @GetMapping("/api/internal/catalog/songs/{id}")
    SongInternalResponse getSongDetails(@PathVariable("id") UUID id);
}
