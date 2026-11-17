package com.mcmusic.sharedauth;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JwtTokenProvider Unit Tests")
class JwtTokenProviderTest {

    private static final String VALID_SECRET = "superSecretKeyForTestAtLeast32CharactersLong2026!";
    private static final long ACCESS_EXPIRATION_MS = 60_000L; // 1 minute
    private static final long REFRESH_EXPIRATION_MS = 300_000L; // 5 minutes
    private static final String ISSUER = "mc-music-test";

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(VALID_SECRET, ACCESS_EXPIRATION_MS, REFRESH_EXPIRATION_MS, ISSUER);
    }

    @Test
    @DisplayName("Khởi tạo thất bại nếu Secret Key ngắn hơn 32 ký tự")
    void shouldThrowExceptionWhenSecretKeyIsTooShort() {
        String shortSecret = "too-short-secret-key";
        assertThatThrownBy(() -> new JwtTokenProvider(shortSecret, ACCESS_EXPIRATION_MS, REFRESH_EXPIRATION_MS, ISSUER))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least 32 characters long");
    }

    @Test
    @DisplayName("Khởi tạo thành công nếu Secret Key từ 32 ký tự trở lên")
    void shouldCreateProviderWhenSecretKeyIsValid() {
        JwtTokenProvider provider = new JwtTokenProvider(VALID_SECRET, ACCESS_EXPIRATION_MS, REFRESH_EXPIRATION_MS, ISSUER);
        assertThat(provider).isNotNull();
    }

    @Test
    @DisplayName("Sinh Access Token hợp lệ không có extra claims")
    void shouldGenerateValidAccessTokenWithoutExtraClaims() {
        String subject = "user@mcmusic.com";

        String token = jwtTokenProvider.generateAccessToken(subject, null);

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3); // Header, Payload, Signature
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getSubjectFromToken(token)).isEqualTo(subject);

        Claims claims = jwtTokenProvider.getClaimsFromToken(token);
        assertThat(claims.getIssuer()).isEqualTo(ISSUER);
        assertThat(claims.getSubject()).isEqualTo(subject);
    }

    @Test
    @DisplayName("Sinh Access Token kèm theo extra claims tùy biến (roles, userId)")
    void shouldGenerateAccessTokenWithExtraClaims() {
        String subject = "artist@mcmusic.com";
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", "11111111-2222-3333-4444-555555555555");
        extraClaims.put("role", "ROLE_ARTIST");
        extraClaims.put("stageName", "Sơn Tùng M-TP");

        String token = jwtTokenProvider.generateAccessToken(subject, extraClaims);

        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        Claims claims = jwtTokenProvider.getClaimsFromToken(token);
        assertThat(claims.getSubject()).isEqualTo(subject);
        assertThat(claims.get("userId", String.class)).isEqualTo("11111111-2222-3333-4444-555555555555");
        assertThat(claims.get("role", String.class)).isEqualTo("ROLE_ARTIST");
        assertThat(claims.get("stageName", String.class)).isEqualTo("Sơn Tùng M-TP");
    }

    @Test
    @DisplayName("Sinh Refresh Token hợp lệ với thời hạn cấu hình")
    void shouldGenerateValidRefreshToken() {
        String subject = "admin-session-id-999";

        String refreshToken = jwtTokenProvider.generateRefreshToken(subject);

        assertThat(refreshToken).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(refreshToken)).isTrue();
        assertThat(jwtTokenProvider.getSubjectFromToken(refreshToken)).isEqualTo(subject);

        Date expiration = jwtTokenProvider.getExpirationDateFromToken(refreshToken);
        assertThat(expiration).isAfter(new Date());
    }

    @Test
    @DisplayName("Từ chối Token bị định dạng sai (Malformed Token)")
    void shouldReturnFalseWhenTokenIsMalformed() {
        assertThat(jwtTokenProvider.validateToken("not-a-valid-jwt")).isFalse();
        assertThat(jwtTokenProvider.validateToken("header.payload")).isFalse();
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
        assertThat(jwtTokenProvider.validateToken(null)).isFalse();
    }

    @Test
    @DisplayName("Từ chối Token bị chỉnh sửa nội dung payload (Tampered Token)")
    void shouldReturnFalseWhenTokenIsTampered() {
        String originalToken = jwtTokenProvider.generateAccessToken("victim@mcmusic.com", null);
        String[] parts = originalToken.split("\\.");

        // Giả lập hacker sửa payload
        String tamperedPayload = parts[1] + "tamper";
        String tamperedToken = parts[0] + "." + tamperedPayload + "." + parts[2];

        assertThat(jwtTokenProvider.validateToken(tamperedToken)).isFalse();
    }

    @Test
    @DisplayName("Từ chối Token được ký bằng khóa bí mật (Secret Key) khác")
    void shouldReturnFalseWhenTokenIsSignedWithDifferentKey() {
        String anotherSecret = "anotherSuperSecretKeyThatIsCompletelyDifferent123!";
        JwtTokenProvider anotherProvider = new JwtTokenProvider(anotherSecret, ACCESS_EXPIRATION_MS, REFRESH_EXPIRATION_MS, ISSUER);

        String tokenSignedByAnother = anotherProvider.generateAccessToken("user@mcmusic.com", null);

        // jwtTokenProvider dùng VALID_SECRET nên phải từ chối token này
        assertThat(jwtTokenProvider.validateToken(tokenSignedByAnother)).isFalse();
    }

    @Test
    @DisplayName("Từ chối Token đã hết hạn (Expired Token)")
    void shouldReturnFalseWhenTokenIsExpired() {
        // Tạo provider với expiration âm (-1000ms = đã hết hạn ngay khi sinh)
        JwtTokenProvider expiredProvider = new JwtTokenProvider(VALID_SECRET, -1000L, -1000L, ISSUER);

        String expiredToken = expiredProvider.generateAccessToken("expired@mcmusic.com", null);

        assertThat(jwtTokenProvider.validateToken(expiredToken)).isFalse();
    }

    @Test
    @DisplayName("Trích xuất ngày hết hạn (Expiration Date) chính xác")
    void shouldExtractExpirationDateCorrectly() {
        long nowMs = System.currentTimeMillis();
        String token = jwtTokenProvider.generateAccessToken("user@mcmusic.com", null);

        Date expiration = jwtTokenProvider.getExpirationDateFromToken(token);

        assertThat(expiration.getTime()).isGreaterThanOrEqualTo(nowMs + ACCESS_EXPIRATION_MS - 2000L);
        assertThat(expiration.getTime()).isLessThanOrEqualTo(nowMs + ACCESS_EXPIRATION_MS + 5000L);
    }
}

