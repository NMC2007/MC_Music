package com.example.catalogservice.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mcmusic.sharedauth.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Base64;
import java.util.Collections;

@Component
public class MultiIssuerJwtFilter extends OncePerRequestFilter {

    private final JwtTokenProvider userJwtTokenProvider;
    private final JwtTokenProvider artistJwtTokenProvider;
    private final JwtTokenProvider adminJwtTokenProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MultiIssuerJwtFilter(JwtTokenProvider userJwtTokenProvider,
                                JwtTokenProvider artistJwtTokenProvider,
                                JwtTokenProvider adminJwtTokenProvider) {
        this.userJwtTokenProvider = userJwtTokenProvider;
        this.artistJwtTokenProvider = artistJwtTokenProvider;
        this.adminJwtTokenProvider = adminJwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String token = getJwtFromRequest(request);
        if (StringUtils.hasText(token)) {
            try {
                String issuer = extractIssuerWithoutVerification(token);
                JwtTokenProvider provider = getProviderByIssuer(issuer);
                
                if (provider != null && provider.validateToken(token)) {
                    Claims claims = provider.getClaimsFromToken(token);
                    String role = claims.get("role", String.class);
                    
                    if (role == null) {
                        // Fallback based on issuer if role isn't explicitly in claims
                        if ("user-service".equals(issuer)) role = "USER";
                        else if ("artist-service".equals(issuer)) role = "ARTIST";
                        else if ("admin-service".equals(issuer)) role = "ADMIN";
                    }

                    // Prepend ROLE_ for Spring Security
                    String springRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                    
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            claims.getSubject(), null, Collections.singletonList(new SimpleGrantedAuthority(springRole))
                    );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception ex) {
                logger.error("Could not set user authentication in security context", ex);
            }
        }
        
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private String extractIssuerWithoutVerification(String token) throws IOException {
        String[] parts = token.split("\\.");
        if (parts.length < 2) return null;
        
        String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
        JsonNode jsonNode = objectMapper.readTree(payload);
        if (jsonNode.has("iss")) {
            return jsonNode.get("iss").asText();
        }
        return null;
    }
    
    private JwtTokenProvider getProviderByIssuer(String issuer) {
        if ("user-service".equals(issuer)) return userJwtTokenProvider;
        if ("artist-service".equals(issuer)) return artistJwtTokenProvider;
        if ("admin-service".equals(issuer)) return adminJwtTokenProvider;
        return null;
    }
}
