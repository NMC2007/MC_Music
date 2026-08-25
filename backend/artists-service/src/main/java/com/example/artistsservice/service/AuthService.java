package com.example.artistsservice.service;

import com.example.artistsservice.model.dto.request.*;
import com.example.artistsservice.model.dto.response.*;
import com.example.artistsservice.model.entity.RefreshToken;
import com.example.artistsservice.model.entity.Artist;
import com.example.artistsservice.repository.RefreshTokenRepository;
import com.example.artistsservice.repository.ArtistRepository;
import com.mcmusic.sharedauth.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import com.example.artistsservice.exception.ApiException;
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

    private final ArtistRepository artistRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final ModelMapper modelMapper;

    public AuthResponse register(RegisterRequest request) {
        if (artistRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email đã tồn tại trong hệ thống");
        }

        Artist artist = modelMapper.map(request, Artist.class);
        artist.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        Artist savedArtist = artistRepository.save(artist);

        return generateAuthResponse(savedArtist);
    }

    public AuthResponse login(LoginRequest request) {
        Artist artist = artistRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), artist.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác");
        }

        if (artist.getIsActive() != null && !artist.getIsActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị khóa");
        }

        return generateAuthResponse(artist);
    }

    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        
        RefreshToken refreshToken = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token không hợp lệ hoặc đã bị xóa"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token đã hết hạn, vui lòng đăng nhập lại");
        }

        Artist artist = refreshToken.getArtist();
        
        // Refresh token rotation: delete old, issue new
        refreshTokenRepository.delete(refreshToken);

        Map<String, Object> claims = Map.of("role", "ARTIST");
        String newAccessToken = jwtTokenProvider.generateAccessToken(artist.getId().toString(), claims);
        String newRefreshTokenStr = jwtTokenProvider.generateRefreshToken(artist.getId().toString());

        saveRefreshToken(artist, newRefreshTokenStr);

        return new TokenRefreshResponse(newAccessToken, newRefreshTokenStr);
    }

    public void logout(LogoutRequest request) {
        refreshTokenRepository.deleteByToken(request.getRefreshToken());
    }

    private AuthResponse generateAuthResponse(Artist artist) {
        Map<String, Object> claims = Map.of("role", "ARTIST");
        String accessToken = jwtTokenProvider.generateAccessToken(artist.getId().toString(), claims);
        String refreshToken = jwtTokenProvider.generateRefreshToken(artist.getId().toString());

        saveRefreshToken(artist, refreshToken);

        AuthResponse response = modelMapper.map(artist, AuthResponse.class);
        response.setArtistId(artist.getId());
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);

        return response;
    }

    private void saveRefreshToken(Artist artist, String token) {
        Date expirationDate = jwtTokenProvider.getExpirationDateFromToken(token);
        LocalDateTime expiresAt = LocalDateTime.ofInstant(expirationDate.toInstant(), ZoneId.systemDefault());

        RefreshToken refreshToken = RefreshToken.builder()
                .artist(artist)
                .token(token)
                .expiresAt(expiresAt)
                .build();
        refreshTokenRepository.save(refreshToken);
    }
}
