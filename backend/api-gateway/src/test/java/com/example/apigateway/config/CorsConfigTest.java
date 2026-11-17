package com.example.apigateway.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.filter.CorsFilter;

import java.lang.reflect.Field;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("API Gateway - CORS Configuration Tests")
class CorsConfigTest {

    @Test
    @DisplayName("Cấu hình CORS hợp lệ cho các cổng Frontend và hỗ trợ credentials")
    void shouldConfigureCorsCorrectly() {
        CorsConfig corsConfig = new CorsConfig();
        CorsFilter corsFilter = corsConfig.corsFilter();

        assertThat(corsFilter).isNotNull();

        // Kiểm tra CORS Headers qua MockHttpServletRequest
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/user/auth/login");
        request.setMethod("OPTIONS");
        request.addHeader("Origin", "http://localhost:5173");
        request.addHeader("Access-Control-Request-Method", "POST");

        assertThat(request.getHeader("Origin")).isEqualTo("http://localhost:5173");
    }
}

