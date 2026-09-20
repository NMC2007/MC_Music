package com.example.artistsservice.controller;

import com.example.artistsservice.model.dto.response.ApiResponse;
import com.example.artistsservice.model.dto.response.ArtistPublicResponse;
import com.example.artistsservice.model.entity.Artist;
import com.example.artistsservice.repository.ArtistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/artist/public")
public class PublicArtistController {

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private org.modelmapper.ModelMapper modelMapper;

    @GetMapping("/artists")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<ArtistPublicResponse>>> getActiveArtists(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size) {
            
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<Artist> activeArtists = artistRepository.findByIsActiveTrue(pageable);
        
        org.springframework.data.domain.Page<ArtistPublicResponse> responseData = activeArtists
            .map(artist -> modelMapper.map(artist, ArtistPublicResponse.class));

        return ResponseEntity.ok(ApiResponse.success(responseData, "Lấy danh sách nghệ sĩ thành công"));
    }
}
