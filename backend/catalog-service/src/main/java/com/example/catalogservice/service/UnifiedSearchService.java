package com.example.catalogservice.service;

import com.example.catalogservice.client.ArtistInternalResponse;
import com.example.catalogservice.client.ArtistServiceClient;
import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.dto.response.TopResultResponse;
import com.example.catalogservice.model.dto.response.UnifiedSearchResponse;
import com.example.catalogservice.repository.AlbumRepository;
import com.example.catalogservice.repository.SongRepository;
import feign.FeignException;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý Unified Search — tổng hợp kết quả tìm kiếm từ Catalog Service (bài hát,
 * album) và Artists Service (nghệ sĩ), sau đó áp dụng {@link RelevanceScorer} để xác định
 * kết quả hàng đầu phù hợp nhất với từ khóa.
 *
 * <p>Luồng xử lý:</p>
 * <ol>
 *   <li>Truy vấn song song (sequential trong thread hiện tại) Songs và Albums từ Catalog DB.</li>
 *   <li>Gọi Feign Client sang Artists Service để lấy danh sách nghệ sĩ (nội bộ, bảo mật bằng header).</li>
 *   <li>Chấm điểm top-1 của mỗi danh mục và chọn ra {@code topResult}.</li>
 *   <li>Sắp xếp từng danh sách theo điểm giảm dần trước khi trả về.</li>
 * </ol>
 */
@Service
public class UnifiedSearchService {

    private static final Logger log = LoggerFactory.getLogger(UnifiedSearchService.class);

    private final SongRepository songRepository;
    private final AlbumRepository albumRepository;
    private final ArtistServiceClient artistServiceClient;
    private final ModelMapper modelMapper;

    public UnifiedSearchService(SongRepository songRepository,
                                AlbumRepository albumRepository,
                                ArtistServiceClient artistServiceClient,
                                ModelMapper modelMapper) {
        this.songRepository       = songRepository;
        this.albumRepository      = albumRepository;
        this.artistServiceClient  = artistServiceClient;
        this.modelMapper          = modelMapper;
    }

    /**
     * Thực hiện tìm kiếm thống nhất (Unified Search).
     *
     * @param keyword từ khóa tìm kiếm (bắt buộc, không được rỗng)
     * @param limit   số lượng kết quả tối đa trả về cho mỗi danh mục (songs, albums, artists)
     * @return {@link UnifiedSearchResponse} chứa topResult, songs, albums và artists
     */
    @Transactional(readOnly = true)
    public UnifiedSearchResponse search(String keyword, int limit) {

        String cleanKeyword = (keyword != null) ? keyword.trim() : "";

        // ── 1. Truy vấn bài hát ────────────────────────────────────────────────
        // Lấy nhiều hơn limit một chút để scorer có đủ dữ liệu chọn top nhưng
        // vẫn giới hạn kết quả; mặc định sort theo playCount DESC để ưu tiên phổ biến.
        Pageable songPageable  = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "playCount"));
        Pageable albumPageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "likeCount"));

        List<SongResponse> songs = songRepository
                .findPublicSongs(cleanKeyword, null, songPageable)
                .stream()
                .map(s -> modelMapper.map(s, SongResponse.class))
                .collect(Collectors.toList());

        // ── 2. Truy vấn album ──────────────────────────────────────────────────
        List<AlbumResponse> albums = albumRepository
                .findPublicAlbums(cleanKeyword, albumPageable)
                .stream()
                .map(a -> modelMapper.map(a, AlbumResponse.class))
                .collect(Collectors.toList());

        // ── 3. Gọi Artists Service (nội bộ, có thể thất bại mềm) ──────────────
        List<ArtistInternalResponse> artists = fetchArtistsSafely(cleanKeyword, limit);

        // ── 4. Sắp xếp từng danh sách theo điểm liên quan giảm dần ───────────
        songs.sort(Comparator.comparingDouble(
                (SongResponse s) -> RelevanceScorer.scoreSong(s, cleanKeyword)).reversed());
        albums.sort(Comparator.comparingDouble(
                (AlbumResponse a) -> RelevanceScorer.scoreAlbum(a, cleanKeyword)).reversed());
        artists.sort(Comparator.comparingDouble(
                (ArtistInternalResponse a) -> RelevanceScorer.scoreArtist(a, cleanKeyword)).reversed());

        // ── 5. Chọn Top Result ─────────────────────────────────────────────────
        SongResponse           topSong   = songs.isEmpty()   ? null : songs.get(0);
        AlbumResponse          topAlbum  = albums.isEmpty()  ? null : albums.get(0);
        ArtistInternalResponse topArtist = artists.isEmpty() ? null : artists.get(0);

        TopResultResponse topResult = RelevanceScorer.selectTopResult(topSong, topAlbum, topArtist, cleanKeyword);

        return UnifiedSearchResponse.builder()
                .topResult(topResult)
                .songs(songs)
                .albums(albums)
                .artists(artists)
                .build();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Internal helpers
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Gọi Artists Service để tìm kiếm nghệ sĩ.
     * Sử dụng "fail-soft" pattern: nếu Artists Service không phản hồi (timeout, down,
     * lỗi mạng nội bộ), log cảnh báo và trả về danh sách rỗng thay vì ném lỗi ra ngoài.
     * Điều này đảm bảo Unified Search vẫn trả về kết quả songs và albums dù artist service lỗi.
     *
     * @param keyword từ khóa tìm kiếm
     * @param limit   số lượng tối đa cần lấy
     * @return danh sách nghệ sĩ (có thể rỗng nếu service gặp sự cố)
     */
    private List<ArtistInternalResponse> fetchArtistsSafely(String keyword, int limit) {
        if (keyword.isBlank()) {
            return Collections.emptyList();
        }
        try {
            List<ArtistInternalResponse> result = artistServiceClient.searchArtists(keyword, limit);
            return result != null ? result : Collections.emptyList();
        } catch (FeignException e) {
            log.warn("[UnifiedSearch] Artists Service trả về lỗi khi tìm kiếm keyword='{}': {} - {}",
                    keyword, e.status(), e.getMessage());
            return Collections.emptyList();
        } catch (Exception e) {
            log.warn("[UnifiedSearch] Không thể kết nối tới Artists Service khi tìm kiếm keyword='{}': {}",
                    keyword, e.getMessage());
            return Collections.emptyList();
        }
    }
}
