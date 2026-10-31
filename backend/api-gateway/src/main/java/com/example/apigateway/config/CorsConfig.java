package com.example.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.Collections;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Explicitly allow 3 frontend origins (Admin: 5171, Artists: 5172, Users: 5173) and pattern matching
        config.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:5171",
            "http://localhost:5172",
            "http://localhost:5173",
            "http://127.0.0.1:5171",
            "http://127.0.0.1:5172",
            "http://127.0.0.1:5173",
            "*"
        ));
        
        // Allow all headers
        config.setAllowedHeaders(Arrays.asList("Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"));
        
        // Allow exposed headers
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Disposition"));
        
        // Allow all standard HTTP methods
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Allow credentials (e.g. cookies, authorization headers)
        config.setAllowCredentials(true);
        
        // Apply this configuration to all paths
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}
