package com.example.catalogservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/catalog/test-security")
public class TestSecurityController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> testSecurity() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        response.put("principal", auth.getPrincipal());
        response.put("roles", auth.getAuthorities().stream().map(a -> a.getAuthority()).collect(Collectors.toList()));
        response.put("message", "Token verified successfully by MultiIssuerJwtFilter");
        
        return ResponseEntity.ok(response);
    }
}
