package com.example.catalogservice.service;

import com.example.catalogservice.exception.BadRequestException;
import com.example.catalogservice.exception.ResourceNotFoundException;
import com.example.catalogservice.exception.UnauthorizedAccessException;
import com.example.catalogservice.model.dto.request.AlbumSongAddRequest;
import com.example.catalogservice.model.dto.request.AlbumSongReorderRequest;
import com.example.catalogservice.model.dto.request.LyricsUpdateRequest;
import com.example.catalogservice.model.dto.request.SongArtistAddRequest;
import com.example.catalogservice.model.dto.request.SongUploadRequest;
import com.example.catalogservice.model.dto.request.SongUpdateRequest;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.entity.Album;
import com.example.catalogservice.model.entity.Genre;
import com.example.catalogservice.model.entity.Lyrics;
import com.example.catalogservice.model.entity.Song;
import com.example.catalogservice.model.entity.SongArtist;
import com.example.catalogservice.repository.AlbumRepository;
import com.example.catalogservice.repository.GenreRepository;
import com.example.catalogservice.repository.LyricsRepository;
import com.example.catalogservice.repository.SongArtistRepository;
import com.example.catalogservice.repository.SongRepository;
import com.example.catalogservice.client.ArtistServiceClient;
import com.example.catalogservice.client.ArtistInternalResponse;
import feign.FeignException;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SongService {

    private static final Set<String> VALID_STATUSES = Set.of("PENDING", "APPROVED", "REJECTED", "TAKEDOWN");

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
        song.setIsDeleted(false);
        
        if (request.getAlbumId() != null) {
            Album album = albumRepository.findById(request.getAlbumId())
                    .orElseThrow(() -> new ResourceNotFoundException("Album không tồn tại"));
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

    @Transactional
    public SongResponse updateSong(UUID songId, SongUpdateRequest request, UUID artistId) throws IOException {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài hát không tồn tại với id: " + songId));

        if (!song.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa bài hát này");
        }

        if (Boolean.TRUE.equals(song.getIsDeleted())) {
            throw new BadRequestException("Không thể chỉnh sửa bài hát đã bị xóa");
        }

        // 1. Cập nhật tiêu đề
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            song.setTitle(request.getTitle().trim());
        }

        // 2. Cập nhật cờ explicit
        if (request.getExplicit() != null) {
            song.setExplicit(request.getExplicit());
        }

        // 3. Cập nhật ảnh bìa (upload mới lên Cloudinary nếu có)
        if (request.getCoverImage() != null && !request.getCoverImage().isEmpty()) {
            Map coverUploadResult = cloudinaryService.uploadImage(request.getCoverImage());
            song.setCoverImage((String) coverUploadResult.get("secure_url"));
        }

        // 4. Cập nhật thể loại
        if (request.getGenreIds() != null) {
            if (request.getGenreIds().isEmpty()) {
                throw new BadRequestException("Phải chọn ít nhất một thể loại âm nhạc");
            }
            List<Genre> genresList = genreRepository.findAllById(request.getGenreIds());
            if (genresList.size() != request.getGenreIds().size()) {
                throw new BadRequestException("Một hoặc nhiều thể loại âm nhạc không hợp lệ");
            }
            song.setGenres(new HashSet<>(genresList));
        }

        // 5. Xử lý chuyển Album / Gỡ Album / Tách Single
        if (Boolean.TRUE.equals(request.getClearAlbum())) {
            // Gỡ khỏi album hiện tại
            if (song.getAlbum() != null) {
                Album oldAlbum = song.getAlbum();
                oldAlbum.setTotalTracks(Math.max(0, oldAlbum.getTotalTracks() - 1));
                albumRepository.save(oldAlbum);
                song.setAlbum(null);
                song.setTrackNumber(null);
            }
        } else if (request.getAlbumId() != null) {
            // Chuyển sang album mới hoặc cập nhật trackNumber trong cùng album
            if (song.getAlbum() == null || !song.getAlbum().getId().equals(request.getAlbumId())) {
                Album newAlbum = albumRepository.findById(request.getAlbumId())
                        .orElseThrow(() -> new ResourceNotFoundException("Album mới không tồn tại với id: " + request.getAlbumId()));

                if (!newAlbum.getOwnerId().equals(artistId)) {
                    throw new UnauthorizedAccessException("Album mới không thuộc quyền sở hữu của bạn");
                }

                if (Boolean.TRUE.equals(newAlbum.getIsDeleted())) {
                    throw new BadRequestException("Không thể chuyển bài hát vào album đã bị xóa");
                }

                // Giảm total_tracks của album cũ nếu có
                if (song.getAlbum() != null) {
                    Album oldAlbum = song.getAlbum();
                    oldAlbum.setTotalTracks(Math.max(0, oldAlbum.getTotalTracks() - 1));
                    albumRepository.save(oldAlbum);
                }

                // Tăng total_tracks cho album mới
                newAlbum.setTotalTracks(newAlbum.getTotalTracks() + 1);
                albumRepository.save(newAlbum);

                song.setAlbum(newAlbum);
                if (request.getTrackNumber() != null) {
                    song.setTrackNumber(request.getTrackNumber());
                } else {
                    song.setTrackNumber(newAlbum.getTotalTracks());
                }
            } else {
                // Cùng album, cập nhật số thứ tự nếu có
                if (request.getTrackNumber() != null) {
                    song.setTrackNumber(request.getTrackNumber());
                }
            }
        }

        // Quy tắc: Khi chỉnh sửa bài hát, bài hát tự động quay về trạng thái PENDING để Admin duyệt lại
        song.setStatus("PENDING");

        Song savedSong = songRepository.save(song);
        return modelMapper.map(savedSong, SongResponse.class);
    }

    @Transactional
    public void softDeleteSong(UUID songId, UUID artistId) {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài hát không tồn tại với id: " + songId));

        if (!song.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa bài hát này");
        }

        if (Boolean.TRUE.equals(song.getIsDeleted())) {
            return; // Đã bị xóa mềm trước đó
        }

        // 1. Đặt cờ xóa mềm (giữ nguyên file Cloudinary)
        song.setIsDeleted(true);
        songRepository.save(song);

        // 2. Quy tắc: Dù bài hát thuộc album hay không thì chỉ xóa duy nhất bài hát đó.
        // Nếu bài hát thuộc album, tự động giảm total_tracks của album đó.
        if (song.getAlbum() != null) {
            Album album = song.getAlbum();
            album.setTotalTracks(Math.max(0, album.getTotalTracks() - 1));
            albumRepository.save(album);
        }
    }

    @Transactional
    public SongResponse restoreSong(UUID songId, UUID artistId) {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài hát không tồn tại với id: " + songId));

        if (!song.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền khôi phục bài hát này");
        }

        if (!Boolean.TRUE.equals(song.getIsDeleted())) {
            throw new BadRequestException("Bài hát này không nằm trong thùng rác");
        }

        // 1. Khôi phục bài hát (giữ nguyên status trước khi xóa)
        song.setIsDeleted(false);

        // 2. Nếu bài hát thuộc album, tăng lại total_tracks cho album
        if (song.getAlbum() != null) {
            Album album = song.getAlbum();
            album.setTotalTracks(album.getTotalTracks() + 1);
            albumRepository.save(album);
        }

        Song savedSong = songRepository.save(song);
        return modelMapper.map(savedSong, SongResponse.class);
    }
    
    @Transactional(readOnly = true)
    public Page<SongResponse> getSongsByOwner(UUID ownerId, String status, Boolean isDeleted, Pageable pageable) {
        String filterStatus = null;
        if (status != null && !status.isBlank()) {
            filterStatus = status.trim().toUpperCase();
            if (!VALID_STATUSES.contains(filterStatus)) {
                throw new BadRequestException("Trạng thái không hợp lệ. Các giá trị hợp lệ: PENDING, APPROVED, REJECTED, TAKEDOWN");
            }
        }

        Page<Song> songPage;
        if (filterStatus != null && isDeleted != null) {
            songPage = songRepository.findByOwnerIdAndStatusAndIsDeleted(ownerId, filterStatus, isDeleted, pageable);
        } else if (filterStatus != null) {
            songPage = songRepository.findByOwnerIdAndStatusAndIsDeletedFalse(ownerId, filterStatus, pageable);
        } else if (isDeleted != null) {
            songPage = songRepository.findByOwnerIdAndIsDeleted(ownerId, isDeleted, pageable);
        } else {
            songPage = songRepository.findByOwnerIdAndIsDeletedFalse(ownerId, pageable);
        }

        return songPage.map(song -> modelMapper.map(song, SongResponse.class));
    }

    @Transactional(readOnly = true)
    public Page<SongResponse> getSongsByOwner(UUID ownerId, Boolean isDeleted, Pageable pageable) {
        return getSongsByOwner(ownerId, null, isDeleted, pageable);
    }

    @Transactional(readOnly = true)
    public Page<SongResponse> getSongsByOwner(UUID ownerId, Pageable pageable) {
        return getSongsByOwner(ownerId, null, false, pageable);
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
        return songRepository.findByStatusAndIsDeletedFalse(status, pageable)
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
    public void removeSongArtist(UUID songId, UUID artistIdToRemove, UUID artistId) {
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài hát không tồn tại với id: " + songId));

        if (!song.getOwnerId().equals(artistId)) {
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa bài hát này");
        }

        if (!songArtistRepository.existsBySongIdAndArtistId(songId, artistIdToRemove)) {
            throw new ResourceNotFoundException("Nghệ sĩ phụ không tồn tại trong bài hát này");
        }

        songArtistRepository.deleteBySongIdAndArtistId(songId, artistIdToRemove);
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
