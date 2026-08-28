package com.example.catalogservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.example.catalogservice.config.FeignConfig;

import java.util.UUID;

@FeignClient(name = "artists-service", url = "${artists.service.url}", configuration = FeignConfig.class)
public interface ArtistServiceClient {

    @GetMapping("/api/internal/artists/{artistId}")
    ArtistInternalResponse getArtistById(@PathVariable("artistId") UUID artistId);
}
