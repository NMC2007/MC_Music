package com.example.artistsservice.model.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "artists")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Artist {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    private String email;
    private String passwordHash;
    private String stageName;
    private String biography;
    private String avatarUrl;
    private String coverUrl;
    
    @Builder.Default
    private Boolean isActive = true;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
