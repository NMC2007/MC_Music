package com.example.artistsservice.controller;

import com.example.artistsservice.exception.ApiException;
import org.springframework.http.HttpStatus;
import com.example.artistsservice.model.dto.response.ArtistInternalResponse;
import com.example.artistsservice.model.entity.Artist;
import com.example.artistsservice.repository.ArtistRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
                .build();
                
        return ResponseEntity.ok(response);
    }
}
