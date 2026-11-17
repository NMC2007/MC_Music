package com.example.catalogservice.service;

import com.example.catalogservice.client.ArtistInternalResponse;
import com.example.catalogservice.model.dto.response.AlbumResponse;
import com.example.catalogservice.model.dto.response.SongResponse;
import com.example.catalogservice.model.dto.response.TopResultResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Catalog Service - RelevanceScorer Unit Tests")
class RelevanceScorerTest {

    @Test
    @DisplayName("Khớp chính xác (Exact match) tên nghệ sĩ đạt điểm cao nhất")
    void shouldScoreExactMatchArtistHighest() {
        ArtistInternalResponse artist = new ArtistInternalResponse();
        artist.setId(UUID.randomUUID());
        artist.setStageName("Sơn Tùng M-TP");
        artist.setFollowerCount(1_000_000);

        double score = RelevanceScorer.scoreArtist(artist, "Sơn Tùng M-TP");

        // (100 base + 20 bonus) * 1.3 = 156.0
        assertThat(score).isGreaterThan(150.0);
    }

    @Test
    @DisplayName("Khớp tiền tố (Prefix match) và một phần (Substring) tính đúng tỷ lệ")
    void shouldScorePrefixAndSubstringMatchesAccurately() {
        SongResponse songPrefix = new SongResponse();
        songPrefix.setTitle("Chúng Ta Của Hiện Tại");
        songPrefix.setPlayCount(500_000);

        SongResponse songSubstring = new SongResponse();
        songSubstring.setTitle("Nơi Nào Có Chúng Ta");
        songSubstring.setPlayCount(500_000);

        double prefixScore = RelevanceScorer.scoreSong(songPrefix, "Chúng Ta");
        double substringScore = RelevanceScorer.scoreSong(songSubstring, "Chúng Ta");

        assertThat(prefixScore).isGreaterThan(substringScore);
    }

    @Test
    @DisplayName("Lựa chọn Top Result chính xác khi nghệ sĩ khớp tuyệt đối")
    void shouldSelectArtistAsTopResultWhenExactMatch() {
        ArtistInternalResponse artist = new ArtistInternalResponse();
        artist.setStageName("Đen Vâu");
        artist.setFollowerCount(2_000_000);

        SongResponse song = new SongResponse();
        song.setTitle("Trốn Tìm (ft. MTV)");
        song.setOwnerName("Đen Vâu");
        song.setPlayCount(10_000_000);

        AlbumResponse album = new AlbumResponse();
        album.setTitle("Mười Năm");
        album.setOwnerName("Đen Vâu");
        album.setLikeCount(50_000);

        TopResultResponse topResult = RelevanceScorer.selectTopResult(song, album, artist, "Đen Vâu");

        assertThat(topResult).isNotNull();
        assertThat(topResult.getType()).isEqualTo("ARTIST");
    }

    @Test
    @DisplayName("Trả về null khi từ khóa tìm kiếm rỗng")
    void shouldReturnNullWhenKeywordIsBlank() {
        TopResultResponse topResult = RelevanceScorer.selectTopResult(null, null, null, "   ");
        assertThat(topResult).isNull();
    }
}

