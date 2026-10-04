package com.example.usersservice.repository;

import com.example.usersservice.model.entity.Favorite;
import com.example.usersservice.model.entity.FavoriteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, FavoriteId> {
    Page<Favorite> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
