package com.example.usersservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class InternalApiFilter extends OncePerRequestFilter {

    @Value("${internal.api.secret}")
    private String internalApiSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        
        if (path.startsWith("/api/internal/")) {
            String requestSecret = request.getHeader("X-Internal-Secret");
            if (requestSecret == null || !requestSecret.equals(internalApiSecret)) {
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"success\":false,\"statusCode\":403,\"message\":\"Truy cập bị từ chối: Thiếu hoặc sai Internal API Key (Security Level)\"}");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
