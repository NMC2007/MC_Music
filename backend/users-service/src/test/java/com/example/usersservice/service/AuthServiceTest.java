package com.example.usersservice.service;

import com.example.usersservice.exception.ApiException;
import com.example.usersservice.model.dto.request.LoginRequest;
import com.example.usersservice.model.dto.request.LogoutRequest;
import com.example.usersservice.model.dto.request.RegisterRequest;
import com.example.usersservice.model.dto.request.TokenRefreshRequest;
import com.example.usersservice.model.dto.response.AuthResponse;
import com.example.usersservice.model.dto.response.TokenRefreshResponse;
import com.example.usersservice.model.entity.RefreshToken;
import com.example.usersservice.model.entity.User;
import com.example.usersservice.repository.RefreshTokenRepository;
import com.example.usersservice.repository.UserRepository;
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

import java.time.LocalDateTime;
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
@DisplayName("Users Service - AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

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

    private User sampleUser;
    private UUID sampleUserId;

    @BeforeEach
    void setUp() {
        sampleUserId = UUID.randomUUID();
        sampleUser = User.builder()
                .id(sampleUserId)
                .email("testuser@mcmusic.com")
                .fullName("Test User")
                .passwordHash("encodedPassword")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Đăng ký người dùng mới thành công")
    void shouldRegisterUserSuccessfully() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@mcmusic.com");
        request.setPassword("Password123!");
        request.setFullName("New User");

        when(userRepository.existsByEmail("newuser@mcmusic.com")).thenReturn(false);
        when(modelMapper.map(request, User.class)).thenReturn(new User());
        when(passwordEncoder.encode("Password123!")).thenReturn("encodedHash");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtTokenProvider.generateAccessToken(anyString(), any())).thenReturn("mockAccessToken");
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn("mockRefreshToken");
        when(jwtTokenProvider.getExpirationDateFromToken("mockRefreshToken")).thenReturn(new Date(System.currentTimeMillis() + 600000));
        when(modelMapper.map(sampleUser, AuthResponse.class)).thenReturn(new AuthResponse());

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mockAccessToken");
        assertThat(response.getRefreshToken()).isEqualTo("mockRefreshToken");
        verify(userRepository).save(any(User.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Báo lỗi Conflict (409) khi đăng ký với email đã tồn tại")
    void shouldThrowConflictWhenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("testuser@mcmusic.com");

        when(userRepository.existsByEmail("testuser@mcmusic.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT)
                .hasMessageContaining("Email đã tồn tại");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đăng nhập thành công với thông tin chính xác")
    void shouldLoginSuccessfullyWithCorrectCredentials() {
        LoginRequest request = new LoginRequest();
        request.setEmail("testuser@mcmusic.com");
        request.setPassword("Password123!");

        when(userRepository.findByEmail("testuser@mcmusic.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password123!", "encodedPassword")).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(eq(sampleUserId.toString()), any())).thenReturn("mockAccessToken");
        when(jwtTokenProvider.generateRefreshToken(eq(sampleUserId.toString()))).thenReturn("mockRefreshToken");
        when(jwtTokenProvider.getExpirationDateFromToken("mockRefreshToken")).thenReturn(new Date(System.currentTimeMillis() + 600000));
        when(modelMapper.map(sampleUser, AuthResponse.class)).thenReturn(new AuthResponse());

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mockAccessToken");
        assertThat(response.getRefreshToken()).isEqualTo("mockRefreshToken");
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Báo lỗi Unauthorized (401) khi email không tồn tại")
    void shouldThrowUnauthorizedWhenEmailNotFound() {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@mcmusic.com");
        request.setPassword("anyPassword");

        when(userRepository.findByEmail("nonexistent@mcmusic.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Báo lỗi Unauthorized (401) khi mật khẩu không khớp")
    void shouldThrowUnauthorizedWhenPasswordIncorrect() {
        LoginRequest request = new LoginRequest();
        request.setEmail("testuser@mcmusic.com");
        request.setPassword("wrongPassword");

        when(userRepository.findByEmail("testuser@mcmusic.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Báo lỗi Forbidden (403) khi tài khoản đã bị khóa")
    void shouldThrowForbiddenWhenUserIsInactive() {
        sampleUser.setIsActive(false);

        LoginRequest request = new LoginRequest();
        request.setEmail("testuser@mcmusic.com");
        request.setPassword("Password123!");

        when(userRepository.findByEmail("testuser@mcmusic.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password123!", "encodedPassword")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN)
                .hasMessageContaining("bị khóa");
    }

    @Test
    @DisplayName("Refresh Token thành công và thực hiện cơ chế token rotation")
    void shouldRefreshTokenSuccessfully() {
        String tokenStr = "validRefreshTokenString";
        RefreshToken storedToken = RefreshToken.builder()
                .token(tokenStr)
                .user(sampleUser)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();

        TokenRefreshRequest request = new TokenRefreshRequest();
        request.setRefreshToken(tokenStr);

        when(refreshTokenRepository.findByToken(tokenStr)).thenReturn(Optional.of(storedToken));
        when(jwtTokenProvider.generateAccessToken(eq(sampleUserId.toString()), any())).thenReturn("newAccessToken");
        when(jwtTokenProvider.generateRefreshToken(eq(sampleUserId.toString()))).thenReturn("newRefreshToken");
        when(jwtTokenProvider.getExpirationDateFromToken("newRefreshToken")).thenReturn(new Date(System.currentTimeMillis() + 600000));

        TokenRefreshResponse response = authService.refreshToken(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("newAccessToken");
        assertThat(response.getRefreshToken()).isEqualTo("newRefreshToken");
        verify(refreshTokenRepository).delete(storedToken); // Old token deleted (rotation)
        verify(refreshTokenRepository).save(any(RefreshToken.class)); // New token saved
    }

    @Test
    @DisplayName("Báo lỗi Unauthorized khi Refresh Token đã hết hạn")
    void shouldThrowUnauthorizedWhenRefreshTokenExpired() {
        String tokenStr = "expiredRefreshTokenString";
        RefreshToken expiredToken = RefreshToken.builder()
                .token(tokenStr)
                .user(sampleUser)
                .expiresAt(LocalDateTime.now().minusHours(1))
                .build();

        TokenRefreshRequest request = new TokenRefreshRequest();
        request.setRefreshToken(tokenStr);

        when(refreshTokenRepository.findByToken(tokenStr)).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.UNAUTHORIZED)
                .hasMessageContaining("hết hạn");

        verify(refreshTokenRepository).delete(expiredToken);
    }

    @Test
    @DisplayName("Đăng xuất thành công, xóa refresh token khỏi database")
    void shouldLogoutSuccessfully() {
        LogoutRequest request = new LogoutRequest();
        request.setRefreshToken("tokenToDelete");

        authService.logout(request);

        verify(refreshTokenRepository).deleteByToken("tokenToDelete");
    }
}

