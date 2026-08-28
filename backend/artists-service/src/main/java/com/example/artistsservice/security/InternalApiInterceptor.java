package com.example.artistsservice.security;

import com.example.artistsservice.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class InternalApiInterceptor implements HandlerInterceptor {

    @Value("${internal.api.secret}")
    private String internalApiSecret;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestSecret = request.getHeader("X-Internal-Secret");
        
        if (requestSecret == null || !requestSecret.equals(internalApiSecret)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Truy cập bị từ chối: Thiếu hoặc sai Internal API Key");
        }
        
        return true;
    }
}
