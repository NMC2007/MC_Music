package com.example.usersservice.model.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowArtistId implements Serializable {
    private UUID userId;
    private UUID artistId;
}
