package com.example.artistsservice.service;

import com.example.artistsservice.client.CatalogServiceClient;
import com.example.artistsservice.exception.ApiException;
import com.example.artistsservice.model.dto.request.ArtistProfileUpdateRequest;
import com.example.artistsservice.model.dto.response.ArtistDashboardResponse;
import com.example.artistsservice.model.dto.response.ArtistProfileResponse;
import com.example.artistsservice.model.entity.Artist;
import com.example.artistsservice.repository.ArtistRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class ArtistService {

    private final ArtistRepository artistRepository;
    private final CloudinaryService cloudinaryService;
    private final CatalogServiceClient catalogServiceClient;

    public ArtistService(ArtistRepository artistRepository,
                         CloudinaryService cloudinaryService,
                         CatalogServiceClient catalogServiceClient) {
        this.artistRepository = artistRepository;
        this.cloudinaryService = cloudinaryService;
        this.catalogServiceClient = catalogServiceClient;
    }

    @Transactional(readOnly = true)
    public ArtistProfileResponse getCurrentProfile(UUID artistId) {
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ nghệ sĩ"));

        return ArtistProfileResponse.builder()
                .id(artist.getId())
                .email(artist.getEmail())
                .stageName(artist.getStageName())
                .biography(artist.getBiography())
                .avatarUrl(artist.getAvatarUrl())
                .coverUrl(artist.getCoverUrl())
                .followerCount(artist.getFollowerCount() == null ? 0L : artist.getFollowerCount().longValue())
                .build();
    }

    @Transactional
    public ArtistProfileResponse updateProfile(UUID artistId, ArtistProfileUpdateRequest request) {
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ nghệ sĩ"));

        artist.setStageName(request.getStageName());
        if (request.getBiography() != null) {
            artist.setBiography(request.getBiography());
        }

        try {
            if (request.getAvatarFile() != null && !request.getAvatarFile().isEmpty()) {
                Map uploadResult = cloudinaryService.uploadImage(request.getAvatarFile(), "mcmusic/artists/avatars");
                artist.setAvatarUrl((String) uploadResult.get("secure_url"));
            }

            if (request.getCoverFile() != null && !request.getCoverFile().isEmpty()) {
                Map uploadResult = cloudinaryService.uploadImage(request.getCoverFile(), "mcmusic/artists/covers");
                artist.setCoverUrl((String) uploadResult.get("secure_url"));
            }
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi upload ảnh");
        }

        Artist updatedArtist = artistRepository.save(artist);

        return ArtistProfileResponse.builder()
                .id(updatedArtist.getId())
                .email(updatedArtist.getEmail())
                .stageName(updatedArtist.getStageName())
                .biography(updatedArtist.getBiography())
                .avatarUrl(updatedArtist.getAvatarUrl())
                .coverUrl(updatedArtist.getCoverUrl())
                .followerCount(updatedArtist.getFollowerCount() == null ? 0L : updatedArtist.getFollowerCount().longValue())
                .build();
    }

    @Transactional(readOnly = true)
    public ArtistDashboardResponse getDashboardStats(UUID artistId) {
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ nghệ sĩ"));

        ArtistDashboardResponse dashboardResponse = catalogServiceClient.getArtistStats(artistId);
        dashboardResponse.setTotalFollowers(artist.getFollowerCount() == null ? 0L : artist.getFollowerCount().longValue());
        return dashboardResponse;
    }
}
