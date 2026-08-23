package com.example.usersservice.service;

import com.example.usersservice.model.dto.AuthResponse;
import com.example.usersservice.model.dto.LoginRequest;
import com.example.usersservice.model.dto.RegisterRequest;
import com.example.usersservice.model.entity.User;
import com.example.usersservice.repository.UserRepository;
import com.mcmusic.sharedauth.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import com.example.usersservice.exception.ApiException;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
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

    private AuthResponse generateAuthResponse(User user) {
        Map<String, Object> claims = Map.of("role", "USER");
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId().toString(), claims);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId().toString());

        AuthResponse response = modelMapper.map(user, AuthResponse.class);
        response.setUserId(user.getId());
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);

        return response;
    }
}
