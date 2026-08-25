package com.example.adminservice.service;

import com.example.adminservice.model.dto.request.*;
import com.example.adminservice.model.dto.response.*;
import com.example.adminservice.model.entity.RefreshToken;
import com.example.adminservice.model.entity.Admin;
import com.example.adminservice.repository.RefreshTokenRepository;
import com.example.adminservice.repository.AdminRepository;
import com.mcmusic.sharedauth.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import com.example.adminservice.exception.ApiException;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final AdminRepository adminRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final ModelMapper modelMapper;

    public AuthResponse login(LoginRequest request) {
        Admin admin = adminRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác");
        }

        return generateAuthResponse(admin);
    }

    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        
        RefreshToken refreshToken = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token không hợp lệ hoặc đã bị xóa"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token đã hết hạn, vui lòng đăng nhập lại");
        }

        Admin admin = refreshToken.getAdmin();
        
        // Refresh token rotation: delete old, issue new
        refreshTokenRepository.delete(refreshToken);

        Map<String, Object> claims = Map.of("role", admin.getRole());
        String newAccessToken = jwtTokenProvider.generateAccessToken(admin.getId().toString(), claims);
        String newRefreshTokenStr = jwtTokenProvider.generateRefreshToken(admin.getId().toString());

        saveRefreshToken(admin, newRefreshTokenStr);

        return new TokenRefreshResponse(newAccessToken, newRefreshTokenStr);
    }

    public void logout(LogoutRequest request) {
        refreshTokenRepository.deleteByToken(request.getRefreshToken());
    }

    private AuthResponse generateAuthResponse(Admin admin) {
        Map<String, Object> claims = Map.of("role", admin.getRole());
        String accessToken = jwtTokenProvider.generateAccessToken(admin.getId().toString(), claims);
        String refreshToken = jwtTokenProvider.generateRefreshToken(admin.getId().toString());

        saveRefreshToken(admin, refreshToken);

        AuthResponse response = modelMapper.map(admin, AuthResponse.class);
        response.setAdminId(admin.getId());
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);

        return response;
    }

    private void saveRefreshToken(Admin admin, String token) {
        Date expirationDate = jwtTokenProvider.getExpirationDateFromToken(token);
        LocalDateTime expiresAt = LocalDateTime.ofInstant(expirationDate.toInstant(), ZoneId.systemDefault());

        RefreshToken refreshToken = RefreshToken.builder()
                .admin(admin)
                .token(token)
                .expiresAt(expiresAt)
                .build();
        refreshTokenRepository.save(refreshToken);
    }
}
