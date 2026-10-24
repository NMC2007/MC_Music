package com.example.catalogservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.catalogservice.config.FeignConfig;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "artists-service", url = "${artists.service.url}", configuration = FeignConfig.class)
public interface ArtistServiceClient {

    @GetMapping("/api/internal/artists/{artistId}")
    ArtistInternalResponse getArtistById(@PathVariable("artistId") UUID artistId);

    /**
     * Tìm kiếm nghệ sĩ theo từ khóa (internal call - được bảo mật bằng X-Internal-Secret header qua FeignConfig).
     *
     * @param keyword từ khóa tìm kiếm (theo stageName)
     * @param limit   số lượng kết quả tối đa cần trả về
     * @return danh sách nghệ sĩ khớp từ khóa
     */
    @GetMapping("/api/internal/artists/search")
    List<ArtistInternalResponse> searchArtists(
            @RequestParam("keyword") String keyword,
            @RequestParam("limit") int limit);
}
