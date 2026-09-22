package com.example.artistsservice.controller;

import com.example.artistsservice.model.dto.response.ApiResponse;
import com.example.artistsservice.model.dto.response.ArtistPublicResponse;
import com.example.artistsservice.model.entity.Artist;
import com.example.artistsservice.repository.ArtistRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/artist/public")
public class PublicArtistController {

    // Whitelist các field được phép sort để tránh SQL Injection qua tên field
    private static final Set<String> ARTIST_SORTABLE_FIELDS = Set.of(
            "followerCount", "createdAt", "stageName"
    );

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private ModelMapper modelMapper;

    /**
     * Tạo Sort an toàn từ tham số sort của client.
     * Định dạng: "field,direction" (VD: "followerCount,desc") hoặc "field" (mặc định DESC).
     * Nếu field không nằm trong whitelist, trả về sort mặc định theo createdAt DESC.
     */
    private Sort buildSafeSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sortParam.split(",");
        String field = parts[0].trim();
        Sort.Direction direction = Sort.Direction.DESC;
        if (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc")) {
            direction = Sort.Direction.ASC;
        }
        if (!ARTIST_SORTABLE_FIELDS.contains(field)) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return Sort.by(direction, field);
    }

    @GetMapping("/artists")
    public ResponseEntity<ApiResponse<Page<ArtistPublicResponse>>> getActiveArtists(
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Sort resolvedSort = buildSafeSort(sort);
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        Page<Artist> activeArtists = artistRepository.findByIsActiveTrue(pageable);

        Page<ArtistPublicResponse> responseData = activeArtists
            .map(artist -> modelMapper.map(artist, ArtistPublicResponse.class));

        return ResponseEntity.ok(ApiResponse.success(responseData, "Lấy danh sách nghệ sĩ thành công"));
    }
}
