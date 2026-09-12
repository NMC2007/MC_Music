package com.example.artistsservice.controller;

import com.example.artistsservice.exception.ApiException;
import org.springframework.http.HttpStatus;
import com.example.artistsservice.model.dto.response.ArtistInternalResponse;
import com.example.artistsservice.model.entity.Artist;
import com.example.artistsservice.repository.ArtistRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@RestController
@RequestMapping("/api/internal/artists")
public class InternalArtistController {

    private final ArtistRepository artistRepository;

    public InternalArtistController(ArtistRepository artistRepository) {
        this.artistRepository = artistRepository;
    }

    @GetMapping("/{artistId}")
    public ResponseEntity<ArtistInternalResponse> getArtistById(@PathVariable UUID artistId) {
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Artist not found"));
        
        ArtistInternalResponse response = ArtistInternalResponse.builder()
                .id(artist.getId())
                .stageName(artist.getStageName())
                .avatarUrl(artist.getAvatarUrl())
                .build();
                
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{artistId}/increment-follower")
    @Transactional
    public ResponseEntity<Void> incrementFollower(@PathVariable UUID artistId) {
        if (!artistRepository.existsById(artistId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Artist not found");
        }
        artistRepository.incrementFollowerCount(artistId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{artistId}/decrement-follower")
    @Transactional
    public ResponseEntity<Void> decrementFollower(@PathVariable UUID artistId) {
        if (!artistRepository.existsById(artistId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Artist not found");
        }
        artistRepository.decrementFollowerCount(artistId);
        return ResponseEntity.ok().build();
    }
}
