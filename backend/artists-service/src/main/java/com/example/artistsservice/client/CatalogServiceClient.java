package com.example.artistsservice.client;

import com.example.artistsservice.model.dto.response.ArtistDashboardResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;
import java.util.Map;

@Component
public class CatalogServiceClient {

    private final RestTemplate restTemplate;
    private final String catalogServiceUrl;
    private final String internalSecret;

    public CatalogServiceClient(
            @Value("${internal.api.secret}") String internalSecret,
            @Value("${services.catalog-service.url:http://localhost:8081}") String catalogServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.internalSecret = internalSecret;
        this.catalogServiceUrl = catalogServiceUrl;
    }

    public ArtistDashboardResponse getArtistStats(UUID artistId) {
        String url = catalogServiceUrl + "/api/internal/catalog/artists/" + artistId + "/stats";
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Secret", internalSecret);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            Map<String, Object> body = response.getBody();
            if (body == null) return new ArtistDashboardResponse(0L, 0L, 0L, 0L);
            
            Long totalSongs = body.get("totalSongs") != null ? Long.valueOf(body.get("totalSongs").toString()) : 0L;
            Long totalPlays = body.get("totalPlays") != null ? Long.valueOf(body.get("totalPlays").toString()) : 0L;
            Long totalLikes = body.get("totalLikes") != null ? Long.valueOf(body.get("totalLikes").toString()) : 0L;
            
            return ArtistDashboardResponse.builder()
                    .totalSongs(totalSongs)
                    .totalPlays(totalPlays)
                    .totalLikes(totalLikes)
                    .build();
        } catch (Exception e) {
            return new ArtistDashboardResponse(0L, 0L, 0L, 0L);
        }
    }
}
