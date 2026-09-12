package com.example.catalogservice.service;

import com.example.catalogservice.exception.ResourceNotFoundException;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.entity.Song;
import com.example.catalogservice.repository.SongRepository;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class InternalCatalogService {

    private final SongRepository songRepository;
    private final com.example.catalogservice.repository.AlbumRepository albumRepository;
    private final ModelMapper modelMapper;

    public InternalCatalogService(SongRepository songRepository, com.example.catalogservice.repository.AlbumRepository albumRepository, ModelMapper modelMapper) {
        this.songRepository = songRepository;
        this.albumRepository = albumRepository;
        this.modelMapper = modelMapper;
    }

    @Transactional
    public void incrementPlay(UUID songId) {
        if (!songRepository.existsById(songId)) {
            throw new ResourceNotFoundException("Song not found");
        }
        songRepository.incrementPlayCount(songId);
    }

    @Transactional
    public void incrementLike(UUID songId) {
        if (!songRepository.existsById(songId)) {
            throw new ResourceNotFoundException("Song not found");
        }
        songRepository.incrementLikeCount(songId);
    }

    @Transactional
    public void decrementLike(UUID songId) {
        if (!songRepository.existsById(songId)) {
            throw new ResourceNotFoundException("Song not found");
        }
        songRepository.decrementLikeCount(songId);
    }

    @Transactional(readOnly = true)
    public SongResponse getSongDetails(UUID songId) {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Song not found"));
        return modelMapper.map(song, SongResponse.class);
    }

    @Transactional
    public void incrementAlbumLike(UUID albumId) {
        if (!albumRepository.existsById(albumId)) {
            throw new ResourceNotFoundException("Album not found");
        }
        albumRepository.incrementLikeCount(albumId);
    }

    @Transactional
    public void decrementAlbumLike(UUID albumId) {
        if (!albumRepository.existsById(albumId)) {
            throw new ResourceNotFoundException("Album not found");
        }
        albumRepository.decrementLikeCount(albumId);
    }

    @Transactional(readOnly = true)
    public com.example.catalogservice.model.dto.response.AlbumResponse getAlbumDetails(UUID albumId) {
        com.example.catalogservice.model.entity.Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found"));
        return modelMapper.map(album, com.example.catalogservice.model.dto.response.AlbumResponse.class);
    }
}
