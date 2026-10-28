package com.example.usersservice.model.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class FollowArtistResponse {
    private UUID artistId;
    private String artistName;
    private String avatarUrl;

    public String getAvatar() {
        return avatarUrl;
    }

    public void setAvatar(String avatar) {
        this.avatarUrl = avatar;
    }
}
