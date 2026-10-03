package com.example.artistsservice.security;

import com.mcmusic.sharedauth.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration}")
    private long jwtAccessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private long jwtRefreshTokenExpiration;

    @Bean
    public JwtTokenProvider jwtTokenProvider() {
        return new JwtTokenProvider(
                jwtSecret, 
                jwtAccessTokenExpiration, 
                jwtRefreshTokenExpiration, 
                "artist-service"
        );
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Autowired
    @Qualifier("handlerExceptionResolver")
    private org.springframework.web.servlet.HandlerExceptionResolver exceptionResolver;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, 
            com.example.artistsservice.security.jwt.JwtAuthenticationFilter jwtAuthenticationFilter,
            com.example.artistsservice.security.InternalApiFilter internalApiFilter) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/artist/auth/**", "/api/artist/public/**", "/api/internal/**", "/error").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> 
                    exceptionResolver.resolveException(request, response, null, authException)
                )
                .accessDeniedHandler((request, response, accessDeniedException) -> 
                    exceptionResolver.resolveException(request, response, null, accessDeniedException)
                )
            )
            .addFilterBefore(internalApiFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
