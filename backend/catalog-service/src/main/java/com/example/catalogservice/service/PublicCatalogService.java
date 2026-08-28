package com.example.catalogservice.service;

import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.dto.response.GenreResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.repository.AlbumRepository;
import com.example.catalogservice.repository.GenreRepository;
import com.example.catalogservice.repository.SongRepository;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PublicCatalogService {

    private final SongRepository songRepository;
    private final AlbumRepository albumRepository;
    private final GenreRepository genreRepository;
    private final ModelMapper modelMapper;

    public PublicCatalogService(SongRepository songRepository, AlbumRepository albumRepository,
                                GenreRepository genreRepository, ModelMapper modelMapper) {
        this.songRepository = songRepository;
        this.albumRepository = albumRepository;
        this.genreRepository = genreRepository;
        this.modelMapper = modelMapper;
    }

    @Transactional(readOnly = true)
    public Page<SongResponse> searchPublicSongs(String keyword, UUID genreId, Pageable pageable) {
        return songRepository.findPublicSongs(keyword, genreId, pageable)
                .map(song -> modelMapper.map(song, SongResponse.class));
    }

    @Transactional(readOnly = true)
    public Page<AlbumResponse> getPublicAlbums(Pageable pageable) {
        return albumRepository.findByStatus("APPROVED", pageable)
                .map(album -> modelMapper.map(album, AlbumResponse.class));
    }

    @Transactional(readOnly = true)
    public Page<SongResponse> getSongsByArtist(UUID artistId, Pageable pageable) {
        return songRepository.findByOwnerIdAndStatusAndIsDeletedFalse(artistId, "APPROVED", pageable)
                .map(song -> modelMapper.map(song, SongResponse.class));
    }

    @Transactional(readOnly = true)
    public Page<AlbumResponse> getAlbumsByArtist(UUID artistId, Pageable pageable) {
        return albumRepository.findByOwnerIdAndStatus(artistId, "APPROVED", pageable)
                .map(album -> modelMapper.map(album, AlbumResponse.class));
    }

    @Transactional(readOnly = true)
    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(genre -> modelMapper.map(genre, GenreResponse.class))
                .collect(Collectors.toList());
    }
}
