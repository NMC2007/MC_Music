package com.example.catalogservice.model.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class AlbumSongReorderRequest {

    @NotEmpty(message = "Danh sách thứ tự không được để trống")
    private List<SongOrder> songOrders;

    @Data
    public static class SongOrder {
        @NotNull(message = "songId không được để trống")
        private UUID songId;
        
        @NotNull(message = "trackNumber không được để trống")
        private Integer trackNumber;
    }
}
