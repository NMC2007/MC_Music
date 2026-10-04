package com.example.catalogservice.service;

import com.example.catalogservice.exception.ResourceNotFoundException;
import com.example.catalogservice.model.dto.request.AlbumCreateRequest;
import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.entity.Album;
import com.example.catalogservice.model.entity.Song;
import com.example.catalogservice.repository.AlbumRepository;
import com.example.catalogservice.repository.SongRepository;
import com.example.catalogservice.client.ArtistServiceClient;
import com.example.catalogservice.client.ArtistInternalResponse;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final SongRepository songRepository;
    private final ArtistServiceClient artistServiceClient;
    private final CloudinaryService cloudinaryService;
    private final ModelMapper modelMapper;

    public AlbumService(AlbumRepository albumRepository, SongRepository songRepository, ArtistServiceClient artistServiceClient, CloudinaryService cloudinaryService, ModelMapper modelMapper) {
        this.albumRepository = albumRepository;
        this.songRepository = songRepository;
        this.artistServiceClient = artistServiceClient;
        this.cloudinaryService = cloudinaryService;
        this.modelMapper = modelMapper;
    }

    @Transactional
    public AlbumResponse createAlbum(AlbumCreateRequest request, UUID ownerId) throws IOException {
        Album album = modelMapper.map(request, Album.class);
        album.setOwnerId(ownerId);
        
        try {
            ArtistInternalResponse artistInfo = artistServiceClient.getArtistById(ownerId);
            album.setOwnerName(artistInfo.getStageName());
        } catch (Exception e) {
            album.setOwnerName("Unknown Artist");
        }
        
        album.setStatus("PENDING"); 
        album.setTotalTracks(0);

        if (request.getCoverImage() != null && !request.getCoverImage().isEmpty()) {
            Map uploadResult = cloudinaryService.uploadImage(request.getCoverImage());
            album.setCoverImage((String) uploadResult.get("secure_url"));
        }

        Album savedAlbum = albumRepository.save(album);
        return modelMapper.map(savedAlbum, AlbumResponse.class);
    }
    
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<AlbumResponse> getAlbumsByOwner(UUID ownerId, org.springframework.data.domain.Pageable pageable) {
        return albumRepository.findByOwnerId(ownerId, pageable)
                .map(album -> modelMapper.map(album, AlbumResponse.class));
    }
    
    @Transactional(readOnly = true)
    public AlbumResponse getAlbumById(UUID albumId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found with id: " + albumId));
        return modelMapper.map(album, AlbumResponse.class);
    }

    @Transactional(readOnly = true)
    public List<AlbumResponse> getAlbumsByStatus(String status) {
        return albumRepository.findByStatus(status).stream()
                .map(album -> modelMapper.map(album, AlbumResponse.class))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<AlbumResponse> getAlbumsByStatus(String status, org.springframework.data.domain.Pageable pageable) {
        return albumRepository.findByStatus(status, pageable)
                .map(album -> modelMapper.map(album, AlbumResponse.class));
    }

    @Transactional
    public void updateAlbumStatus(UUID albumId, String status) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found with id: " + albumId));
        album.setStatus(status);
        albumRepository.save(album);

        // Quy tắc nghiệp vụ: Nếu Admin duyệt ALBUM, tự động duyệt toàn bộ bài hát trong album đó.
        // Nếu Admin TẦY XUốNG (TAKEDOWN) hoặc TỪ CHỐI album, cầp nhật trạng thái của tất cả bài hát theo.
        if ("APPROVED".equals(status) || "REJECTED".equals(status) || "TAKEDOWN".equals(status)) {
            List<Song> songs = songRepository.findByAlbumId(albumId);
            for (Song song : songs) {
                song.setStatus(status);
            }
            songRepository.saveAll(songs);
        }
    }
}
