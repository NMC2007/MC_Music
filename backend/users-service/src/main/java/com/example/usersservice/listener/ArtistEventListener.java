package com.example.usersservice.listener;

import com.example.usersservice.model.dto.event.ArtistProfileUpdatedEvent;
import com.example.usersservice.repository.FavoriteAlbumRepository;
import com.example.usersservice.repository.FavoriteRepository;
import com.example.usersservice.repository.FollowArtistRepository;
import com.example.usersservice.repository.PlayHistoryRepository;
import com.example.usersservice.repository.PlaylistSongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ArtistEventListener {

    private final FollowArtistRepository followArtistRepository;
    private final PlaylistSongRepository playlistSongRepository;
    private final PlayHistoryRepository playHistoryRepository;
    private final FavoriteRepository favoriteRepository;
    private final FavoriteAlbumRepository favoriteAlbumRepository;

    @KafkaListener(topics = "artist-events-topic", groupId = "users-group")
    @Transactional
    public void handleArtistProfileUpdated(ArtistProfileUpdatedEvent event) {
        log.info("UsersService: Received ArtistProfileUpdatedEvent for artist ID: {}", event.getArtistId());

        try {
            UUID artistId = UUID.fromString(event.getArtistId());
            String oldName = event.getOldName();
            String newName = event.getNewName();
            String newAvatarUrl = event.getNewAvatarUrl();

            // 1. Cập nhật bảng follow_artists (Dựa trên artistId)
            followArtistRepository.updateArtistProfile(artistId, newName, newAvatarUrl);

            // 2. Cập nhật các bảng khác (Dựa trên oldName vì không lưu artistId)
            if (oldName != null && !oldName.equals(newName)) {
                playlistSongRepository.updateArtistName(oldName, newName);
                playHistoryRepository.updateArtistName(oldName, newName);
                favoriteRepository.updateArtistName(oldName, newName);
                favoriteAlbumRepository.updateArtistName(oldName, newName);
            }

            log.info("UsersService: Successfully updated denormalized artist info for artist ID: {}", event.getArtistId());
        } catch (Exception e) {
            log.error("UsersService: Failed to process ArtistProfileUpdatedEvent", e);
            throw e; 
        }
    }
}
