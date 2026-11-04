package com.connectlocal.backend.catalog;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class CatalogueRepository {

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public CatalogueRepository(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public CatalogueResponse getCatalogue() {
        List<PlanResponse> plans = jdbc.sql("""
                        SELECT id, name, tagline, monthly_price_inr, annual_price_inr, limits, features
                        FROM plans
                        WHERE is_active = TRUE
                        ORDER BY sort_order, name
                        """)
                .query((rs, rowNum) -> new PlanResponse(
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getString("tagline"),
                        rs.getInt("monthly_price_inr"),
                        rs.getInt("annual_price_inr"),
                        readMap(rs.getString("limits")),
                        readList(rs.getString("features")),
                        "pro".equals(rs.getString("id"))
                ))
                .list();

        List<CreditPackResponse> creditPacks = jdbc.sql("""
                        SELECT id, credits, price_inr, label, description
                        FROM credit_packs
                        WHERE is_active = TRUE
                        ORDER BY sort_order, price_inr
                        """)
                .query((rs, rowNum) -> new CreditPackResponse(
                        rs.getString("id"),
                        rs.getInt("credits"),
                        rs.getInt("price_inr"),
                        rs.getString("label"),
                        rs.getString("description")
                ))
                .list();

        Boolean paymentsEnabled = jdbc.sql("""
                        SELECT JSON_UNQUOTE(value)
                        FROM platform_settings
                        WHERE setting_key = 'payments_enabled'
                        """)
                .query(String.class)
                .optional()
                .map(Boolean::parseBoolean)
                .orElse(false);

        return new CatalogueResponse(plans, creditPacks, paymentsEnabled);
    }

    private Map<String, Object> readMap(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception exception) {
            throw new IllegalStateException("Invalid plan limits JSON", exception);
        }
    }

    private List<String> readList(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception exception) {
            throw new IllegalStateException("Invalid plan features JSON", exception);
        }
    }
}
