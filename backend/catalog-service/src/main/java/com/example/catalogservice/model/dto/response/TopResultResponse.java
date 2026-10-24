package com.example.catalogservice.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO đại diện cho kết quả hàng đầu nổi bật nhất trong Unified Search.
 * Field {@code type} xác định loại thực thể ({@code ARTIST}, {@code SONG}, {@code ALBUM}).
 * Field {@code item} chứa dữ liệu DTO tương ứng (ArtistInternalResponse, SongResponse, hoặc AlbumResponse).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopResultResponse {

    /**
     * Loại thực thể của kết quả hàng đầu.
     * Giá trị có thể là: "ARTIST", "SONG", "ALBUM".
     */
    private String type;

    /**
     * Đối tượng DTO chứa dữ liệu thực thể.
     * Kiểu thực tế tương ứng với {@code type}:
     * - ARTIST -> ArtistInternalResponse
     * - SONG   -> SongResponse
     * - ALBUM  -> AlbumResponse
     */
    private Object item;

    /**
     * Điểm độ liên quan đã tính (dùng nội bộ để debug/logging, không bắt buộc trả về FE).
     */
    private double score;
}
