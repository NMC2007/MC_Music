package com.example.catalogservice.service;

import com.example.catalogservice.client.ArtistInternalResponse;
import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.dto.response.TopResultResponse;

import java.util.List;

/**
 * Thuật toán chấm điểm độ liên quan (Relevance Scoring) cho Unified Search.
 *
 * <p>Công thức điểm cơ bản:</p>
 * <ul>
 *   <li>Khớp 100% tên chính (exact match, không phân biệt hoa thường): +100 điểm</li>
 *   <li>Tên bắt đầu bằng từ khóa (prefix match): +75 điểm</li>
 *   <li>Tên chứa từ khóa (substring match - trường chính): +50 điểm</li>
 *   <li>Trường phụ chứa từ khóa (VD: tên nghệ sĩ phụ của bài hát): +30 điểm</li>
 * </ul>
 *
 * <p>Hệ số nhân loại thực thể (Entity Type Multiplier):</p>
 * <ul>
 *   <li>ARTIST: x1.3 — Ưu tiên nghệ sĩ vì thường là điều người dùng tìm kiếm nhất</li>
 *   <li>SONG:   x1.1 — Ưu tiên bài hát thứ hai</li>
 *   <li>ALBUM:  x1.0 — Album được xử lý với trọng số cơ bản</li>
 * </ul>
 *
 * <p>Điểm thưởng phổ biến (Popularity Bonus) — tối đa +20 điểm:</p>
 * <ul>
 *   <li>ARTIST: log10(followerCount + 1) * 5, tối đa 20</li>
 *   <li>SONG:   log10(playCount + 1) * 4, tối đa 20</li>
 *   <li>ALBUM:  log10(likeCount + 1) * 4, tối đa 20</li>
 * </ul>
 */
public class RelevanceScorer {

    // ─── Điểm cơ bản ──────────────────────────────────────────────────────────
    private static final double SCORE_EXACT_MATCH   = 100.0;
    private static final double SCORE_PREFIX_MATCH  = 75.0;
    private static final double SCORE_MAIN_CONTAIN  = 50.0;
    private static final double SCORE_SEC_CONTAIN   = 30.0;
    private static final double MAX_POPULARITY_BONUS = 20.0;

    // ─── Hệ số nhân loại thực thể ─────────────────────────────────────────────
    private static final double MULTIPLIER_ARTIST = 1.3;
    private static final double MULTIPLIER_SONG   = 1.1;
    private static final double MULTIPLIER_ALBUM  = 1.0;

    private RelevanceScorer() {
        // Utility class — không khởi tạo
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Public API
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Tính điểm cho một Artist.
     *
     * @param artist  dữ liệu nghệ sĩ
     * @param keyword từ khóa tìm kiếm (đã trim, không null)
     * @return điểm độ liên quan (càng cao càng phù hợp)
     */
    public static double scoreArtist(ArtistInternalResponse artist, String keyword) {
        double baseScore = matchPrimaryField(artist.getStageName(), keyword);
        double popularityBonus = popularityBonus(
                artist.getFollowerCount() != null ? artist.getFollowerCount().doubleValue() : 0.0,
                5.0
        );
        return (baseScore + popularityBonus) * MULTIPLIER_ARTIST;
    }

    /**
     * Tính điểm cho một Song.
     *
     * @param song    dữ liệu bài hát
     * @param keyword từ khóa tìm kiếm
     * @return điểm độ liên quan
     */
    public static double scoreSong(SongResponse song, String keyword) {
        double baseScore = matchPrimaryField(song.getTitle(), keyword);

        // Tên nghệ sĩ chính (ownerName) là trường phụ nếu chưa khớp trường chính
        if (baseScore < SCORE_MAIN_CONTAIN) {
            double ownerScore = matchPrimaryField(song.getOwnerName(), keyword);
            if (ownerScore > SCORE_SEC_CONTAIN) {
                baseScore = Math.max(baseScore, SCORE_SEC_CONTAIN);
            }
        }

        // Tên nghệ sĩ hợp tác/feat (secondary field)
        if (song.getArtists() != null) {
            boolean featMatch = song.getArtists().stream()
                    .anyMatch(a -> containsIgnoreCase(a.getArtistName(), keyword));
            if (featMatch && baseScore < SCORE_SEC_CONTAIN) {
                baseScore = Math.max(baseScore, SCORE_SEC_CONTAIN);
            }
        }

        double popularityBonus = popularityBonus(
                song.getPlayCount() != null ? song.getPlayCount().doubleValue() : 0.0,
                4.0
        );
        return (baseScore + popularityBonus) * MULTIPLIER_SONG;
    }

    /**
     * Tính điểm cho một Album.
     *
     * @param album   dữ liệu album
     * @param keyword từ khóa tìm kiếm
     * @return điểm độ liên quan
     */
    public static double scoreAlbum(AlbumResponse album, String keyword) {
        double baseScore = matchPrimaryField(album.getTitle(), keyword);

        // ownerName là trường phụ
        if (baseScore < SCORE_MAIN_CONTAIN) {
            double ownerScore = matchPrimaryField(album.getOwnerName(), keyword);
            if (ownerScore > SCORE_SEC_CONTAIN) {
                baseScore = Math.max(baseScore, SCORE_SEC_CONTAIN);
            }
        }

        double popularityBonus = popularityBonus(
                album.getLikeCount() != null ? album.getLikeCount().doubleValue() : 0.0,
                4.0
        );
        return (baseScore + popularityBonus) * MULTIPLIER_ALBUM;
    }

    /**
     * Chọn {@link TopResultResponse} từ top-1 của mỗi danh mục dựa trên điểm cao nhất.
     *
     * @param topSong   bài hát điểm cao nhất (hoặc null nếu không có kết quả)
     * @param topAlbum  album điểm cao nhất (hoặc null)
     * @param topArtist nghệ sĩ điểm cao nhất (hoặc null)
     * @param keyword   từ khóa gốc
     * @return TopResultResponse được chọn, hoặc null nếu không có kết quả nào
     */
    public static TopResultResponse selectTopResult(
            SongResponse topSong,
            AlbumResponse topAlbum,
            ArtistInternalResponse topArtist,
            String keyword) {

        if (keyword == null || keyword.isBlank()) {
            return null;
        }

        TopResultResponse best = null;
        double bestScore = -1.0;

        if (topArtist != null) {
            double s = scoreArtist(topArtist, keyword);
            if (s > bestScore) {
                bestScore = s;
                best = TopResultResponse.builder()
                        .type("ARTIST")
                        .item(topArtist)
                        .score(s)
                        .build();
            }
        }

        if (topSong != null) {
            double s = scoreSong(topSong, keyword);
            if (s > bestScore) {
                bestScore = s;
                best = TopResultResponse.builder()
                        .type("SONG")
                        .item(topSong)
                        .score(s)
                        .build();
            }
        }

        if (topAlbum != null) {
            double s = scoreAlbum(topAlbum, keyword);
            if (s > bestScore) {
                best = TopResultResponse.builder()
                        .type("ALBUM")
                        .item(topAlbum)
                        .score(s)
                        .build();
            }
        }

        return best;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Internal helpers
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Tính điểm khớp của một trường chính so với từ khóa.
     * Thứ tự ưu tiên: exact > prefix > substring > 0.
     */
    private static double matchPrimaryField(String fieldValue, String keyword) {
        if (fieldValue == null || fieldValue.isBlank()) {
            return 0.0;
        }
        String field = fieldValue.toLowerCase();
        String kw    = keyword.toLowerCase();

        if (field.equals(kw)) {
            return SCORE_EXACT_MATCH;
        } else if (field.startsWith(kw)) {
            return SCORE_PREFIX_MATCH;
        } else if (field.contains(kw)) {
            return SCORE_MAIN_CONTAIN;
        }
        return 0.0;
    }

    /**
     * Điểm thưởng phổ biến theo logarithm, giới hạn tại MAX_POPULARITY_BONUS.
     *
     * @param count  số lượt tương tác (lượt nghe, theo dõi...)
     * @param factor hệ số nhân log (điều chỉnh tầm ảnh hưởng)
     * @return điểm thưởng [0, MAX_POPULARITY_BONUS]
     */
    private static double popularityBonus(double count, double factor) {
        if (count <= 0) return 0.0;
        return Math.min(Math.log10(count + 1) * factor, MAX_POPULARITY_BONUS);
    }

    /** Kiểm tra chuỗi có chứa keyword không phân biệt hoa thường. */
    private static boolean containsIgnoreCase(String text, String keyword) {
        if (text == null) return false;
        return text.toLowerCase().contains(keyword.toLowerCase());
    }
}
