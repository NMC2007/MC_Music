package com.example.usersservice.service;

import com.example.usersservice.client.CatalogServiceClient;
import com.example.usersservice.client.SongInternalResponse;
import com.example.usersservice.exception.ApiException;
import com.example.usersservice.model.dto.request.PlaylistCreateRequest;
import com.example.usersservice.model.dto.request.PlaylistSongAddRequest;
import com.example.usersservice.model.dto.response.PlaylistResponse;
import com.example.usersservice.model.dto.response.PlaylistSongResponse;
import com.example.usersservice.model.entity.Playlist;
import com.example.usersservice.model.entity.PlaylistSong;
import com.example.usersservice.model.entity.PlaylistSongId;
import com.example.usersservice.repository.PlaylistRepository;
import com.example.usersservice.repository.PlaylistSongRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Users Service - PlaylistService Unit Tests")
class PlaylistServiceTest {

    @Mock
    private PlaylistRepository playlistRepository;

    @Mock
    private PlaylistSongRepository playlistSongRepository;

    @Mock
    private CatalogServiceClient catalogServiceClient;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private PlaylistService playlistService;

    private UUID userId;
    private UUID playlistId;
    private Playlist samplePlaylist;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        playlistId = UUID.randomUUID();
        samplePlaylist = Playlist.builder()
                .id(playlistId)
                .userId(userId)
                .name("Nhạc Chill Cuối Tuần")
                .description("Tuyển tập acoustic thư giãn")
                .isPublic(true)
                .build();
    }

    @Test
    @DisplayName("Tạo Playlist mới thành công")
    void shouldCreatePlaylistSuccessfully() {
        PlaylistCreateRequest request = new PlaylistCreateRequest();
        request.setName("Nhạc Chill Cuối Tuần");
        request.setDescription("Tuyển tập acoustic");
        request.setIsPublic(true);

        when(playlistRepository.save(any(Playlist.class))).thenReturn(samplePlaylist);
        when(modelMapper.map(samplePlaylist, PlaylistResponse.class)).thenReturn(new PlaylistResponse());

        PlaylistResponse response = playlistService.createPlaylist(request, userId);

        assertThat(response).isNotNull();
        verify(playlistRepository).save(any(Playlist.class));
    }

    @Test
    @DisplayName("Xóa Playlist thành công nếu là chủ sở hữu")
    void shouldDeletePlaylistSuccessfully() {
        when(playlistRepository.findById(playlistId)).thenReturn(Optional.of(samplePlaylist));

        playlistService.deletePlaylist(playlistId, userId);

        verify(playlistSongRepository).deleteByPlaylistId(playlistId);
        verify(playlistRepository).delete(samplePlaylist);
    }

    @Test
    @DisplayName("Báo lỗi Forbidden khi xóa playlist của người dùng khác")
    void shouldThrowForbiddenWhenDeletingOtherUsersPlaylist() {
        UUID strangerId = UUID.randomUUID();
        when(playlistRepository.findById(playlistId)).thenReturn(Optional.of(samplePlaylist));

        assertThatThrownBy(() -> playlistService.deletePlaylist(playlistId, strangerId))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN)
                .hasMessageContaining("không có quyền xóa");

        verify(playlistRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Thêm bài hát vào playlist thành công")
    void shouldAddSongToPlaylistSuccessfully() {
        UUID songId = UUID.randomUUID();
        PlaylistSongAddRequest request = new PlaylistSongAddRequest();
        request.setSongId(songId);

        SongInternalResponse songDetails = new SongInternalResponse();
        songDetails.setId(songId);
        songDetails.setTitle("Nắng Ấm Xa Dần");
        songDetails.setOwnerName("Sơn Tùng M-TP");
        songDetails.setCoverImage("https://res.cloudinary.com/demo/image/upload/sample.jpg");

        PlaylistSongId songEntryId = new PlaylistSongId(playlistId, songId);

        when(playlistRepository.findById(playlistId)).thenReturn(Optional.of(samplePlaylist));
        when(playlistSongRepository.existsById(songEntryId)).thenReturn(false);
        when(catalogServiceClient.getSongDetails(songId)).thenReturn(songDetails);
        when(playlistSongRepository.save(any(PlaylistSong.class))).thenReturn(new PlaylistSong());
        when(modelMapper.map(any(), eq(PlaylistSongResponse.class))).thenReturn(new PlaylistSongResponse());

        PlaylistSongResponse response = playlistService.addSongToPlaylist(playlistId, request, userId);

        assertThat(response).isNotNull();
        verify(playlistSongRepository).save(any(PlaylistSong.class));
    }

    @Test
    @DisplayName("Báo lỗi Conflict khi bài hát đã có sẵn trong playlist")
    void shouldThrowConflictWhenSongAlreadyInPlaylist() {
        UUID songId = UUID.randomUUID();
        PlaylistSongAddRequest request = new PlaylistSongAddRequest();
        request.setSongId(songId);

        PlaylistSongId songEntryId = new PlaylistSongId(playlistId, songId);

        when(playlistRepository.findById(playlistId)).thenReturn(Optional.of(samplePlaylist));
        when(playlistSongRepository.existsById(songEntryId)).thenReturn(true);

        assertThatThrownBy(() -> playlistService.addSongToPlaylist(playlistId, request, userId))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT)
                .hasMessageContaining("đã có trong playlist");

        verify(playlistSongRepository, never()).save(any());
    }
}
