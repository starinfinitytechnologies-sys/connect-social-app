package com.connectlocal.backend.report;

import com.connectlocal.backend.common.Ids;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ReportRepository {

    private final JdbcClient jdbc;

    public ReportRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(String reporterId, CreateReportRequest request) {
        jdbc.sql("""
                        INSERT INTO reports (
                            id, reporter_id, target_type, target_id, reason, details, status
                        ) VALUES (
                            :id, :reporterId, :targetType, :targetId, :reason, :details, 'pending'
                        )
                        """)
                .param("id", Ids.newId())
                .param("reporterId", reporterId)
                .param("targetType", request.targetType())
                .param("targetId", request.targetId())
                .param("reason", request.reason().trim())
                .param("details", request.details() == null ? null : request.details().trim())
                .update();
    }
}
