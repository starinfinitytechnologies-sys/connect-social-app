package com.connectlocal.backend.security;

import com.connectlocal.backend.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTokenMinutes;

    public JwtService(JwtProperties properties) {
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
        this.accessTokenMinutes = properties.accessTokenMinutes();
    }

    public String createAccessToken(UserPrincipal principal) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(principal.id())
                .claim("email", principal.email())
                .claim("role", principal.role())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public UserPrincipal parseAccessToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return new UserPrincipal(
                    claims.getSubject(),
                    claims.get("email", String.class),
                    claims.get("role", String.class)
            );
        } catch (JwtException | IllegalArgumentException exception) {
            return null;
        }
    }

    public long accessTokenSeconds() {
        return accessTokenMinutes * 60;
    }
}
