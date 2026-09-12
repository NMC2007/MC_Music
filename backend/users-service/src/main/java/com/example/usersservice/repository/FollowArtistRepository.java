package com.example.usersservice.repository;

import com.example.usersservice.model.entity.FollowArtist;
import com.example.usersservice.model.entity.FollowArtistId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FollowArtistRepository extends JpaRepository<FollowArtist, FollowArtistId> {
    List<FollowArtist> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
