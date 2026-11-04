package com.connectlocal.backend.blocked;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class BlockedRepository {

    private final JdbcClient jdbc;

    public BlockedRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<String> listProfessionalIds(String userId) {
        return jdbc.sql("""
                        SELECT p.id
                        FROM blocked_users b
                        JOIN professional_profiles p ON p.user_id = b.blocked_user_id
                        WHERE b.user_id = :userId
                        ORDER BY b.created_at DESC
                        """)
                .param("userId", userId)
                .query(String.class)
                .list();
    }

    public boolean isBlockedBetween(String userA, String userB) {
        Long count = jdbc.sql("""
                        SELECT COUNT(*)
                        FROM blocked_users
                        WHERE (user_id = :userA AND blocked_user_id = :userB)
                           OR (user_id = :userB AND blocked_user_id = :userA)
                        """)
                .param("userA", userA)
                .param("userB", userB)
                .query(Long.class)
                .single();
        return count != null && count > 0;
    }

    public void block(String userId, String blockedUserId, String reason) {
        jdbc.sql("""
                        INSERT INTO blocked_users (user_id, blocked_user_id, reason)
                        VALUES (:userId, :blockedUserId, :reason)
                        ON DUPLICATE KEY UPDATE reason = VALUES(reason)
                        """)
                .param("userId", userId)
                .param("blockedUserId", blockedUserId)
                .param("reason", reason)
                .update();
    }

    public void unblock(String userId, String blockedUserId) {
        jdbc.sql("""
                        DELETE FROM blocked_users
                        WHERE user_id = :userId AND blocked_user_id = :blockedUserId
                        """)
                .param("userId", userId)
                .param("blockedUserId", blockedUserId)
                .update();
    }
}
