package com.example.usersservice.service;

import com.example.usersservice.client.CatalogServiceClient;
import com.example.usersservice.client.SongInternalResponse;
import com.example.usersservice.exception.ApiException;
import com.example.usersservice.model.dto.request.PlaylistCreateRequest;
import com.example.usersservice.model.dto.request.PlaylistSongAddRequest;
import com.example.usersservice.model.dto.response.PlaylistResponse;
import com.example.usersservice.model.dto.response.PlaylistSongResponse;
import com.example.usersservice.model.entity.Playlist;
import com.example.usersservice.model.entity.PlaylistSong;
import com.example.usersservice.model.entity.PlaylistSongId;
import com.example.usersservice.repository.PlaylistRepository;
import com.example.usersservice.repository.PlaylistSongRepository;
import feign.FeignException;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final CatalogServiceClient catalogServiceClient;
    private final ModelMapper modelMapper;

    public PlaylistService(PlaylistRepository playlistRepository, PlaylistSongRepository playlistSongRepository, CatalogServiceClient catalogServiceClient, ModelMapper modelMapper) {
        this.playlistRepository = playlistRepository;
        this.playlistSongRepository = playlistSongRepository;
        this.catalogServiceClient = catalogServiceClient;
        this.modelMapper = modelMapper;
    }

    @Transactional
    public PlaylistResponse createPlaylist(PlaylistCreateRequest request, UUID userId) {
        Playlist playlist = modelMapper.map(request, Playlist.class);
        playlist.setUserId(userId);
        if (playlist.getIsPublic() == null) {
            playlist.setIsPublic(false);
        }
        playlist.setCreatedAt(java.time.LocalDateTime.now());
        Playlist saved = playlistRepository.save(playlist);
        return modelMapper.map(saved, PlaylistResponse.class);
    }

    @Transactional(readOnly = true)
    public List<PlaylistResponse> getUserPlaylists(UUID userId) {
        return playlistRepository.findByUserId(userId).stream()
                .map(p -> modelMapper.map(p, PlaylistResponse.class))
                .collect(Collectors.toList());
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
    public List<PlaylistSongResponse> getPlaylistSongs(UUID playlistId) {
        if (!playlistRepository.existsById(playlistId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy playlist");
        }
        return playlistSongRepository.findByPlaylistIdOrderByAddedAtDesc(playlistId).stream()
                .map(ps -> modelMapper.map(ps, PlaylistSongResponse.class))
                .collect(Collectors.toList());
    }
}
