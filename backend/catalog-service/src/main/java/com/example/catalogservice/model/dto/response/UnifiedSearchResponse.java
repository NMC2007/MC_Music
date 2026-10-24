package com.example.catalogservice.model.dto.response;

import com.example.catalogservice.client.ArtistInternalResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO phản hồi của Unified Search API.
 * Tổng hợp kết quả tìm kiếm từ cả Catalog Service (bài hát, album)
 * và Artists Service (nghệ sĩ), đồng thời xác định kết quả hàng đầu nổi bật nhất.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnifiedSearchResponse {

    /**
     * Kết quả hàng đầu được đề xuất dựa trên thuật toán Relevance Scoring.
     * Có thể là null nếu không tìm thấy kết quả nào.
     */
    private TopResultResponse topResult;

    /**
     * Danh sách bài hát phù hợp với từ khóa (tối đa {@code limit} kết quả).
     */
    private List<SongResponse> songs;

    /**
     * Danh sách album phù hợp với từ khóa (tối đa {@code limit} kết quả).
     */
    private List<AlbumResponse> albums;

    /**
     * Danh sách nghệ sĩ phù hợp với từ khóa (tối đa {@code limit} kết quả).
     */
    private List<ArtistInternalResponse> artists;
}
