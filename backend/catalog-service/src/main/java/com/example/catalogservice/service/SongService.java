package com.example.catalogservice.service;

import com.example.catalogservice.exception.ResourceNotFoundException;
import com.example.catalogservice.model.dto.request.SongUploadRequest;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.entity.Album;
import com.example.catalogservice.model.entity.Song;
import com.example.catalogservice.model.dto.request.LyricsUpdateRequest;
import com.example.catalogservice.model.dto.request.SongArtistAddRequest;
import com.example.catalogservice.model.dto.request.AlbumSongAddRequest;
import com.example.catalogservice.model.dto.request.AlbumSongReorderRequest;
import com.example.catalogservice.model.entity.Lyrics;
import com.example.catalogservice.model.entity.SongArtist;
import com.example.catalogservice.repository.LyricsRepository;
import com.example.catalogservice.repository.SongArtistRepository;
import com.example.catalogservice.repository.SongRepository;
import com.example.catalogservice.repository.AlbumRepository;
import com.example.catalogservice.repository.GenreRepository;
import com.example.catalogservice.model.entity.Genre;
import com.example.catalogservice.exception.UnauthorizedAccessException;
import com.example.catalogservice.exception.BadRequestException;
import com.example.catalogservice.client.ArtistServiceClient;
import com.example.catalogservice.client.ArtistInternalResponse;
import feign.FeignException;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
public class SongService {

    private final SongRepository songRepository;
    private final AlbumRepository albumRepository;
    private final LyricsRepository lyricsRepository;
    private final SongArtistRepository songArtistRepository;
    private final GenreRepository genreRepository;
    private final ArtistServiceClient artistServiceClient;
    private final CloudinaryService cloudinaryService;
    private final ModelMapper modelMapper;

    public SongService(SongRepository songRepository, AlbumRepository albumRepository, 
                       LyricsRepository lyricsRepository, SongArtistRepository songArtistRepository,
                       GenreRepository genreRepository,
                       ArtistServiceClient artistServiceClient,
                       CloudinaryService cloudinaryService, ModelMapper modelMapper) {
        this.songRepository = songRepository;
        this.albumRepository = albumRepository;
        this.lyricsRepository = lyricsRepository;
        this.songArtistRepository = songArtistRepository;
        this.genreRepository = genreRepository;
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
            
            // Auto-assign trackNumber if not provided
            if (request.getTrackNumber() == null) {
                int currentTracks = songRepository.countByAlbumId(album.getId());
                song.setTrackNumber(currentTracks + 1);
            }
            
            // Increase totalTracks
            album.setTotalTracks(album.getTotalTracks() + 1);
            albumRepository.save(album);
        }

        // Process Genres
        if (request.getGenreIds() == null || request.getGenreIds().isEmpty()) {
            throw new BadRequestException("Phải chọn ít nhất một thể loại âm nhạc");
        }
        List<Genre> genresList = genreRepository.findAllById(request.getGenreIds());
        if (genresList.size() != request.getGenreIds().size()) {
            throw new BadRequestException("Một hoặc nhiều thể loại âm nhạc không hợp lệ");
        }
        song.setGenres(new HashSet<>(genresList));

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

        // Quy tắc nghiệp vụ: Nếu bài hát được APPROVED và thuộc về một album,
        // kiểm tra xem toàn bộ bài hát trong album đó đã APPROVED chưa.
        // Nếu có, tự động APPROVE luôn album đó.
        if ("APPROVED".equals(status) && song.getAlbum() != null) {
            Album album = song.getAlbum();
            if (!"APPROVED".equals(album.getStatus())) {
                long totalSongsInAlbum = songRepository.countByAlbumId(album.getId());
                long approvedSongsInAlbum = songRepository.countByAlbumIdAndStatus(album.getId(), "APPROVED");
                if (totalSongsInAlbum > 0 && approvedSongsInAlbum == totalSongsInAlbum) {
                    album.setStatus("APPROVED");
                    albumRepository.save(album);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<SongResponse> getSongsByStatus(String status, Pageable pageable) {
        return songRepository.findByStatus(status, pageable)
                .map(song -> modelMapper.map(song, SongResponse.class));
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

    @Transactional
    public void addSongToAlbum(UUID albumId, AlbumSongAddRequest request, UUID artistId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album không tồn tại"));
        
        if (!album.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa album này");
        }

        Song song = songRepository.findById(request.getSongId())
                .orElseThrow(() -> new ResourceNotFoundException("Bài hát không tồn tại"));

        if (!song.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền thêm bài hát này");
        }

        if (song.getAlbum() != null && song.getAlbum().getId().equals(albumId)) {
            throw new BadRequestException("Bài hát đã nằm trong album này");
        }

        if (song.getAlbum() != null) {
            Album oldAlbum = song.getAlbum();
            oldAlbum.setTotalTracks(Math.max(0, oldAlbum.getTotalTracks() - 1));
            albumRepository.save(oldAlbum);
        }

        song.setAlbum(album);
        album.setTotalTracks(album.getTotalTracks() + 1);
        albumRepository.save(album);

        if (request.getTrackNumber() != null) {
            song.setTrackNumber(request.getTrackNumber());
        } else {
            song.setTrackNumber(album.getTotalTracks());
        }
        
        songRepository.save(song);
    }

    @Transactional
    public void reorderSongsInAlbum(UUID albumId, AlbumSongReorderRequest request, UUID artistId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("Album không tồn tại"));
        
        if (!album.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa album này");
        }

        for (AlbumSongReorderRequest.SongOrder order : request.getSongOrders()) {
            Song song = songRepository.findById(order.getSongId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bài hát không tồn tại: " + order.getSongId()));
            
            if (song.getAlbum() == null || !song.getAlbum().getId().equals(albumId)) {
                throw new BadRequestException("Bài hát " + song.getTitle() + " không thuộc album này");
            }
            
            song.setTrackNumber(order.getTrackNumber());
            songRepository.save(song);
        }
    }
}
