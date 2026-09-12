package com.example.usersservice.service;

import com.example.usersservice.client.CatalogServiceClient;
import com.example.usersservice.client.SongInternalResponse;
import com.example.usersservice.exception.ApiException;
import com.example.usersservice.model.dto.request.PlayHistoryAddRequest;
import com.example.usersservice.model.dto.response.PlayHistoryResponse;
import com.example.usersservice.model.entity.PlayHistory;
import com.example.usersservice.repository.PlayHistoryRepository;
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
public class PlayHistoryService {

    private final PlayHistoryRepository playHistoryRepository;
    private final CatalogServiceClient catalogServiceClient;
    private final ModelMapper modelMapper;

    public PlayHistoryService(PlayHistoryRepository playHistoryRepository, CatalogServiceClient catalogServiceClient, ModelMapper modelMapper) {
        this.playHistoryRepository = playHistoryRepository;
        this.catalogServiceClient = catalogServiceClient;
        this.modelMapper = modelMapper;
    }

    @Transactional
    public void addPlayHistory(UUID userId, PlayHistoryAddRequest request) {
        SongInternalResponse songInfo;
        try {
            songInfo = catalogServiceClient.getSongDetails(request.getSongId());
        } catch (FeignException.NotFound e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy bài hát trên hệ thống");
        } catch (FeignException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi gọi Catalog Service: " + e.getMessage());
        }

        PlayHistory playHistory = PlayHistory.builder()
                .userId(userId)
                .songId(request.getSongId())
                .songTitle(songInfo.getTitle())
                .artistName(songInfo.getOwnerName())
                .durationListened(request.getDurationListened())
                .playedAt(LocalDateTime.now())
                .build();

        playHistoryRepository.save(playHistory);

        try {
            catalogServiceClient.incrementPlay(request.getSongId());
        } catch (Exception e) {
            // Ignore for now
        }
    }

    @Transactional(readOnly = true)
    public List<PlayHistoryResponse> getUserPlayHistory(UUID userId) {
        return playHistoryRepository.findByUserIdOrderByPlayedAtDesc(userId).stream()
                .map(ph -> modelMapper.map(ph, PlayHistoryResponse.class))
                .collect(Collectors.toList());
    }
}
