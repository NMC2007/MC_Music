package com.example.adminservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;
import java.util.UUID;

@FeignClient(name = "users-service", url = "${users.service.url:http://localhost:8082}")
public interface UserServiceClient {

    @GetMapping("/api/internal/users")
    Map<String, Object> getAllUsers(
            @RequestParam("page") int page,
            @RequestParam("size") int size,
            @RequestParam(value = "sort", required = false) String sort);

    @GetMapping("/api/internal/users/{id}")
    Map<String, Object> getUserById(@PathVariable("id") UUID id);
}
