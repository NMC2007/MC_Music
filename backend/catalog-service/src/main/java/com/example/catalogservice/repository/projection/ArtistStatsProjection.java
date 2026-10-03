package com.example.catalogservice.repository.projection;

public interface ArtistStatsProjection {
    Long getTotalSongs();
    Long getTotalPlays();
    Long getTotalLikes();
}
