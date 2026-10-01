package com.example.usersservice.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class InternalApiInterceptor implements HandlerInterceptor {

    @Value("${internal.api.secret}")
    private String internalApiSecret;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String requestSecret = request.getHeader("X-Internal-Secret");
        
        if (requestSecret == null || !requestSecret.equals(internalApiSecret)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"statusCode\":403,\"message\":\"Truy cập bị từ chối: Thiếu hoặc sai Internal API Key\"}");
            return false;
        }
        
        return true;
    }
}
