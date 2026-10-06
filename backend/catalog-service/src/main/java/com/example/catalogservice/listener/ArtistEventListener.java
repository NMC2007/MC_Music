package com.example.catalogservice.listener;

import com.example.catalogservice.model.dto.event.ArtistProfileUpdatedEvent;
import com.example.catalogservice.repository.AlbumRepository;
import com.example.catalogservice.repository.SongRepository;
import com.example.catalogservice.repository.SongArtistRepository;
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

    private final AlbumRepository albumRepository;
    private final SongRepository songRepository;
    private final SongArtistRepository songArtistRepository;

    @KafkaListener(topics = "artist-events-topic", groupId = "catalog-group")
    @Transactional
    public void handleArtistProfileUpdated(ArtistProfileUpdatedEvent event) {
        log.info("Received ArtistProfileUpdatedEvent for artist: {}", event.getArtistId());
        try {
            UUID artistId = UUID.fromString(event.getArtistId());
            String newName = event.getNewName();

            // Cập nhật tên nghệ sĩ trong bảng Albums
            albumRepository.updateOwnerName(artistId, newName);

            // Cập nhật tên nghệ sĩ trong bảng Songs
            songRepository.updateOwnerName(artistId, newName);

            // Cập nhật tên nghệ sĩ trong bảng Song_Artists
            songArtistRepository.updateArtistName(artistId, newName);

            log.info("Successfully updated denormalized names for artist: {}", artistId);
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for artistId: {}", event.getArtistId(), e);
        } catch (Exception e) {
            log.error("Error processing ArtistProfileUpdatedEvent", e);
            throw e; 
        }
    }
}
