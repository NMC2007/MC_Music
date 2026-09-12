package com.example.usersservice.client;

import com.example.usersservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.UUID;

@FeignClient(name = "artists-service", url = "${artist.service.url}", configuration = FeignConfig.class)
public interface ArtistServiceClient {

    @PutMapping("/api/internal/artists/{id}/increment-follower")
    void incrementFollowerCount(@PathVariable("id") UUID id);

    @PutMapping("/api/internal/artists/{id}/decrement-follower")
    void decrementFollowerCount(@PathVariable("id") UUID id);

    @GetMapping("/api/internal/artists/{id}")
    ArtistInternalResponse getArtistDetails(@PathVariable("id") UUID id);
}
