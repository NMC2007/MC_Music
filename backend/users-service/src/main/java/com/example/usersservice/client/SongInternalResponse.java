package com.example.usersservice.client;

import lombok.Data;
import java.util.UUID;

@Data
public class SongInternalResponse {
    private UUID id;
    private String title;
    private String ownerName;
    private String coverImage;
}
