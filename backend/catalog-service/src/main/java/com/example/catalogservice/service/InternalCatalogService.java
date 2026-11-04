package com.example.catalogservice.service;

import com.example.catalogservice.exception.BadRequestException;
import com.example.catalogservice.exception.ResourceNotFoundException;
import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.entity.Album;
import com.example.catalogservice.model.entity.Song;
import com.example.catalogservice.repository.AlbumRepository;
import com.example.catalogservice.repository.SongRepository;
import com.example.catalogservice.repository.projection.ArtistStatsProjection;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class InternalCatalogService {

    private final SongRepository songRepository;
    private final AlbumRepository albumRepository;
    private final ModelMapper modelMapper;

    public InternalCatalogService(SongRepository songRepository, AlbumRepository albumRepository, ModelMapper modelMapper) {
        this.songRepository = songRepository;
        this.albumRepository = albumRepository;
        this.modelMapper = modelMapper;
    }

    @Transactional
    public void incrementPlay(UUID songId) {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Song not found"));
        if (Boolean.TRUE.equals(song.getIsDeleted())) {
            throw new BadRequestException("Bài hát đã bị xóa, không thể ghi nhận lượt nghe");
        }
        songRepository.incrementPlayCount(songId);
    }

    @Transactional
    public void incrementLike(UUID songId) {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Song not found"));
        if (Boolean.TRUE.equals(song.getIsDeleted())) {
            throw new BadRequestException("Bài hát đã bị xóa, không thể thích");
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
        if (Boolean.TRUE.equals(song.getIsDeleted())) {
            throw new ResourceNotFoundException("Bài hát đã bị xóa");
        }
        return modelMapper.map(song, SongResponse.class);
    }

    @Transactional
    public void incrementAlbumLike(UUID albumId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found"));
        if (Boolean.TRUE.equals(album.getIsDeleted())) {
            throw new BadRequestException("Album đã bị xóa, không thể thích");
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
    public AlbumResponse getAlbumDetails(UUID albumId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album not found"));
        if (Boolean.TRUE.equals(album.getIsDeleted())) {
            throw new ResourceNotFoundException("Album đã bị xóa");
        }
        return modelMapper.map(album, AlbumResponse.class);
    }

    @Transactional(readOnly = true)
    public ArtistStatsProjection getArtistStats(UUID artistId) {
        return songRepository.getArtistStats(artistId);
    }
}
