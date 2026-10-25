package com.example.usersservice.service;

import com.example.usersservice.client.CatalogServiceClient;
import com.example.usersservice.client.SongInternalResponse;
import com.example.usersservice.exception.ApiException;
import com.example.usersservice.model.dto.request.PlaylistCreateRequest;
import com.example.usersservice.model.dto.request.PlaylistSongAddRequest;
import com.example.usersservice.model.dto.request.PlaylistUpdateRequest;
import com.example.usersservice.model.dto.response.PlaylistResponse;
import com.example.usersservice.model.dto.response.PlaylistSongResponse;
import com.example.usersservice.model.entity.Playlist;
import com.example.usersservice.model.entity.PlaylistSong;
import com.example.usersservice.model.entity.PlaylistSongId;
import com.example.usersservice.repository.PlaylistRepository;
import com.example.usersservice.repository.PlaylistSongRepository;
import feign.FeignException;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final CatalogServiceClient catalogServiceClient;
    private final ModelMapper modelMapper;
    private final CloudinaryService cloudinaryService;

    public PlaylistService(PlaylistRepository playlistRepository,
                           PlaylistSongRepository playlistSongRepository,
                           CatalogServiceClient catalogServiceClient,
                           ModelMapper modelMapper,
                           CloudinaryService cloudinaryService) {
        this.playlistRepository = playlistRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.catalogServiceClient = catalogServiceClient;
        this.modelMapper = modelMapper;
        this.cloudinaryService = cloudinaryService;
    }

    @Transactional
    public PlaylistResponse createPlaylist(PlaylistCreateRequest request, UUID userId) {
        Boolean isPublic = request.getIsPublic() != null ? request.getIsPublic() : false;

        Playlist playlist = Playlist.builder()
                .userId(userId)
                .name(request.getName().trim())
                .description(request.getDescription())
                .isPublic(isPublic)
                .createdAt(java.time.LocalDateTime.now())
                .build();

        MultipartFile coverFile = request.getEffectiveCoverFile();
        if (coverFile != null && !coverFile.isEmpty()) {
            try {
                Map uploadResult = cloudinaryService.uploadPlaylistCover(coverFile);
                playlist.setCoverImage((String) uploadResult.get("secure_url"));
            } catch (ApiException e) {
                throw e;
            } catch (IOException e) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Upload ảnh bìa playlist thất bại, vui lòng thử lại sau");
            }
        }

        Playlist saved = playlistRepository.save(playlist);
        return modelMapper.map(saved, PlaylistResponse.class);
    }

    @Transactional(readOnly = true)
    public Page<PlaylistResponse> getUserPlaylists(UUID userId, Pageable pageable) {
        return playlistRepository.findByUserId(userId, pageable)
                .map(p -> modelMapper.map(p, PlaylistResponse.class));
    }

    @Transactional(readOnly = true)
    public PlaylistResponse getPlaylistById(UUID playlistId, UUID userId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy playlist"));

        // Chỉ chủ sở hữu mới được xem playlist private
        if (!Boolean.TRUE.equals(playlist.getIsPublic()) && !playlist.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem playlist này");
        }

        return modelMapper.map(playlist, PlaylistResponse.class);
    }

    @Transactional
    public PlaylistResponse updatePlaylist(UUID playlistId, PlaylistUpdateRequest request, UUID userId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy playlist"));

        if (!playlist.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền chỉnh sửa playlist này");
        }

        boolean hasName = request != null && request.getName() != null;
        boolean hasDescription = request != null && request.getDescription() != null;
        boolean hasIsPublic = request != null && request.getIsPublic() != null;
        boolean hasCover = request != null && request.getEffectiveCoverFile() != null && !request.getEffectiveCoverFile().isEmpty();

        if (!hasName && !hasDescription && !hasIsPublic && !hasCover) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng cung cấp ít nhất một thông tin cần cập nhật (tên, mô tả, ảnh bìa hoặc trạng thái công khai)");
        }

        // Cập nhật tên nếu có truyền (không cho phép đặt tên rỗng hoặc toàn khoảng trắng)
        if (hasName) {
            String trimmedName = request.getName().trim();
            if (trimmedName.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Tên playlist không được để trống");
            }
            playlist.setName(trimmedName);
        }

        // Cập nhật mô tả nếu có truyền
        if (hasDescription) {
            playlist.setDescription(request.getDescription().trim());
        }

        // Cập nhật trạng thái công khai nếu có truyền
        if (hasIsPublic) {
            playlist.setIsPublic(request.getIsPublic());
        }

        // Cập nhật ảnh bìa nếu có upload file mới
        if (hasCover) {
            try {
                Map uploadResult = cloudinaryService.uploadPlaylistCover(request.getEffectiveCoverFile());
                playlist.setCoverImage((String) uploadResult.get("secure_url"));
            } catch (ApiException e) {
                throw e;
            } catch (IOException e) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Upload ảnh bìa playlist thất bại, vui lòng thử lại sau");
            }
        }

        Playlist saved = playlistRepository.save(playlist);
        return modelMapper.map(saved, PlaylistResponse.class);
    }

    @Transactional
    public void deletePlaylist(UUID playlistId, UUID userId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy playlist"));

        if (!playlist.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa playlist này");
        }

        // Xóa toàn bộ bài hát trong playlist trước
        playlistSongRepository.deleteByPlaylistId(playlistId);

        // Xóa playlist
        playlistRepository.delete(playlist);
    }

    @Transactional
    public PlaylistSongResponse addSongToPlaylist(UUID playlistId, PlaylistSongAddRequest request, UUID userId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy playlist"));
        
        if (!playlist.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền chỉnh sửa playlist này");
        }

        PlaylistSongId id = new PlaylistSongId(playlistId, request.getSongId());
        if (playlistSongRepository.existsById(id)) {
            throw new ApiException(HttpStatus.CONFLICT, "Bài hát đã có trong playlist");
        }

        SongInternalResponse songInfo;
        try {
            songInfo = catalogServiceClient.getSongDetails(request.getSongId());
        } catch (FeignException.NotFound e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy bài hát trên hệ thống");
        } catch (FeignException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi gọi Catalog Service: " + e.getMessage());
        }

        PlaylistSong playlistSong = PlaylistSong.builder()
                .playlistId(playlistId)
                .songId(request.getSongId())
                .songTitle(songInfo.getTitle())
                .artistName(songInfo.getOwnerName())
                .coverImage(songInfo.getCoverImage())
                .addedAt(java.time.LocalDateTime.now())
                .build();
        
        PlaylistSong saved = playlistSongRepository.save(playlistSong);
        return modelMapper.map(saved, PlaylistSongResponse.class);
    }

    @Transactional
    public void removeSongFromPlaylist(UUID playlistId, UUID songId, UUID userId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy playlist"));
                
        if (!playlist.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền chỉnh sửa playlist này");
        }

        PlaylistSongId id = new PlaylistSongId(playlistId, songId);
        if (!playlistSongRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Bài hát không tồn tại trong playlist");
        }

        playlistSongRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<PlaylistSongResponse> getPlaylistSongs(UUID playlistId, UUID userId, Pageable pageable) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy playlist"));

        // Chỉ chủ sở hữu mới được xem playlist private
        if (!Boolean.TRUE.equals(playlist.getIsPublic()) && !playlist.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem playlist này");
        }

        return playlistSongRepository.findByPlaylistIdOrderByAddedAtDesc(playlistId, pageable)
                .map(ps -> modelMapper.map(ps, PlaylistSongResponse.class));
    }
}
