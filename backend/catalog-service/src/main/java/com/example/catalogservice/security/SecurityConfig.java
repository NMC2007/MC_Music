package com.example.catalogservice.security;

import com.mcmusic.sharedauth.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.servlet.HandlerExceptionResolver;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${jwt.secret.user}")
    private String userSecret;

    @Value("${jwt.secret.artist}")
    private String artistSecret;

    @Value("${jwt.secret.admin}")
    private String adminSecret;

    @Bean
    public JwtTokenProvider userJwtTokenProvider() {
        return new JwtTokenProvider(userSecret, 0, 0, "user-service");
    }

    @Bean
    public JwtTokenProvider artistJwtTokenProvider() {
        return new JwtTokenProvider(artistSecret, 0, 0, "artist-service");
    }

    @Bean
    public JwtTokenProvider adminJwtTokenProvider() {
        return new JwtTokenProvider(adminSecret, 0, 0, "admin-service");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, MultiIssuerJwtFilter multiIssuerJwtFilter) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/catalog/public/**").permitAll()
                .requestMatchers("/api/internal/catalog/**").permitAll()
                .requestMatchers("/api/catalog/test-cloudinary/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/catalog/test-security").authenticated()
                .requestMatchers("/api/catalog/artist/**").hasRole("ARTIST")
                .requestMatchers("/api/catalog/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    String json = String.format("{\"success\":false,\"statusCode\":401,\"message\":\"Xác thực thất bại, token không hợp lệ hoặc không được cung cấp\",\"data\":null,\"timestamp\":\"%s\"}", java.time.LocalDateTime.now().toString());
                    response.getWriter().write(json);
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    String json = String.format("{\"success\":false,\"statusCode\":403,\"message\":\"Không có quyền truy cập vào tài nguyên này\",\"data\":null,\"timestamp\":\"%s\"}", java.time.LocalDateTime.now().toString());
                    response.getWriter().write(json);
                })
            )
            .addFilterBefore(multiIssuerJwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
