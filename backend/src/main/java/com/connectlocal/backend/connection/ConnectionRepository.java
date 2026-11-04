package com.connectlocal.backend.connection;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class ConnectionRepository {

    private final JdbcClient jdbc;

    public ConnectionRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<ConnectionRow> findById(String id) {
        return jdbc.sql("""
                        SELECT id, requester_id, recipient_id, status, message, created_at, responded_at
                        FROM connections
                        WHERE id = :id
                        """)
                .param("id", id)
                .query(this::map)
                .optional();
    }

    public boolean hasActiveConnection(String userA, String userB) {
        Long count = jdbc.sql("""
                        SELECT COUNT(*)
                        FROM connections
                        WHERE status IN ('pending', 'accepted')
                          AND (
                            (requester_id = :userA AND recipient_id = :userB)
                            OR (requester_id = :userB AND recipient_id = :userA)
                          )
                        """)
                .param("userA", userA)
                .param("userB", userB)
                .query(Long.class)
                .single();
        return count != null && count > 0;
    }

    public String insert(String requesterId, String recipientId, String message) {
        String id = com.connectlocal.backend.common.Ids.newId();
        jdbc.sql("""
                        INSERT INTO connections (id, requester_id, recipient_id, status, message)
                        VALUES (:id, :requesterId, :recipientId, 'pending', :message)
                        """)
                .param("id", id)
                .param("requesterId", requesterId)
                .param("recipientId", recipientId)
                .param("message", message)
                .update();
        return id;
    }

    public void updateStatus(String id, String status) {
        jdbc.sql("""
                        UPDATE connections SET
                            status = :status,
                            responded_at = CASE
                                WHEN :status IN ('accepted', 'declined') THEN CURRENT_TIMESTAMP(6)
                                ELSE responded_at
                            END,
                            updated_at = CURRENT_TIMESTAMP(6)
                        WHERE id = :id
                        """)
                .param("id", id)
                .param("status", status)
                .update();
    }

    public List<ConnectionRow> listForUser(String userId) {
        return jdbc.sql("""
                        SELECT id, requester_id, recipient_id, status, message, created_at, responded_at
                        FROM connections
                        WHERE requester_id = :userId OR recipient_id = :userId
                        ORDER BY updated_at DESC
                        """)
                .param("userId", userId)
                .query(this::map)
                .list();
    }

    private ConnectionRow map(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new ConnectionRow(
                rs.getString("id"),
                rs.getString("requester_id"),
                rs.getString("recipient_id"),
                rs.getString("status"),
                rs.getString("message"),
                toInstant(rs.getTimestamp("created_at")),
                toInstant(rs.getTimestamp("responded_at"))
        );
    }

    private static Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    public record ConnectionRow(
            String id,
            String requesterId,
            String recipientId,
            String status,
            String message,
            Instant createdAt,
            Instant respondedAt
    ) {
    }
}
