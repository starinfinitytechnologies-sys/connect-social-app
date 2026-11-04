package com.connectlocal.backend.enquiry;

import com.connectlocal.backend.common.Ids;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class EnquiryRepository {

    private final JdbcClient jdbc;

    public EnquiryRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public boolean serviceBelongsToProfessional(String serviceId, String professionalId) {
        Long count = jdbc.sql("""
                        SELECT COUNT(*)
                        FROM professional_services
                        WHERE id = :serviceId
                          AND professional_id = :professionalId
                          AND is_active = TRUE
                        """)
                .param("serviceId", serviceId)
                .param("professionalId", professionalId)
                .query(Long.class)
                .single();
        return count != null && count > 0;
    }

    public String insert(String customerId, String professionalId, String serviceId, String message) {
        String id = Ids.newId();
        jdbc.sql("""
                        INSERT INTO enquiries (
                            id, customer_id, professional_id, service_id, message, status, metadata
                        ) VALUES (
                            :id, :customerId, :professionalId, :serviceId, :message, 'recorded', '{}'
                        )
                        """)
                .param("id", id)
                .param("customerId", customerId)
                .param("professionalId", professionalId)
                .param("serviceId", serviceId)
                .param("message", message)
                .update();
        return id;
    }

    public Optional<EnquiryRow> findById(String id) {
        return jdbc.sql("""
                        SELECT e.id, e.customer_id, e.professional_id,
                               COALESCE(u.display_name, u.full_name) AS professional_name,
                               e.service_id, s.name AS service_name, e.message, e.status,
                               e.created_at, e.updated_at
                        FROM enquiries e
                        JOIN professional_profiles p ON p.id = e.professional_id
                        JOIN users u ON u.id = p.user_id
                        LEFT JOIN professional_services s ON s.id = e.service_id
                        WHERE e.id = :id
                        """)
                .param("id", id)
                .query(this::map)
                .optional();
    }

    public List<EnquiryRow> listForCustomer(String customerId) {
        return queryList("e.customer_id = :userId", customerId);
    }

    public List<EnquiryRow> listForProfessional(String professionalId) {
        return queryList("e.professional_id = :userId", professionalId);
    }

    public void updateStatus(String id, String status) {
        jdbc.sql("""
                        UPDATE enquiries SET
                            status = :status,
                            responded_at = CASE
                                WHEN :status IN ('responded', 'closed')
                                    THEN COALESCE(responded_at, CURRENT_TIMESTAMP(6))
                                ELSE responded_at
                            END,
                            closed_at = CASE
                                WHEN :status = 'closed' THEN CURRENT_TIMESTAMP(6)
                                ELSE closed_at
                            END,
                            updated_at = CURRENT_TIMESTAMP(6)
                        WHERE id = :id
                        """)
                .param("id", id)
                .param("status", status)
                .update();
    }

    private List<EnquiryRow> queryList(String condition, String userId) {
        return jdbc.sql("""
                        SELECT e.id, e.customer_id, e.professional_id,
                               COALESCE(u.display_name, u.full_name) AS professional_name,
                               e.service_id, s.name AS service_name, e.message, e.status,
                               e.created_at, e.updated_at
                        FROM enquiries e
                        JOIN professional_profiles p ON p.id = e.professional_id
                        JOIN users u ON u.id = p.user_id
                        LEFT JOIN professional_services s ON s.id = e.service_id
                        WHERE %s
                        ORDER BY e.created_at DESC
                        """.formatted(condition))
                .param("userId", userId)
                .query(this::map)
                .list();
    }

    private EnquiryRow map(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new EnquiryRow(
                rs.getString("id"),
                rs.getString("customer_id"),
                rs.getString("professional_id"),
                rs.getString("professional_name"),
                rs.getString("service_id"),
                rs.getString("service_name"),
                rs.getString("message"),
                rs.getString("status"),
                toIsoString(rs.getTimestamp("created_at")),
                toIsoString(rs.getTimestamp("updated_at"))
        );
    }

    private static String toIsoString(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().toString();
    }

    public record EnquiryRow(
            String id,
            String customerId,
            String professionalId,
            String professionalName,
            String serviceId,
            String serviceName,
            String message,
            String status,
            String createdAt,
            String updatedAt
    ) {
    }
}
