package com.example.adminservice.service;

import com.example.adminservice.exception.ApiException;
import com.example.adminservice.model.dto.request.LoginRequest;
import com.example.adminservice.model.dto.response.AuthResponse;
import com.example.adminservice.model.entity.Admin;
import com.example.adminservice.model.entity.RefreshToken;
import com.example.adminservice.repository.AdminRepository;
import com.example.adminservice.repository.RefreshTokenRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Admin Service - AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private AdminRepository adminRepository;

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

    private Admin sampleAdmin;
    private UUID adminId;

    @BeforeEach
    void setUp() {
        adminId = UUID.randomUUID();
        sampleAdmin = Admin.builder()
                .id(adminId)
                .email("admin@mcmusic.com")
                .fullName("System Administrator")
                .role("ROLE_ADMIN")
                .passwordHash("encodedAdminHash")
                .build();
    }

    @Test
    @DisplayName("Admin đăng nhập thành công với mật khẩu chính xác")
    void shouldLoginAdminSuccessfully() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@mcmusic.com");
        request.setPassword("Admin@123");

        when(adminRepository.findByEmail("admin@mcmusic.com")).thenReturn(Optional.of(sampleAdmin));
        when(passwordEncoder.matches("Admin@123", "encodedAdminHash")).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(eq(adminId.toString()), any())).thenReturn("mockAdminAccessToken");
        when(jwtTokenProvider.generateRefreshToken(eq(adminId.toString()))).thenReturn("mockAdminRefreshToken");
        when(jwtTokenProvider.getExpirationDateFromToken("mockAdminRefreshToken")).thenReturn(new Date(System.currentTimeMillis() + 600000));
        when(modelMapper.map(sampleAdmin, AuthResponse.class)).thenReturn(new AuthResponse());

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mockAdminAccessToken");
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Báo lỗi Unauthorized khi email quản trị viên không tồn tại")
    void shouldThrowUnauthorizedWhenAdminEmailNotFound() {
        LoginRequest request = new LoginRequest();
        request.setEmail("unknown@mcmusic.com");
        request.setPassword("Admin@123");

        when(adminRepository.findByEmail("unknown@mcmusic.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Báo lỗi Unauthorized khi mật khẩu quản trị viên sai")
    void shouldThrowUnauthorizedWhenAdminPasswordWrong() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@mcmusic.com");
        request.setPassword("WrongPassword");

        when(adminRepository.findByEmail("admin@mcmusic.com")).thenReturn(Optional.of(sampleAdmin));
        when(passwordEncoder.matches("WrongPassword", "encodedAdminHash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.UNAUTHORIZED);
    }
}

