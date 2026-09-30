package com.example.artistsservice.controller;

import com.example.artistsservice.exception.ApiException;
import org.springframework.http.HttpStatus;
import com.example.artistsservice.model.dto.response.ArtistInternalResponse;
import com.example.artistsservice.model.entity.Artist;
import com.example.artistsservice.repository.ArtistRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.example.artistsservice.model.dto.response.ArtistAdminInternalResponse;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
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
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nghệ sĩ với ID: " + artistId));
        
        ArtistInternalResponse response = ArtistInternalResponse.builder()
                .id(artist.getId())
                .stageName(artist.getStageName())
                .avatarUrl(artist.getAvatarUrl())
                .build();
                
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin")
    public ResponseEntity<Page<ArtistAdminInternalResponse>> getAllArtistsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "createdAt,desc") String sort) {
        
        Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            Sort.Direction direction = Sort.Direction.DESC;
            if (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc")) {
                direction = Sort.Direction.ASC;
            }
            sortObj = Sort.by(direction, field);
        }
        
        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<Artist> artists = artistRepository.findAll(pageable);
        
        Page<ArtistAdminInternalResponse> response = artists.map(artist -> ArtistAdminInternalResponse.builder()
                .id(artist.getId())
                .email(artist.getEmail())
                .stageName(artist.getStageName())
                .avatarUrl(artist.getAvatarUrl())
                .isActive(artist.getIsActive())
                .followerCount(artist.getFollowerCount())
                .createdAt(artist.getCreatedAt())
                .build());
                
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{artistId}/admin")
    public ResponseEntity<ArtistAdminInternalResponse> getArtistForAdmin(@PathVariable UUID artistId) {
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nghệ sĩ với ID: " + artistId));
                
        ArtistAdminInternalResponse response = ArtistAdminInternalResponse.builder()
                .id(artist.getId())
                .email(artist.getEmail())
                .stageName(artist.getStageName())
                .avatarUrl(artist.getAvatarUrl())
                .isActive(artist.getIsActive())
                .followerCount(artist.getFollowerCount())
                .createdAt(artist.getCreatedAt())
                .build();
                
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{artistId}/increment-follower")
    @Transactional
    public ResponseEntity<Void> incrementFollower(@PathVariable UUID artistId) {
        if (!artistRepository.existsById(artistId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nghệ sĩ với ID: " + artistId);
        }
        artistRepository.incrementFollowerCount(artistId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{artistId}/decrement-follower")
    @Transactional
    public ResponseEntity<Void> decrementFollower(@PathVariable UUID artistId) {
        if (!artistRepository.existsById(artistId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nghệ sĩ với ID: " + artistId);
        }
        artistRepository.decrementFollowerCount(artistId);
        return ResponseEntity.ok().build();
    }

    /**
     * Cập nhật trạng thái khóa/mở khóa tài khoản Artist.
     * Chỉ được gọi từ Admin Service thông qua Internal API (yêu cầu header X-Internal-Secret).
     */
    @PatchMapping("/{artistId}/status")
    @Transactional
    public ResponseEntity<Void> updateArtistStatus(
            @PathVariable UUID artistId,
            @RequestBody Map<String, Boolean> payload) {
        Boolean isActive = payload.get("isActive");
        if (isActive == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trường 'isActive' là bắt buộc");
        }
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nghệ sĩ với ID: " + artistId));
        artist.setIsActive(isActive);
        artistRepository.save(artist);
        return ResponseEntity.ok().build();
    }
}
