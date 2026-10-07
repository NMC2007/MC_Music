package com.example.usersservice.repository;

import com.example.usersservice.model.entity.FollowArtist;
import com.example.usersservice.model.entity.FollowArtistId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

@Repository
public interface FollowArtistRepository extends JpaRepository<FollowArtist, FollowArtistId> {
    Page<FollowArtist> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE FollowArtist fa SET fa.artistName = :newName, fa.avatar = :newAvatar WHERE fa.artistId = :artistId")
    void updateArtistProfile(@org.springframework.data.repository.query.Param("artistId") UUID artistId, @org.springframework.data.repository.query.Param("newName") String newName, @org.springframework.data.repository.query.Param("newAvatar") String newAvatar);
}
