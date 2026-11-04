package com.connectlocal.backend.auth;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

@Repository
public class RefreshTokenRepository {

    private final JdbcClient jdbc;

    public RefreshTokenRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(String id, String userId, String tokenHash, Instant expiresAt) {
        jdbc.sql("""
                        INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
                        VALUES (:id, :userId, :tokenHash, :expiresAt)
                        """)
                .param("id", id)
                .param("userId", userId)
                .param("tokenHash", tokenHash)
                .param("expiresAt", Timestamp.from(expiresAt))
                .update();
    }

    public Optional<StoredRefreshToken> findValidByHash(String tokenHash) {
        return jdbc.sql("""
                        SELECT id, user_id, expires_at
                        FROM refresh_tokens
                        WHERE token_hash = :tokenHash
                          AND revoked = FALSE
                          AND expires_at > CURRENT_TIMESTAMP(6)
                        """)
                .param("tokenHash", tokenHash)
                .query((rs, rowNum) -> new StoredRefreshToken(
                        rs.getString("id"),
                        rs.getString("user_id"),
                        rs.getTimestamp("expires_at").toInstant()
                ))
                .optional();
    }

    public void revokeByHash(String tokenHash) {
        jdbc.sql("UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = :tokenHash")
                .param("tokenHash", tokenHash)
                .update();
    }

    public void revokeAllForUser(String userId) {
        jdbc.sql("UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = :userId AND revoked = FALSE")
                .param("userId", userId)
                .update();
    }

    public record StoredRefreshToken(String id, String userId, Instant expiresAt) {
    }
}
