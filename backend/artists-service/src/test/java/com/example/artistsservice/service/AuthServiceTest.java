package com.example.artistsservice.service;

import com.example.artistsservice.exception.ApiException;
import com.example.artistsservice.model.dto.request.LoginRequest;
import com.example.artistsservice.model.dto.request.RegisterRequest;
import com.example.artistsservice.model.dto.response.AuthResponse;
import com.example.artistsservice.model.entity.Artist;
import com.example.artistsservice.model.entity.RefreshToken;
import com.example.artistsservice.repository.ArtistRepository;
import com.example.artistsservice.repository.RefreshTokenRepository;
import com.mcmusic.sharedauth.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Artists Service - AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private ArtistRepository artistRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private AuthService authService;

    private Artist sampleArtist;
    private UUID artistId;

    @BeforeEach
    void setUp() {
        artistId = UUID.randomUUID();
        sampleArtist = Artist.builder()
                .id(artistId)
                .email("artist@mcmusic.com")
                .stageName("Vũ Cát Tường")
                .passwordHash("encodedHash")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Đăng ký nghệ sĩ mới thành công")
    void shouldRegisterArtistSuccessfully() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newartist@mcmusic.com");
        request.setPassword("Password123!");
        request.setStageName("Vũ Cát Tường");

        when(artistRepository.existsByEmail("newartist@mcmusic.com")).thenReturn(false);
        when(modelMapper.map(request, Artist.class)).thenReturn(new Artist());
        when(passwordEncoder.encode("Password123!")).thenReturn("encodedHash");
        when(artistRepository.save(any(Artist.class))).thenReturn(sampleArtist);
        when(jwtTokenProvider.generateAccessToken(anyString(), any())).thenReturn("mockAccessToken");
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn("mockRefreshToken");
        when(jwtTokenProvider.getExpirationDateFromToken("mockRefreshToken")).thenReturn(new Date(System.currentTimeMillis() + 600000));
        when(modelMapper.map(sampleArtist, AuthResponse.class)).thenReturn(new AuthResponse());

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mockAccessToken");
        verify(artistRepository).save(any(Artist.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Báo lỗi Conflict (409) khi đăng ký trùng email nghệ sĩ")
    void shouldThrowConflictWhenEmailExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("artist@mcmusic.com");

        when(artistRepository.existsByEmail("artist@mcmusic.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT)
                .hasMessageContaining("Email đã tồn tại");
    }

    @Test
    @DisplayName("Đăng nhập nghệ sĩ thành công với mật khẩu chính xác")
    void shouldLoginArtistSuccessfully() {
        LoginRequest request = new LoginRequest();
        request.setEmail("artist@mcmusic.com");
        request.setPassword("Password123!");

        when(artistRepository.findByEmail("artist@mcmusic.com")).thenReturn(Optional.of(sampleArtist));
        when(passwordEncoder.matches("Password123!", "encodedHash")).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(eq(artistId.toString()), any())).thenReturn("mockAccessToken");
        when(jwtTokenProvider.generateRefreshToken(eq(artistId.toString()))).thenReturn("mockRefreshToken");
        when(jwtTokenProvider.getExpirationDateFromToken("mockRefreshToken")).thenReturn(new Date(System.currentTimeMillis() + 600000));
        when(modelMapper.map(sampleArtist, AuthResponse.class)).thenReturn(new AuthResponse());

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mockAccessToken");
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Báo lỗi Forbidden khi tài khoản nghệ sĩ đã bị khóa")
    void shouldThrowForbiddenWhenArtistIsInactive() {
        sampleArtist.setIsActive(false);

        LoginRequest request = new LoginRequest();
        request.setEmail("artist@mcmusic.com");
        request.setPassword("Password123!");

        when(artistRepository.findByEmail("artist@mcmusic.com")).thenReturn(Optional.of(sampleArtist));
        when(passwordEncoder.matches("Password123!", "encodedHash")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN)
                .hasMessageContaining("bị khóa");
    }
}

