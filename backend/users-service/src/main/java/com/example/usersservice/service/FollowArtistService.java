package com.example.usersservice.service;

import com.example.usersservice.client.ArtistInternalResponse;
import com.example.usersservice.client.ArtistServiceClient;
import com.example.usersservice.exception.ApiException;
import com.example.usersservice.model.dto.response.FollowArtistResponse;
import com.example.usersservice.model.entity.FollowArtist;
import com.example.usersservice.model.entity.FollowArtistId;
import com.example.usersservice.repository.FollowArtistRepository;
import feign.FeignException;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FollowArtistService {

    private final FollowArtistRepository followArtistRepository;
    private final ArtistServiceClient artistServiceClient;
    private final ModelMapper modelMapper;

    public FollowArtistService(FollowArtistRepository followArtistRepository, ArtistServiceClient artistServiceClient, ModelMapper modelMapper) {
        this.followArtistRepository = followArtistRepository;
        this.artistServiceClient = artistServiceClient;
        this.modelMapper = modelMapper;
    }

    @Transactional
    public void followArtist(UUID userId, UUID artistId) {
        FollowArtistId id = new FollowArtistId(userId, artistId);
        if (followArtistRepository.existsById(id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Đã theo dõi nghệ sĩ này");
        }

        ArtistInternalResponse artistInfo;
        try {
            artistInfo = artistServiceClient.getArtistDetails(artistId);
        } catch (FeignException.NotFound e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy nghệ sĩ trên hệ thống");
        } catch (FeignException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi gọi Artist Service: " + e.getMessage());
        }

        FollowArtist followArtist = FollowArtist.builder()
                .userId(userId)
                .artistId(artistId)
                .artistName(artistInfo.getStageName())
                .avatar(artistInfo.getAvatarUrl())
                .createdAt(LocalDateTime.now())
                .build();

        followArtistRepository.save(followArtist);

        try {
            artistServiceClient.incrementFollowerCount(artistId);
        } catch (Exception e) {
            // Log warning
        }
    }

    @Transactional
    public void unfollowArtist(UUID userId, UUID artistId) {
        FollowArtistId id = new FollowArtistId(userId, artistId);
        if (!followArtistRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Chưa theo dõi nghệ sĩ này");
        }

        followArtistRepository.deleteById(id);

        try {
            artistServiceClient.decrementFollowerCount(artistId);
        } catch (Exception e) {
            // Log warning
        }
    }

    @Transactional(readOnly = true)
    public List<FollowArtistResponse> getUserFollowedArtists(UUID userId) {
        return followArtistRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(f -> modelMapper.map(f, FollowArtistResponse.class))
                .collect(Collectors.toList());
    }
}
