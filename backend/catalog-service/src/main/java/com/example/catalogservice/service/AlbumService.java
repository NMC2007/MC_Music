package com.example.catalogservice.service;

import com.example.catalogservice.exception.ResourceNotFoundException;
import com.example.catalogservice.model.dto.request.AlbumCreateRequest;
import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.entity.Album;
import com.example.catalogservice.repository.AlbumRepository;
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
    private final ArtistServiceClient artistServiceClient;
    private final CloudinaryService cloudinaryService;
    private final ModelMapper modelMapper;

    public AlbumService(AlbumRepository albumRepository, ArtistServiceClient artistServiceClient, CloudinaryService cloudinaryService, ModelMapper modelMapper) {
        this.albumRepository = albumRepository;
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
    public List<AlbumResponse> getAlbumsByOwner(UUID ownerId) {
        return albumRepository.findByOwnerId(ownerId).stream()
                .map(album -> modelMapper.map(album, AlbumResponse.class))
                .collect(Collectors.toList());
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

    @Transactional
    public void updateAlbumStatus(UUID albumId, String status) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found with id: " + albumId));
        album.setStatus(status);
        albumRepository.save(album);
    }
}
