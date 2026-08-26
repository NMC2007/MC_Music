package com.example.catalogservice.service;

import com.example.catalogservice.exception.ResourceNotFoundException;
import com.example.catalogservice.model.dto.request.SongUploadRequest;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.entity.Album;
import com.example.catalogservice.model.entity.Song;
import com.example.catalogservice.repository.AlbumRepository;
import com.example.catalogservice.repository.SongRepository;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SongService {

    private final SongRepository songRepository;
    private final AlbumRepository albumRepository;
    private final CloudinaryService cloudinaryService;
    private final ModelMapper modelMapper;

    public SongService(SongRepository songRepository, AlbumRepository albumRepository, 
                       CloudinaryService cloudinaryService, ModelMapper modelMapper) {
        this.songRepository = songRepository;
        this.albumRepository = albumRepository;
        this.cloudinaryService = cloudinaryService;
        this.modelMapper = modelMapper;
    }

    @Transactional
    public SongResponse uploadSong(SongUploadRequest request, UUID ownerId) throws IOException {
        Song song = modelMapper.map(request, Song.class);
        song.setOwnerId(ownerId);
        song.setStatus("PENDING"); 
        
        if (request.getAlbumId() != null) {
            Album album = albumRepository.findById(request.getAlbumId())
                    .orElseThrow(() -> new ResourceNotFoundException("Album not found"));
            song.setAlbum(album);
        }

        // Upload Audio
        if (request.getAudioFile() != null && !request.getAudioFile().isEmpty()) {
            Map audioUploadResult = cloudinaryService.uploadAudio(request.getAudioFile());
            song.setAudioUrl((String) audioUploadResult.get("secure_url"));
            song.setAudioPublicId((String) audioUploadResult.get("public_id"));
            
            // Extract duration if possible, for now we mock it or expect frontend to send it, 
            // Cloudinary returns duration for videos/audio
            Object duration = audioUploadResult.get("duration");
            if (duration != null) {
                song.setDurationSeconds(((Double) duration).intValue());
            } else {
                song.setDurationSeconds(0);
            }
        }

        // Upload Cover if provided
        if (request.getCoverImage() != null && !request.getCoverImage().isEmpty()) {
            Map coverUploadResult = cloudinaryService.uploadImage(request.getCoverImage());
            song.setCoverImage((String) coverUploadResult.get("secure_url"));
        }

        Song savedSong = songRepository.save(song);
        return modelMapper.map(savedSong, SongResponse.class);
    }
    
    @Transactional(readOnly = true)
    public List<SongResponse> getSongsByOwner(UUID ownerId) {
        return songRepository.findByOwnerId(ownerId).stream()
                .map(song -> modelMapper.map(song, SongResponse.class))
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateSongStatus(UUID songId, String status) {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Song not found"));
        song.setStatus(status);
        songRepository.save(song);
    }

    @Transactional(readOnly = true)
    public List<SongResponse> getSongsByStatus(String status) {
        return songRepository.findByStatus(status).stream()
                .map(song -> modelMapper.map(song, SongResponse.class))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SongResponse> getPublicSongs() {
        return songRepository.findByStatusAndIsDeletedFalse("APPROVED").stream()
                .map(song -> modelMapper.map(song, SongResponse.class))
                .collect(Collectors.toList());
    }
}
