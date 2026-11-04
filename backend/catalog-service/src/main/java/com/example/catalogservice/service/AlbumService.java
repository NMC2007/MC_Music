package com.example.catalogservice.service;

import com.example.catalogservice.exception.BadRequestException;
import com.example.catalogservice.exception.ResourceNotFoundException;
import com.example.catalogservice.exception.UnauthorizedAccessException;
import com.example.catalogservice.model.dto.request.AlbumCreateRequest;
import com.example.catalogservice.model.dto.request.AlbumUpdateRequest;
import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.entity.Album;
import com.example.catalogservice.model.entity.Song;
import com.example.catalogservice.repository.AlbumRepository;
import com.example.catalogservice.repository.SongRepository;
import com.example.catalogservice.client.ArtistServiceClient;
import com.example.catalogservice.client.ArtistInternalResponse;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
        album.setIsDeleted(false);

        if (request.getCoverImage() != null && !request.getCoverImage().isEmpty()) {
            Map uploadResult = cloudinaryService.uploadImage(request.getCoverImage());
            album.setCoverImage((String) uploadResult.get("secure_url"));
        }

        Album savedAlbum = albumRepository.save(album);
        return modelMapper.map(savedAlbum, AlbumResponse.class);
    }

    @Transactional
    public AlbumResponse updateAlbum(UUID albumId, AlbumUpdateRequest request, UUID artistId) throws IOException {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album không tồn tại với id: " + albumId));

        if (!album.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa album này");
        }

        if (Boolean.TRUE.equals(album.getIsDeleted())) {
            throw new BadRequestException("Không thể chỉnh sửa album đã bị xóa");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            album.setTitle(request.getTitle().trim());
        }

        if (request.getDescription() != null) {
            album.setDescription(request.getDescription());
        }

        if (request.getAlbumType() != null && !request.getAlbumType().isBlank()) {
            album.setAlbumType(request.getAlbumType().trim().toUpperCase());
        }

        if (request.getReleaseDate() != null) {
            album.setReleaseDate(request.getReleaseDate());
        }

        if (request.getCoverImage() != null && !request.getCoverImage().isEmpty()) {
            Map uploadResult = cloudinaryService.uploadImage(request.getCoverImage());
            album.setCoverImage((String) uploadResult.get("secure_url"));
        }

        // Quy tắc: Khi chỉnh sửa album, cả album sẽ tự động quay lại trạng thái PENDING để Admin duyệt lại
        album.setStatus("PENDING");

        Album savedAlbum = albumRepository.save(album);
        return modelMapper.map(savedAlbum, AlbumResponse.class);
    }

    @Transactional
    public void softDeleteAlbum(UUID albumId, UUID artistId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album không tồn tại với id: " + albumId));

        if (!album.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa album này");
        }

        if (Boolean.TRUE.equals(album.getIsDeleted())) {
            return; // Đã bị xóa mềm trước đó
        }

        // 1. Đánh dấu xóa mềm Album
        album.setIsDeleted(true);
        albumRepository.save(album);

        // 2. Cascade xóa mềm toàn bộ bài hát thuộc album này (giữ nguyên file Cloudinary)
        songRepository.updateIsDeletedByAlbumId(albumId, true);
    }

    @Transactional
    public AlbumResponse restoreAlbum(UUID albumId, UUID artistId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album không tồn tại với id: " + albumId));

        if (!album.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền khôi phục album này");
        }

        if (!Boolean.TRUE.equals(album.getIsDeleted())) {
            throw new BadRequestException("Album này không nằm trong thùng rác");
        }

        // 1. Khôi phục Album (giữ nguyên status trước khi xóa)
        album.setIsDeleted(false);
        Album savedAlbum = albumRepository.save(album);

        // 2. Cascade khôi phục toàn bộ bài hát thuộc album này
        songRepository.updateIsDeletedByAlbumId(albumId, false);

        return modelMapper.map(savedAlbum, AlbumResponse.class);
    }

    @Transactional
    public void removeSongFromAlbum(UUID albumId, UUID songId, UUID artistId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album không tồn tại với id: " + albumId));

        if (!album.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa album này");
        }

        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài hát không tồn tại với id: " + songId));

        if (!song.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền gỡ bài hát này");
        }

        if (song.getAlbum() == null || !song.getAlbum().getId().equals(albumId)) {
            throw new BadRequestException("Bài hát không thuộc album này");
        }

        // Tách bài hát khỏi album thành bài hát độc lập
        song.setAlbum(null);
        song.setTrackNumber(null);
        songRepository.save(song);

        // Giảm total_tracks của album
        album.setTotalTracks(Math.max(0, album.getTotalTracks() - 1));
        albumRepository.save(album);
    }
    
    @Transactional(readOnly = true)
    public Page<AlbumResponse> getAlbumsByOwner(UUID ownerId, Boolean isDeleted, Pageable pageable) {
        if (isDeleted != null) {
            return albumRepository.findByOwnerIdAndIsDeleted(ownerId, isDeleted, pageable)
                    .map(album -> modelMapper.map(album, AlbumResponse.class));
        }
        return albumRepository.findByOwnerIdAndIsDeletedFalse(ownerId, pageable)
                .map(album -> modelMapper.map(album, AlbumResponse.class));
    }

    @Transactional(readOnly = true)
    public Page<AlbumResponse> getAlbumsByOwner(UUID ownerId, Pageable pageable) {
        return getAlbumsByOwner(ownerId, false, pageable);
    }
    
    @Transactional(readOnly = true)
    public AlbumResponse getAlbumById(UUID albumId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album không tồn tại với id: " + albumId));
        return modelMapper.map(album, AlbumResponse.class);
    }

    @Transactional(readOnly = true)
    public List<AlbumResponse> getAlbumsByStatus(String status) {
        return albumRepository.findByStatusAndIsDeletedFalse(status).stream()
                .map(album -> modelMapper.map(album, AlbumResponse.class))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AlbumResponse> getAlbumsByStatus(String status, Pageable pageable) {
        return albumRepository.findByStatusAndIsDeletedFalse(status, pageable)
                .map(album -> modelMapper.map(album, AlbumResponse.class));
    }

    @Transactional
    public void updateAlbumStatus(UUID albumId, String status) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album không tồn tại với id: " + albumId));
        album.setStatus(status);
        albumRepository.save(album);

        // Quy tắc nghiệp vụ: Nếu Admin duyệt ALBUM, tự động duyệt toàn bộ bài hát trong album đó.
        // Nếu Admin TAKEDOWN hoặc REJECTED album, cập nhật trạng thái của tất cả bài hát theo.
        if ("APPROVED".equals(status) || "REJECTED".equals(status) || "TAKEDOWN".equals(status)) {
            List<Song> songs = songRepository.findByAlbumId(albumId);
            for (Song song : songs) {
                song.setStatus(status);
            }
            songRepository.saveAll(songs);
        }
    }
}
