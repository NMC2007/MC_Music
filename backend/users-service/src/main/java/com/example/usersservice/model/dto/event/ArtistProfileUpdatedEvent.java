package com.example.usersservice.model.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArtistProfileUpdatedEvent {
    private String artistId;
    private String oldName;
    private String newName;
    private String newAvatarUrl;
}
