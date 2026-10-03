package com.example.artistsservice.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtistDashboardResponse {
    private Long totalFollowers;
    private Long totalSongs;
    private Long totalPlays;
    private Long totalLikes;
}
