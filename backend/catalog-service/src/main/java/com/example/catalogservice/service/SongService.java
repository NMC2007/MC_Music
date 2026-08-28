package com.example.catalogservice.service;

import com.example.catalogservice.exception.ResourceNotFoundException;
import com.example.catalogservice.model.dto.request.SongUploadRequest;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.entity.Album;
import com.example.catalogservice.model.entity.Song;
import com.example.catalogservice.model.dto.request.LyricsUpdateRequest;
import com.example.catalogservice.model.dto.request.SongArtistAddRequest;
import com.example.catalogservice.model.entity.Lyrics;
import com.example.catalogservice.model.entity.SongArtist;
import com.example.catalogservice.repository.LyricsRepository;
import com.example.catalogservice.repository.SongArtistRepository;
import com.example.catalogservice.repository.SongRepository;
import com.example.catalogservice.repository.AlbumRepository;
import com.example.catalogservice.exception.UnauthorizedAccessException;
import com.example.catalogservice.exception.BadRequestException;
import com.example.catalogservice.client.ArtistServiceClient;
import com.example.catalogservice.client.ArtistInternalResponse;
import feign.FeignException;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SongService {

    private final SongRepository songRepository;
    private final AlbumRepository albumRepository;
    private final LyricsRepository lyricsRepository;
    private final SongArtistRepository songArtistRepository;
    private final ArtistServiceClient artistServiceClient;
    private final CloudinaryService cloudinaryService;
    private final ModelMapper modelMapper;

    public SongService(SongRepository songRepository, AlbumRepository albumRepository, 
                       LyricsRepository lyricsRepository, SongArtistRepository songArtistRepository,
                       ArtistServiceClient artistServiceClient,
                       CloudinaryService cloudinaryService, ModelMapper modelMapper) {
        this.songRepository = songRepository;
        this.albumRepository = albumRepository;
        this.lyricsRepository = lyricsRepository;
        this.songArtistRepository = songArtistRepository;
        this.artistServiceClient = artistServiceClient;
        this.cloudinaryService = cloudinaryService;
        this.modelMapper = modelMapper;
    }

    @Transactional
    public SongResponse uploadSong(SongUploadRequest request, UUID ownerId) throws IOException {
        Song song = modelMapper.map(request, Song.class);
        song.setOwnerId(ownerId);
        
        try {
            ArtistInternalResponse artistInfo = artistServiceClient.getArtistById(ownerId);
            song.setOwnerName(artistInfo.getStageName());
        } catch (Exception e) {
            song.setOwnerName("Unknown Artist");
        }
        
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

    @Transactional
    public void updateLyrics(UUID songId, LyricsUpdateRequest request, UUID artistId) {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Song not found"));
        
        if (!song.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền cập nhật bài hát này");
        }

        Lyrics lyrics = lyricsRepository.findBySongId(songId).orElse(new Lyrics());
        lyrics.setSong(song);
        lyrics.setContent(request.getContent());
        lyrics.setLanguage(request.getLanguage());
        lyricsRepository.save(lyrics);
    }

    @Transactional
    public void addSongArtist(UUID songId, SongArtistAddRequest request, UUID artistId) {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Song not found"));
        
        if (!song.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền cập nhật bài hát này");
        }

        // 1. Chặn chủ sở hữu tự thêm chính mình làm nghệ sĩ phụ
        if (song.getOwnerId().equals(request.getArtistId())) {
            throw new BadRequestException("Không thể thêm chính mình làm nghệ sĩ phụ");
        }

        // 2. Chặn việc thêm trùng lặp một nghệ sĩ vào cùng một bài hát
        if (songArtistRepository.existsBySongIdAndArtistId(songId, request.getArtistId())) {
            throw new BadRequestException("Nghệ sĩ này đã được thêm vào bài hát");
        }

        // 3. Gọi Internal API sang artist-service để kiểm tra và lấy tên nghệ sĩ
        ArtistInternalResponse artistInfo;
        try {
            artistInfo = artistServiceClient.getArtistById(request.getArtistId());
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Nghệ sĩ (artistId) không tồn tại trong hệ thống");
        } catch (FeignException e) {
            throw new RuntimeException("Lỗi giao tiếp với Artist Service: " + e.getMessage());
        }

        SongArtist songArtist = new SongArtist();
        songArtist.setSong(song);
        songArtist.setArtistId(request.getArtistId());
        songArtist.setArtistName(artistInfo.getStageName());
        songArtist.setRole(request.getRole());
        songArtistRepository.save(songArtist);
    }
}
