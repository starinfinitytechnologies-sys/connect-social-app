package com.connectlocal.backend.review;

import com.connectlocal.backend.common.Ids;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.Optional;

@Repository
public class ReviewRepository {

    private final JdbcClient jdbc;

    public ReviewRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<EnquiryReviewInfo> findEnquiryInfo(String enquiryId) {
        return jdbc.sql("""
                        SELECT customer_id, professional_id, status
                        FROM enquiries
                        WHERE id = :id
                        """)
                .param("id", enquiryId)
                .query((rs, rowNum) -> new EnquiryReviewInfo(
                        rs.getString("customer_id"),
                        rs.getString("professional_id"),
                        rs.getString("status")
                ))
                .optional();
    }

    public boolean existsForEnquiry(String enquiryId) {
        Long count = jdbc.sql("SELECT COUNT(*) FROM reviews WHERE enquiry_id = :id")
                .param("id", enquiryId)
                .query(Long.class)
                .single();
        return count != null && count > 0;
    }

    public String insert(
            String enquiryId,
            String customerId,
            String professionalId,
            int rating,
            String body
    ) {
        String id = Ids.newId();
        jdbc.sql("""
                        INSERT INTO reviews (
                            id, enquiry_id, customer_id, professional_id, rating, body,
                            verified_interaction, status
                        ) VALUES (
                            :id, :enquiryId, :customerId, :professionalId, :rating, :body,
                            TRUE, 'pending'
                        )
                        """)
                .param("id", id)
                .param("enquiryId", enquiryId)
                .param("customerId", customerId)
                .param("professionalId", professionalId)
                .param("rating", rating)
                .param("body", body)
                .update();
        return id;
    }

    public Optional<ReviewItemResponse> findById(String id) {
        return jdbc.sql("""
                        SELECT r.id, r.rating, r.body, r.verified_interaction, r.status,
                               r.created_at, COALESCE(u.display_name, u.full_name) AS author
                        FROM reviews r
                        JOIN users u ON u.id = r.customer_id
                        WHERE r.id = :id
                        """)
                .param("id", id)
                .query((rs, rowNum) -> new ReviewItemResponse(
                        rs.getString("id"),
                        rs.getString("author"),
                        rs.getInt("rating"),
                        rs.getString("body"),
                        toIsoString(rs.getTimestamp("created_at")),
                        rs.getBoolean("verified_interaction"),
                        rs.getString("status")
                ))
                .optional();
    }

    public java.util.List<AdminReviewRow> listByStatus(String status) {
        String sql = """
                SELECT r.id, r.enquiry_id, r.professional_id, r.rating, r.body, r.status,
                       r.created_at, COALESCE(u.display_name, u.full_name) AS customer_name
                FROM reviews r
                JOIN users u ON u.id = r.customer_id
                """;
        if (status != null) {
            sql += " WHERE r.status = :status";
        }
        sql += " ORDER BY r.created_at ASC";

        var spec = jdbc.sql(sql);
        if (status != null) {
            spec = spec.param("status", status);
        }
        return spec.query((rs, rowNum) -> new AdminReviewRow(
                        rs.getString("id"),
                        rs.getString("enquiry_id"),
                        rs.getString("professional_id"),
                        rs.getString("customer_name"),
                        rs.getInt("rating"),
                        rs.getString("body"),
                        rs.getString("status"),
                        toIsoString(rs.getTimestamp("created_at"))
                ))
                .list();
    }

    public String updateStatus(String id, String status) {
        String professionalId = jdbc.sql("SELECT professional_id FROM reviews WHERE id = :id")
                .param("id", id)
                .query(String.class)
                .single();

        jdbc.sql("UPDATE reviews SET status = :status WHERE id = :id")
                .param("id", id)
                .param("status", status)
                .update();

        return professionalId;
    }

    public void syncRating(String professionalId) {
        jdbc.sql("""
                        UPDATE professional_profiles p
                        SET
                            rating_average = COALESCE(
                                (
                                    SELECT ROUND(AVG(r.rating), 2)
                                    FROM reviews r
                                    WHERE r.professional_id = :professionalId
                                      AND r.status = 'published'
                                ),
                                0
                            ),
                            review_count = (
                                SELECT COUNT(*)
                                FROM reviews r
                                WHERE r.professional_id = :professionalId
                                  AND r.status = 'published'
                            ),
                            updated_at = CURRENT_TIMESTAMP(6)
                        WHERE p.id = :professionalId
                        """)
                .param("professionalId", professionalId)
                .update();
    }

    private static String toIsoString(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().toString();
    }

    public record EnquiryReviewInfo(String customerId, String professionalId, String status) {
    }
}
