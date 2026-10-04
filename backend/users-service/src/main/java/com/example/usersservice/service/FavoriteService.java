package com.example.usersservice.service;

import com.example.usersservice.client.CatalogServiceClient;
import com.example.usersservice.client.SongInternalResponse;
import com.example.usersservice.exception.ApiException;
import com.example.usersservice.model.dto.response.FavoriteResponse;
import com.example.usersservice.model.entity.Favorite;
import com.example.usersservice.model.entity.FavoriteId;
import com.example.usersservice.model.entity.FavoriteAlbum;
import com.example.usersservice.model.entity.FavoriteAlbumId;
import com.example.usersservice.repository.FavoriteRepository;
import com.example.usersservice.repository.FavoriteAlbumRepository;
import com.example.usersservice.client.AlbumInternalResponse;
import feign.FeignException;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final FavoriteAlbumRepository favoriteAlbumRepository;
    private final CatalogServiceClient catalogServiceClient;
    private final ModelMapper modelMapper;

    public FavoriteService(FavoriteRepository favoriteRepository, FavoriteAlbumRepository favoriteAlbumRepository, CatalogServiceClient catalogServiceClient, ModelMapper modelMapper) {
        this.favoriteRepository = favoriteRepository;
        this.favoriteAlbumRepository = favoriteAlbumRepository;
        this.catalogServiceClient = catalogServiceClient;
        this.modelMapper = modelMapper;
    }

    @Transactional
    public void addFavorite(UUID userId, UUID songId) {
        FavoriteId id = new FavoriteId(userId, songId);
        if (favoriteRepository.existsById(id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Bài hát đã có trong danh sách yêu thích");
        }

        SongInternalResponse songInfo;
        try {
            songInfo = catalogServiceClient.getSongDetails(songId);
        } catch (FeignException.NotFound e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy bài hát trên hệ thống");
        } catch (FeignException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi gọi Catalog Service: " + e.getMessage());
        }

        Favorite favorite = Favorite.builder()
                .userId(userId)
                .songId(songId)
                .songTitle(songInfo.getTitle())
                .artistName(songInfo.getOwnerName())
                .coverImage(songInfo.getCoverImage())
                .createdAt(LocalDateTime.now())
                .build();

        favoriteRepository.save(favorite);

        try {
            catalogServiceClient.incrementLike(songId);
        } catch (Exception e) {
            // Log warning but don't fail transaction
        }
    }

    @Transactional
    public void removeFavorite(UUID userId, UUID songId) {
        FavoriteId id = new FavoriteId(userId, songId);
        if (!favoriteRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Bài hát chưa có trong danh sách yêu thích");
        }

        favoriteRepository.deleteById(id);

        try {
            catalogServiceClient.decrementLike(songId);
        } catch (Exception e) {
            // Log warning
        }
    }

    @Transactional(readOnly = true)
    public Page<FavoriteResponse> getUserFavorites(UUID userId, Pageable pageable) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(f -> modelMapper.map(f, FavoriteResponse.class));
    }

    @Transactional
    public void addFavoriteAlbum(UUID userId, UUID albumId) {
        FavoriteAlbumId id = new FavoriteAlbumId(userId, albumId);
        if (favoriteAlbumRepository.existsById(id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Album đã có trong danh sách yêu thích");
        }

        AlbumInternalResponse albumInfo;
        try {
            albumInfo = catalogServiceClient.getAlbumDetails(albumId);
        } catch (FeignException.NotFound e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy album trên hệ thống");
        } catch (FeignException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi gọi Catalog Service: " + e.getMessage());
        }

        FavoriteAlbum favoriteAlbum = FavoriteAlbum.builder()
                .userId(userId)
                .albumId(albumId)
                .albumTitle(albumInfo.getTitle())
                .artistName(albumInfo.getOwnerName())
                .coverImage(albumInfo.getCoverImage())
                .createdAt(LocalDateTime.now())
                .build();

        favoriteAlbumRepository.save(favoriteAlbum);

        try {
            catalogServiceClient.incrementAlbumLike(albumId);
        } catch (Exception e) {
            // Log warning but don't fail transaction
        }
    }

    @Transactional
    public void removeFavoriteAlbum(UUID userId, UUID albumId) {
        FavoriteAlbumId id = new FavoriteAlbumId(userId, albumId);
        if (!favoriteAlbumRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Album chưa có trong danh sách yêu thích");
        }

        favoriteAlbumRepository.deleteById(id);

        try {
            catalogServiceClient.decrementAlbumLike(albumId);
        } catch (Exception e) {
            // Log warning
        }
    }

    @Transactional(readOnly = true)
    public Page<com.example.usersservice.model.dto.response.FavoriteAlbumResponse> getUserFavoriteAlbums(UUID userId, Pageable pageable) {
        return favoriteAlbumRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(f -> modelMapper.map(f, com.example.usersservice.model.dto.response.FavoriteAlbumResponse.class));
    }
}
