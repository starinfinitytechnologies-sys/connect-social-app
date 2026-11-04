package com.connectlocal.backend.saved;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SavedRepository {

    private final JdbcClient jdbc;

    public SavedRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<String> listProfessionalIds(String userId) {
        return jdbc.sql("""
                        SELECT professional_id
                        FROM saved_profiles
                        WHERE user_id = :userId
                        ORDER BY created_at DESC
                        """)
                .param("userId", userId)
                .query(String.class)
                .list();
    }

    public void save(String userId, String professionalId) {
        jdbc.sql("""
                        INSERT INTO saved_profiles (user_id, professional_id)
                        VALUES (:userId, :professionalId)
                        ON DUPLICATE KEY UPDATE created_at = created_at
                        """)
                .param("userId", userId)
                .param("professionalId", professionalId)
                .update();
    }

    public void remove(String userId, String professionalId) {
        jdbc.sql("""
                        DELETE FROM saved_profiles
                        WHERE user_id = :userId AND professional_id = :professionalId
                        """)
                .param("userId", userId)
                .param("professionalId", professionalId)
                .update();
    }
}
