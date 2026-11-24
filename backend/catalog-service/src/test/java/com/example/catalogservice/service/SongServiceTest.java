package com.example.catalogservice.service;

import com.example.catalogservice.client.ArtistServiceClient;
import com.example.catalogservice.exception.BadRequestException;
import com.example.catalogservice.exception.ResourceNotFoundException;
import com.example.catalogservice.exception.UnauthorizedAccessException;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.entity.Song;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.List;
import com.example.catalogservice.repository.AlbumRepository;
import com.example.catalogservice.repository.GenreRepository;
import com.example.catalogservice.repository.LyricsRepository;
import com.example.catalogservice.repository.SongArtistRepository;
import com.example.catalogservice.repository.SongRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Catalog Service - SongService Unit Tests")
class SongServiceTest {

    @Mock
    private SongRepository songRepository;

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private LyricsRepository lyricsRepository;

    @Mock
    private SongArtistRepository songArtistRepository;

    @Mock
    private GenreRepository genreRepository;

    @Mock
    private ArtistServiceClient artistServiceClient;

    @Mock
    private CloudinaryService cloudinaryService;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private TransactionTemplate transactionTemplate;

    @InjectMocks
    private SongService songService;

    private UUID songId;
    private UUID artistId;
    private Song sampleSong;

    @BeforeEach
    void setUp() {
        songId = UUID.randomUUID();
        artistId = UUID.randomUUID();
        sampleSong = Song.builder()
                .id(songId)
                .ownerId(artistId)
                .title("Âm Thầm Bên Em")
                .status("PENDING")
                .isDeleted(false)
                .build();
    }

    @Test
    @DisplayName("Admin phê duyệt bài hát (APPROVED) thành công và xóa rejectionReason cũ")
    void shouldApproveSongSuccessfully() {
        sampleSong.setRejectionReason("Lỗi âm thanh cũ");
        when(songRepository.findById(songId)).thenReturn(Optional.of(sampleSong));

        songService.updateSongStatus(songId, "APPROVED", null);

        assertThat(sampleSong.getStatus()).isEqualTo("APPROVED");
        assertThat(sampleSong.getRejectionReason()).isNull();
        verify(songRepository).save(sampleSong);
    }

    @Test
    @DisplayName("Admin từ chối bài hát (REJECTED) lưu đúng lý do vi phạm")
    void shouldRejectSongWithRejectionReason() {
        String reason = "Vi phạm bản quyền giai điệu từ 01:20 đến 01:45";
        when(songRepository.findById(songId)).thenReturn(Optional.of(sampleSong));

        songService.updateSongStatus(songId, "REJECTED", reason);

        assertThat(sampleSong.getStatus()).isEqualTo("REJECTED");
        assertThat(sampleSong.getRejectionReason()).isEqualTo(reason);
        verify(songRepository).save(sampleSong);
    }

    @Test
    @DisplayName("Báo lỗi BadRequest khi từ chối bài hát mà không cung cấp lý do vi phạm")
    void shouldThrowBadRequestWhenRejectingWithoutReason() {
        assertThatThrownBy(() -> songService.updateSongStatus(songId, "REJECTED", "   "))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Lý do vi phạm không được để trống");

        verify(songRepository, never()).save(any());
    }

    @Test
    @DisplayName("Báo lỗi BadRequest khi truyền trạng thái không hợp lệ")
    void shouldThrowBadRequestWhenStatusIsInvalid() {
        assertThatThrownBy(() -> songService.updateSongStatus(songId, "INVALID_STATUS", null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Trạng thái không hợp lệ");
    }

    @Test
    @DisplayName("Nghệ sĩ xóa mềm (Soft delete) bài hát của chính mình thành công")
    void shouldSoftDeleteSongSuccessfully() {
        when(songRepository.findById(songId)).thenReturn(Optional.of(sampleSong));

        songService.softDeleteSong(songId, artistId);

        assertThat(sampleSong.getIsDeleted()).isTrue();
        verify(songRepository).save(sampleSong);
    }

    @Test
    @DisplayName("Báo lỗi Unauthorized khi xóa bài hát của nghệ sĩ khác")
    void shouldThrowUnauthorizedWhenDeletingOthersSong() {
        UUID strangerId = UUID.randomUUID();
        when(songRepository.findById(songId)).thenReturn(Optional.of(sampleSong));

        assertThatThrownBy(() -> songService.softDeleteSong(songId, strangerId))
                .isInstanceOf(UnauthorizedAccessException.class)
                .hasMessageContaining("không có quyền xóa bài hát");

        verify(songRepository, never()).save(any());
    }

    @Test
    @DisplayName("Báo lỗi ResourceNotFound khi thao tác bài hát không tồn tại")
    void shouldThrowNotFoundWhenSongDoesNotExist() {
        when(songRepository.findById(songId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> songService.updateSongStatus(songId, "APPROVED", null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Nghệ sĩ tìm kiếm bài hát theo từ khóa keyword thành công")
    void shouldGetSongsByOwnerWithKeywordFilter() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Song> songPage = new PageImpl<>(List.of(sampleSong));
        SongResponse songResponse = new SongResponse();
        songResponse.setId(songId);
        songResponse.setTitle(sampleSong.getTitle());

        when(songRepository.findByOwnerIdWithFilters(eq(artistId), eq("APPROVED"), eq(false), eq("Âm Thầm"), eq(pageable)))
                .thenReturn(songPage);
        when(modelMapper.map(sampleSong, SongResponse.class)).thenReturn(songResponse);

        Page<SongResponse> result = songService.getSongsByOwner(artistId, "APPROVED", false, "Âm Thầm", pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Âm Thầm Bên Em");
        verify(songRepository).findByOwnerIdWithFilters(artistId, "APPROVED", false, "Âm Thầm", pageable);
    }
}

