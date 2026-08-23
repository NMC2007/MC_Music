package com.example.usersservice.service;

import com.example.usersservice.model.dto.request.*;
import com.example.usersservice.model.dto.response.*;
import com.example.usersservice.model.entity.RefreshToken;
import com.example.usersservice.model.entity.User;
import com.example.usersservice.repository.RefreshTokenRepository;
import com.example.usersservice.repository.UserRepository;
import com.mcmusic.sharedauth.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import com.example.usersservice.exception.ApiException;
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

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final ModelMapper modelMapper;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email đã tồn tại trong hệ thống");
        }

        User user = modelMapper.map(request, User.class);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        return generateAuthResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác");
        }

        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa");
        }

        return generateAuthResponse(user);
    }

    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        
        RefreshToken refreshToken = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token không hợp lệ hoặc đã bị xóa"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token đã hết hạn, vui lòng đăng nhập lại");
        }

        User user = refreshToken.getUser();
        
        // Refresh token rotation: delete old, issue new
        refreshTokenRepository.delete(refreshToken);

        Map<String, Object> claims = Map.of("role", "USER");
        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getId().toString(), claims);
        String newRefreshTokenStr = jwtTokenProvider.generateRefreshToken(user.getId().toString());

        saveRefreshToken(user, newRefreshTokenStr);

        return new TokenRefreshResponse(newAccessToken, newRefreshTokenStr);
    }

    public void logout(LogoutRequest request) {
        refreshTokenRepository.deleteByToken(request.getRefreshToken());
    }

    private AuthResponse generateAuthResponse(User user) {
        Map<String, Object> claims = Map.of("role", "USER");
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId().toString(), claims);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId().toString());

        saveRefreshToken(user, refreshToken);

        AuthResponse response = modelMapper.map(user, AuthResponse.class);
        response.setUserId(user.getId());
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);

        return response;
    }

    private void saveRefreshToken(User user, String token) {
        Date expirationDate = jwtTokenProvider.getExpirationDateFromToken(token);
        LocalDateTime expiresAt = LocalDateTime.ofInstant(expirationDate.toInstant(), ZoneId.systemDefault());

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(expiresAt)
                .build();
        refreshTokenRepository.save(refreshToken);
    }
}
