package com.connectlocal.backend.chat;

import com.connectlocal.backend.common.Ids;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class ConversationRepository {

    private final JdbcClient jdbc;

    public ConversationRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public String createForConnection(String connectionId) {
        Optional<String> existing = jdbc.sql("""
                        SELECT id FROM conversations WHERE connection_id = :connectionId
                        """)
                .param("connectionId", connectionId)
                .query(String.class)
                .optional();

        if (existing.isPresent()) {
            return existing.get();
        }

        String id = Ids.newId();
        jdbc.sql("""
                        INSERT INTO conversations (id, connection_id)
                        VALUES (:id, :connectionId)
                        """)
                .param("id", id)
                .param("connectionId", connectionId)
                .update();
        return id;
    }

    public Optional<ConversationRow> findById(String id) {
        return jdbc.sql("""
                        SELECT id, connection_id, last_message_at
                        FROM conversations
                        WHERE id = :id
                        """)
                .param("id", id)
                .query(this::mapConversation)
                .optional();
    }

    public boolean isParticipant(String conversationId, String userId) {
        Long count = jdbc.sql("""
                        SELECT COUNT(*)
                        FROM conversations c
                        JOIN connections n ON n.id = c.connection_id
                        WHERE c.id = :conversationId
                          AND (n.requester_id = :userId OR n.recipient_id = :userId)
                        """)
                .param("conversationId", conversationId)
                .param("userId", userId)
                .query(Long.class)
                .single();
        return count != null && count > 0;
    }

    public List<ConversationListRow> listForUser(String userId) {
        return jdbc.sql("""
                        SELECT
                            c.id,
                            c.connection_id,
                            c.last_message_at,
                            ou.id AS other_user_id,
                            COALESCE(ou.display_name, ou.full_name) AS other_name,
                            p.id AS professional_id,
                            (
                                SELECT m.body
                                FROM messages m
                                WHERE m.conversation_id = c.id
                                ORDER BY m.created_at DESC
                                LIMIT 1
                            ) AS last_message,
                            (
                                SELECT COUNT(*)
                                FROM messages m
                                WHERE m.conversation_id = c.id
                                  AND m.sender_id <> :userId
                                  AND m.read_at IS NULL
                            ) AS unread_count
                        FROM conversations c
                        JOIN connections n ON n.id = c.connection_id
                        JOIN users ou ON ou.id = CASE
                            WHEN n.requester_id = :userId THEN n.recipient_id
                            ELSE n.requester_id
                        END
                        LEFT JOIN professional_profiles p ON p.user_id = ou.id
                        WHERE (n.requester_id = :userId OR n.recipient_id = :userId)
                          AND n.status = 'accepted'
                        ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
                        """)
                .param("userId", userId)
                .query((rs, rowNum) -> new ConversationListRow(
                        rs.getString("id"),
                        rs.getString("connection_id"),
                        rs.getString("other_user_id"),
                        rs.getString("other_name"),
                        rs.getString("professional_id"),
                        rs.getString("last_message"),
                        toIsoString(rs.getTimestamp("last_message_at")),
                        rs.getInt("unread_count")
                ))
                .list();
    }

    public List<MessageRow> messages(String conversationId, String userId) {
        jdbc.sql("""
                        UPDATE messages
                        SET read_at = CURRENT_TIMESTAMP(6)
                        WHERE conversation_id = :conversationId
                          AND sender_id <> :userId
                          AND read_at IS NULL
                        """)
                .param("conversationId", conversationId)
                .param("userId", userId)
                .update();

        return jdbc.sql("""
                        SELECT m.id, m.sender_id, COALESCE(u.display_name, u.full_name) AS sender_name,
                               m.message_type, m.body, m.attachment_url, m.created_at, m.read_at
                        FROM messages m
                        JOIN users u ON u.id = m.sender_id
                        WHERE m.conversation_id = :conversationId
                        ORDER BY m.created_at ASC
                        """)
                .param("conversationId", conversationId)
                .query((rs, rowNum) -> new MessageRow(
                        rs.getString("id"),
                        rs.getString("sender_id"),
                        rs.getString("sender_name"),
                        rs.getString("message_type"),
                        rs.getString("body"),
                        rs.getString("attachment_url"),
                        toIsoString(rs.getTimestamp("created_at")),
                        toIsoString(rs.getTimestamp("read_at"))
                ))
                .list();
    }

    public MessageRow send(String conversationId, String senderId, String body) {
        String id = Ids.newId();
        jdbc.sql("""
                        INSERT INTO messages (id, conversation_id, sender_id, message_type, body)
                        VALUES (:id, :conversationId, :senderId, 'text', :body)
                        """)
                .param("id", id)
                .param("conversationId", conversationId)
                .param("senderId", senderId)
                .param("body", body)
                .update();

        jdbc.sql("""
                        UPDATE conversations
                        SET last_message_at = CURRENT_TIMESTAMP(6)
                        WHERE id = :id
                        """)
                .param("id", conversationId)
                .update();

        return jdbc.sql("""
                        SELECT m.id, m.sender_id, COALESCE(u.display_name, u.full_name) AS sender_name,
                               m.message_type, m.body, m.attachment_url, m.created_at, m.read_at
                        FROM messages m
                        JOIN users u ON u.id = m.sender_id
                        WHERE m.id = :id
                        """)
                .param("id", id)
                .query((rs, rowNum) -> new MessageRow(
                        rs.getString("id"),
                        rs.getString("sender_id"),
                        rs.getString("sender_name"),
                        rs.getString("message_type"),
                        rs.getString("body"),
                        rs.getString("attachment_url"),
                        toIsoString(rs.getTimestamp("created_at")),
                        toIsoString(rs.getTimestamp("read_at"))
                ))
                .single();
    }

    private ConversationRow mapConversation(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new ConversationRow(
                rs.getString("id"),
                rs.getString("connection_id"),
                toIsoString(rs.getTimestamp("last_message_at"))
        );
    }

    private static String toIsoString(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().toString();
    }

    public record ConversationRow(String id, String connectionId, String lastMessageAt) {
    }

    public record ConversationListRow(
            String id,
            String connectionId,
            String otherUserId,
            String otherName,
            String professionalId,
            String lastMessage,
            String lastMessageAt,
            int unreadCount
    ) {
    }

    public record MessageRow(
            String id,
            String senderId,
            String senderName,
            String type,
            String body,
            String attachmentUrl,
            String createdAt,
            String readAt
    ) {
    }
}
