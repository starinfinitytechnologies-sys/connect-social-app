package com.connectlocal.backend.user;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

@Repository
public class UserRepository {

    private static final String COLUMNS = """
            id, email, password_hash, role, full_name, display_name, avatar_url,
            city, state, area, phone, phone_verified, enabled, created_at, updated_at
            """;

    private final JdbcClient jdbc;

    public UserRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<UserAccount> findByEmail(String email) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM users WHERE email = :email")
                .param("email", email)
                .query(this::map)
                .optional();
    }

    public Optional<UserAccount> findById(String id) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM users WHERE id = :id")
                .param("id", id)
                .query(this::map)
                .optional();
    }

    public boolean emailExists(String email) {
        Long count = jdbc.sql("SELECT COUNT(*) FROM users WHERE email = :email")
                .param("email", email)
                .query(Long.class)
                .single();
        return count != null && count > 0;
    }

    public void insert(UserAccount account) {
        jdbc.sql("""
                        INSERT INTO users (
                            id, email, password_hash, role, full_name, display_name,
                            avatar_url, city, state, area, phone, phone_verified, enabled
                        ) VALUES (
                            :id, :email, :passwordHash, :role, :fullName, :displayName,
                            :avatarUrl, :city, :state, :area, :phone, :phoneVerified, :enabled
                        )
                        """)
                .param("id", account.id())
                .param("email", account.email())
                .param("passwordHash", account.passwordHash())
                .param("role", account.role())
                .param("fullName", account.fullName())
                .param("displayName", account.displayName())
                .param("avatarUrl", account.avatarUrl())
                .param("city", account.city())
                .param("state", account.state())
                .param("area", account.area())
                .param("phone", account.phone())
                .param("phoneVerified", account.phoneVerified())
                .param("enabled", account.enabled())
                .update();
    }

    public void updateProfile(UserAccount account) {
        jdbc.sql("""
                        UPDATE users SET
                            full_name = :fullName,
                            display_name = :displayName,
                            avatar_url = :avatarUrl,
                            city = :city,
                            state = :state,
                            area = :area,
                            phone = :phone,
                            updated_at = CURRENT_TIMESTAMP(6)
                        WHERE id = :id
                        """)
                .param("id", account.id())
                .param("fullName", account.fullName())
                .param("displayName", account.displayName())
                .param("avatarUrl", account.avatarUrl())
                .param("city", account.city())
                .param("state", account.state())
                .param("area", account.area())
                .param("phone", account.phone())
                .update();
    }

    public void updateRole(String id, String role) {
        jdbc.sql("UPDATE users SET role = :role WHERE id = :id")
                .param("id", id)
                .param("role", role)
                .update();
    }

    private UserAccount map(ResultSet rs, int rowNum) throws SQLException {
        return new UserAccount(
                rs.getString("id"),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getString("role"),
                rs.getString("full_name"),
                rs.getString("display_name"),
                rs.getString("avatar_url"),
                rs.getString("city"),
                rs.getString("state"),
                rs.getString("area"),
                rs.getString("phone"),
                rs.getBoolean("phone_verified"),
                rs.getBoolean("enabled"),
                toInstant(rs.getTimestamp("created_at")),
                toInstant(rs.getTimestamp("updated_at"))
        );
    }

    private static Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}
