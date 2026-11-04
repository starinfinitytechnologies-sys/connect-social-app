package com.connectlocal.backend.professional;

import com.connectlocal.backend.catalog.SubcategoryResponse;
import com.connectlocal.backend.common.Ids;
import com.connectlocal.backend.common.PageResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Repository
public class ProfessionalRepository {

    private static final String PROFILE_SELECT = """
            SELECT
                p.id,
                p.user_id,
                COALESCE(u.display_name, u.full_name) AS name,
                u.avatar_url,
                p.category_id,
                c.name AS category_name,
                c.color AS category_color,
                c.soft_color AS category_soft,
                c.regulated,
                p.business_name,
                p.headline,
                p.profession,
                p.bio,
                p.experience_years,
                p.languages,
                p.service_radius_km,
                p.availability_status,
                p.working_hours,
                p.next_slot,
                p.verification_status,
                p.identity_verified,
                p.qualification_verified,
                p.rating_average,
                p.review_count,
                p.completed_enquiries,
                p.response_rate,
                p.response_time,
                p.is_sponsored,
                p.is_active,
                p.price_from,
                p.area,
                p.city,
                p.state,
                p.latitude_approx,
                p.longitude_approx,
                p.request_count,
                p.profile_views,
                p.profile_completeness,
                p.created_at
            FROM professional_profiles p
            JOIN users u ON u.id = p.user_id
            JOIN categories c ON c.id = p.category_id
            """;

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public ProfessionalRepository(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public PageResponse<ProfessionalSummaryResponse> search(ProfessionalQuery query) {
        int page = query.safePage();
        int size = query.safeSize();
        Map<String, Object> params = new HashMap<>();
        StringBuilder where = new StringBuilder(" WHERE p.is_active = TRUE ");

        if (hasText(query.categoryId())) {
            where.append(" AND p.category_id = :categoryId ");
            params.put("categoryId", query.categoryId());
        }

        if (hasText(query.subcategoryId())) {
            where.append("""
                     AND EXISTS (
                        SELECT 1 FROM professional_subcategories ps
                        WHERE ps.professional_id = p.id
                          AND ps.subcategory_id = :subcategoryId
                     )
                    """);
            params.put("subcategoryId", query.subcategoryId());
        }

        if (hasText(query.query())) {
            where.append("""
                     AND (
                        LOWER(p.profession) LIKE :search
                        OR LOWER(COALESCE(p.headline, '')) LIKE :search
                        OR LOWER(COALESCE(p.bio, '')) LIKE :search
                        OR LOWER(c.name) LIKE :search
                     )
                    """);
            params.put("search", "%" + query.query().trim().toLowerCase(Locale.ROOT) + "%");
        }

        if (hasText(query.city())) {
            where.append(" AND LOWER(p.city) = :city ");
            params.put("city", query.city().trim().toLowerCase(Locale.ROOT));
        }

        boolean hasCoordinates = query.latitude() != null && query.longitude() != null;
        String distanceSelect = "NULL AS distance_km";
        if (hasCoordinates) {
            params.put("lat", query.latitude());
            params.put("lng", query.longitude());
            distanceSelect = """
                    CASE
                        WHEN p.latitude_approx IS NULL OR p.longitude_approx IS NULL THEN NULL
                        ELSE (
                            6371 * ACOS(
                                LEAST(1.0,
                                    COS(RADIANS(:lat)) * COS(RADIANS(p.latitude_approx))
                                    * COS(RADIANS(p.longitude_approx) - RADIANS(:lng))
                                    + SIN(RADIANS(:lat)) * SIN(RADIANS(p.latitude_approx))
                                )
                            )
                        )
                    END AS distance_km
                    """;
        }

        String base = "SELECT p.*, " + distanceSelect + " FROM (" + PROFILE_SELECT + where + ") p";
        String radiusClause = "";
        if (hasCoordinates && query.radiusKm() != null) {
            radiusClause = " WHERE distance_km IS NOT NULL AND distance_km <= :radiusKm ";
            params.put("radiusKm", query.radiusKm());
        }

        Long total = jdbc.sql("SELECT COUNT(*) FROM (" + base + ") q" + radiusClause)
                .params(params)
                .query(Long.class)
                .single();

        params.put("limit", size);
        params.put("offset", (long) page * size);

        String orderBy = orderBy(query.sort(), hasCoordinates);
        List<ProfessionalRow> rows = jdbc.sql(
                        "SELECT * FROM (" + base + ") q" + radiusClause
                                + " ORDER BY " + orderBy
                                + " LIMIT :limit OFFSET :offset"
                )
                .params(params)
                .query(this::mapRow)
                .list();

        Map<String, ContactInfo> contacts = findContacts(
                rows.stream().map(ProfessionalRow::id).toList()
        );

        List<ProfessionalSummaryResponse> items = rows.stream()
                .map(row -> toSummary(row, contacts.get(row.id())))
                .toList();

        return new PageResponse<>(items, page, size, total == null ? 0 : total);
    }

    public Optional<ProfessionalDetailResponse> findDetail(String id) {
        return findRowById(id).map(row -> toDetail(row, findContacts(List.of(row.id())).get(row.id())));
    }

    public Optional<ProfessionalRow> findRowById(String id) {
        return jdbc.sql("SELECT q.*, NULL AS distance_km FROM (" + PROFILE_SELECT + " WHERE p.id = :id) q")
                .param("id", id)
                .query(this::mapRow)
                .optional();
    }

    public Optional<ProfessionalRow> findRowByUserId(String userId) {
        return jdbc.sql("SELECT q.*, NULL AS distance_km FROM (" + PROFILE_SELECT + " WHERE p.user_id = :userId) q")
                .param("userId", userId)
                .query(this::mapRow)
                .optional();
    }

    public Optional<ProfessionalSummaryResponse> findSummaryByUserId(String userId) {
        return findRowByUserId(userId)
                .map(row -> toSummary(row, findContacts(List.of(row.id())).get(row.id())));
    }

    public Optional<ProfessionalSummaryResponse> findSummaryById(String id) {
        return findRowById(id)
                .map(row -> toSummary(row, findContacts(List.of(row.id())).get(row.id())));
    }

    public Optional<String> findUserIdById(String id) {
        return jdbc.sql("SELECT user_id FROM professional_profiles WHERE id = :id AND is_active = TRUE")
                .param("id", id)
                .query(String.class)
                .optional();
    }

    public boolean existsByUserId(String userId) {
        Long count = jdbc.sql("SELECT COUNT(*) FROM professional_profiles WHERE user_id = :userId")
                .param("userId", userId)
                .query(Long.class)
                .single();
        return count != null && count > 0;
    }

    public void incrementProfileViews(String id) {
        jdbc.sql("""
                        UPDATE professional_profiles
                        SET profile_views = profile_views + 1
                        WHERE id = :id
                        """)
                .param("id", id)
                .update();
    }

    public boolean categoryExists(String categoryId) {
        Long count = jdbc.sql("SELECT COUNT(*) FROM categories WHERE id = :id AND is_active = TRUE")
                .param("id", categoryId)
                .query(Long.class)
                .single();
        return count != null && count > 0;
    }

    public List<String> findSubcategoryIdsForCategory(String categoryId) {
        return jdbc.sql("""
                        SELECT id FROM subcategories
                        WHERE category_id = :categoryId AND is_active = TRUE
                        """)
                .param("categoryId", categoryId)
                .query(String.class)
                .list();
    }

    public void insertProfile(ProfileWrite profile) {
        jdbc.sql("""
                        INSERT INTO professional_profiles (
                            id, user_id, category_id, business_name, headline, profession, bio,
                            experience_years, languages, service_radius_km, availability_status,
                            working_hours, next_slot, verification_status, identity_verified,
                            qualification_verified, rating_average, review_count, completed_enquiries,
                            response_rate, response_time, is_sponsored, is_active, price_from,
                            area, city, state, latitude_approx, longitude_approx, request_count,
                            profile_views, profile_completeness
                        ) VALUES (
                            :id, :userId, :categoryId, :businessName, :headline, :profession, :bio,
                            :experienceYears, :languages, :serviceRadiusKm, :availabilityStatus,
                            :workingHours, :nextSlot, 'unverified', FALSE, FALSE, 0, 0, 0, 0,
                            '~2 hours', FALSE, TRUE, :priceFrom, :area, :city, :state,
                            :latitude, :longitude, 0, 0, :profileCompleteness
                        )
                        """)
                .param("id", profile.id())
                .param("userId", profile.userId())
                .param("categoryId", profile.categoryId())
                .param("businessName", profile.businessName())
                .param("headline", profile.headline())
                .param("profession", profile.profession())
                .param("bio", profile.bio())
                .param("experienceYears", profile.experienceYears())
                .param("languages", profile.languagesJson())
                .param("serviceRadiusKm", profile.serviceRadiusKm())
                .param("availabilityStatus", profile.availabilityStatus())
                .param("workingHours", profile.workingHoursJson())
                .param("nextSlot", profile.nextSlot())
                .param("priceFrom", profile.priceFrom())
                .param("area", profile.area())
                .param("city", profile.city())
                .param("state", profile.state())
                .param("latitude", profile.latitude())
                .param("longitude", profile.longitude())
                .param("profileCompleteness", profile.profileCompleteness())
                .update();
    }

    public void updateProfile(ProfileWrite profile) {
        jdbc.sql("""
                        UPDATE professional_profiles SET
                            category_id = :categoryId,
                            business_name = :businessName,
                            headline = :headline,
                            profession = :profession,
                            bio = :bio,
                            experience_years = :experienceYears,
                            languages = :languages,
                            service_radius_km = :serviceRadiusKm,
                            availability_status = :availabilityStatus,
                            working_hours = :workingHours,
                            next_slot = :nextSlot,
                            price_from = :priceFrom,
                            area = :area,
                            city = :city,
                            state = :state,
                            latitude_approx = :latitude,
                            longitude_approx = :longitude,
                            profile_completeness = :profileCompleteness,
                            updated_at = CURRENT_TIMESTAMP(6)
                        WHERE id = :id
                        """)
                .param("id", profile.id())
                .param("categoryId", profile.categoryId())
                .param("businessName", profile.businessName())
                .param("headline", profile.headline())
                .param("profession", profile.profession())
                .param("bio", profile.bio())
                .param("experienceYears", profile.experienceYears())
                .param("languages", profile.languagesJson())
                .param("serviceRadiusKm", profile.serviceRadiusKm())
                .param("availabilityStatus", profile.availabilityStatus())
                .param("workingHours", profile.workingHoursJson())
                .param("nextSlot", profile.nextSlot())
                .param("priceFrom", profile.priceFrom())
                .param("area", profile.area())
                .param("city", profile.city())
                .param("state", profile.state())
                .param("latitude", profile.latitude())
                .param("longitude", profile.longitude())
                .param("profileCompleteness", profile.profileCompleteness())
                .update();
    }

    public void replaceSubcategories(String professionalId, List<String> subcategoryIds) {
        jdbc.sql("DELETE FROM professional_subcategories WHERE professional_id = :id")
                .param("id", professionalId)
                .update();

        for (String subcategoryId : subcategoryIds) {
            jdbc.sql("""
                            INSERT INTO professional_subcategories (professional_id, subcategory_id)
                            VALUES (:professionalId, :subcategoryId)
                            """)
                    .param("professionalId", professionalId)
                    .param("subcategoryId", subcategoryId)
                    .update();
        }
    }

    public void replaceServices(String professionalId, List<ServiceInput> services) {
        jdbc.sql("DELETE FROM professional_services WHERE professional_id = :id")
                .param("id", professionalId)
                .update();

        int sort = 10;
        for (ServiceInput service : services) {
            jdbc.sql("""
                            INSERT INTO professional_services (
                                id, professional_id, name, description, price_inr,
                                price_type, duration, is_active, sort_order
                            ) VALUES (
                                :id, :professionalId, :name, :description, :price,
                                :priceType, :duration, TRUE, :sortOrder
                            )
                            """)
                    .param("id", Ids.newId())
                    .param("professionalId", professionalId)
                    .param("name", service.name().trim())
                    .param("description", service.description())
                    .param("price", service.price() == null ? 0 : service.price())
                    .param("priceType", service.priceType() == null
                            ? "from"
                            : service.priceType().toLowerCase(Locale.ROOT))
                    .param("duration", service.duration())
                    .param("sortOrder", sort)
                    .update();
            sort += 10;
        }
    }

    public void replaceContacts(String professionalId, List<ContactInput> contacts) {
        jdbc.sql("DELETE FROM professional_contacts WHERE professional_id = :id")
                .param("id", professionalId)
                .update();

        for (ContactInput contact : contacts) {
            jdbc.sql("""
                            INSERT INTO professional_contacts (
                                id, professional_id, channel, value, is_public
                            ) VALUES (
                                :id, :professionalId, :channel, :value, :isPublic
                            )
                            """)
                    .param("id", Ids.newId())
                    .param("professionalId", professionalId)
                    .param("channel", contact.channel().trim().toLowerCase(Locale.ROOT))
                    .param("value", contact.value().trim())
                    .param("isPublic", Boolean.TRUE.equals(contact.isPublic()))
                    .update();
        }
    }

    public Map<String, String> parseWorkingHours(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception exception) {
            return Map.of();
        }
    }

    private Map<String, ContactInfo> findContacts(List<String> professionalIds) {
        if (professionalIds.isEmpty()) {
            return Map.of();
        }

        Map<String, Object> params = new HashMap<>();
        StringBuilder placeholders = new StringBuilder();
        for (int index = 0; index < professionalIds.size(); index++) {
            if (index > 0) {
                placeholders.append(", ");
            }
            String key = "id" + index;
            placeholders.append(":").append(key);
            params.put(key, professionalIds.get(index));
        }

        Map<String, ContactInfo> contacts = new HashMap<>();
        jdbc.sql("""
                        SELECT professional_id, channel, value, is_public
                        FROM professional_contacts
                        WHERE professional_id IN (%s)
                        """.formatted(placeholders))
                .params(params)
                .query((rs, rowNum) -> new ContactRow(
                        rs.getString("professional_id"),
                        rs.getString("channel"),
                        rs.getString("value"),
                        rs.getBoolean("is_public")
                ))
                .list()
                .forEach(row -> contacts
                        .computeIfAbsent(row.professionalId(), ignored -> new ContactInfo())
                        .add(row.channel(), row.value(), row.publicValue()));

        return contacts;
    }

    private ProfessionalSummaryResponse toSummary(ProfessionalRow row, ContactInfo contact) {
        ContactInfo safeContact = contact == null ? new ContactInfo() : contact;
        double rating = row.ratingAverage() == null ? 0 : row.ratingAverage().doubleValue();
        boolean identityVerified = row.identityVerified();
        boolean qualificationVerified = row.qualificationVerified();
        boolean verified = "verified".equals(row.verificationStatus()) || identityVerified || qualificationVerified;
        String verificationLevel = qualificationVerified
                ? "qualification"
                : identityVerified ? "identity" : "none";
        Double distanceKm = row.distanceKm() == null
                ? null
                : row.distanceKm().setScale(1, RoundingMode.HALF_UP).doubleValue();
        double radiusKm = row.serviceRadiusKm() == null ? 0 : row.serviceRadiusKm().doubleValue();

        return new ProfessionalSummaryResponse(
                row.id(),
                row.userId(),
                row.name(),
                initials(row.name()),
                row.profession(),
                row.categoryId(),
                row.categoryName(),
                row.regulated(),
                row.headline(),
                round(rating),
                row.reviewCount(),
                verified,
                verificationLevel,
                identityVerified,
                qualificationVerified,
                "available_now".equals(row.availabilityStatus()),
                row.availabilityStatus(),
                row.nextSlot(),
                row.experienceYears(),
                readStringList(row.languagesJson()),
                row.priceFrom(),
                distanceKm,
                distanceKm != null && distanceKm <= radiusKm,
                row.area(),
                row.city(),
                row.state(),
                decimalToDouble(row.latitude()),
                decimalToDouble(row.longitude()),
                radiusKm,
                row.avatarUrl(),
                row.categoryColor(),
                row.categorySoft(),
                row.sponsored(),
                row.completedEnquiries() >= 20 || row.reviewCount() >= 10,
                row.sponsored(),
                row.completedEnquiries(),
                row.responseRate() == null ? 0 : round(row.responseRate().doubleValue() / 100.0),
                row.responseTime(),
                row.profileViews(),
                row.requestCount(),
                row.profileCompleteness(),
                safeContact.publicValue("whatsapp"),
                safeContact.visibility()
        );
    }

    private ProfessionalDetailResponse toDetail(ProfessionalRow row, ContactInfo contact) {
        ContactInfo safeContact = contact == null ? new ContactInfo() : contact;
        List<SubcategoryResponse> subcategories = jdbc.sql("""
                        SELECT s.id, s.name
                        FROM professional_subcategories ps
                        JOIN subcategories s ON s.id = ps.subcategory_id
                        WHERE ps.professional_id = :id
                        ORDER BY s.sort_order, s.name
                        """)
                .param("id", row.id())
                .query((rs, rowNum) -> new SubcategoryResponse(
                        rs.getString("id"),
                        rs.getString("name")
                ))
                .list();

        List<ServiceResponse> services = jdbc.sql("""
                        SELECT id, name, description, price_inr, price_type, duration
                        FROM professional_services
                        WHERE professional_id = :id AND is_active = TRUE
                        ORDER BY sort_order, name
                        """)
                .param("id", row.id())
                .query((rs, rowNum) -> new ServiceResponse(
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getString("description"),
                        rs.getInt("price_inr"),
                        rs.getString("price_type"),
                        rs.getString("duration")
                ))
                .list();

        List<EducationResponse> education = jdbc.sql("""
                        SELECT id, degree, institute, graduation_year, is_verified
                        FROM professional_education
                        WHERE professional_id = :id
                        ORDER BY sort_order, graduation_year DESC
                        """)
                .param("id", row.id())
                .query((rs, rowNum) -> new EducationResponse(
                        rs.getString("id"),
                        rs.getString("degree"),
                        rs.getString("institute"),
                        nullableInt(rs, "graduation_year"),
                        rs.getBoolean("is_verified")
                ))
                .list();

        List<CertificationResponse> certifications = jdbc.sql("""
                        SELECT id, title, issuer, certification_year, verification_status
                        FROM professional_certifications
                        WHERE professional_id = :id
                        ORDER BY certification_year DESC
                        """)
                .param("id", row.id())
                .query((rs, rowNum) -> new CertificationResponse(
                        rs.getString("id"),
                        rs.getString("title"),
                        rs.getString("issuer"),
                        nullableInt(rs, "certification_year"),
                        "verified".equals(rs.getString("verification_status"))
                ))
                .list();

        List<PortfolioResponse> portfolio = jdbc.sql("""
                        SELECT id, title, description, image_url, category_label
                        FROM portfolio_items
                        WHERE professional_id = :id AND is_visible = TRUE
                        ORDER BY sort_order, created_at DESC
                        """)
                .param("id", row.id())
                .query((rs, rowNum) -> new PortfolioResponse(
                        rs.getString("id"),
                        rs.getString("title"),
                        rs.getString("description"),
                        rs.getString("image_url"),
                        rs.getString("category_label")
                ))
                .list();

        List<ReviewResponse> reviews = jdbc.sql("""
                        SELECT r.id, r.rating, r.body, r.verified_interaction, r.created_at,
                               COALESCE(u.display_name, u.full_name) AS author
                        FROM reviews r
                        JOIN users u ON u.id = r.customer_id
                        WHERE r.professional_id = :id AND r.status = 'published'
                        ORDER BY r.created_at DESC
                        LIMIT 20
                        """)
                .param("id", row.id())
                .query((rs, rowNum) -> new ReviewResponse(
                        rs.getString("id"),
                        rs.getString("author"),
                        rs.getInt("rating"),
                        rs.getString("body"),
                        toIsoString(rs.getTimestamp("created_at")),
                        rs.getBoolean("verified_interaction")
                ))
                .list();

        ContactResponse contactResponse = new ContactResponse(
                safeContact.value("email"),
                safeContact.value("phone"),
                safeContact.publicValue("whatsapp"),
                safeContact.value("instagram"),
                safeContact.value("linkedin"),
                safeContact.value("facebook"),
                safeContact.value("website"),
                safeContact.visibility()
        );

        return new ProfessionalDetailResponse(
                toSummary(row, safeContact),
                row.bio(),
                subcategories,
                services,
                education,
                certifications,
                portfolio,
                contactResponse,
                parseWorkingHours(row.workingHoursJson()),
                reviews,
                row.createdAt() == null
                        ? null
                        : String.valueOf(row.createdAt().atZone(ZoneOffset.UTC).getYear())
        );
    }

    private ProfessionalRow mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new ProfessionalRow(
                rs.getString("id"),
                rs.getString("user_id"),
                rs.getString("name"),
                rs.getString("avatar_url"),
                rs.getString("category_id"),
                rs.getString("category_name"),
                rs.getString("category_color"),
                rs.getString("category_soft"),
                rs.getBoolean("regulated"),
                rs.getString("business_name"),
                rs.getString("headline"),
                rs.getString("profession"),
                rs.getString("bio"),
                rs.getInt("experience_years"),
                rs.getString("languages"),
                rs.getBigDecimal("service_radius_km"),
                rs.getString("availability_status"),
                rs.getString("working_hours"),
                rs.getString("next_slot"),
                rs.getString("verification_status"),
                rs.getBoolean("identity_verified"),
                rs.getBoolean("qualification_verified"),
                rs.getBigDecimal("rating_average"),
                rs.getInt("review_count"),
                rs.getInt("completed_enquiries"),
                rs.getBigDecimal("response_rate"),
                rs.getString("response_time"),
                rs.getBoolean("is_sponsored"),
                rs.getBoolean("is_active"),
                rs.getInt("price_from"),
                rs.getString("area"),
                rs.getString("city"),
                rs.getString("state"),
                rs.getBigDecimal("latitude_approx"),
                rs.getBigDecimal("longitude_approx"),
                rs.getInt("request_count"),
                rs.getInt("profile_views"),
                rs.getInt("profile_completeness"),
                toInstant(rs.getTimestamp("created_at")),
                rs.getBigDecimal("distance_km")
        );
    }

    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception exception) {
            return List.of();
        }
    }

    private static String orderBy(String sort, boolean hasCoordinates) {
        String value = sort == null ? "recommended" : sort;
        return switch (value) {
            case "rating" -> "q.rating_average DESC, q.review_count DESC";
            case "price_low" -> "q.price_from ASC, q.rating_average DESC";
            case "newest" -> "q.created_at DESC";
            case "distance" -> hasCoordinates
                    ? "q.distance_km ASC, q.rating_average DESC"
                    : "q.rating_average DESC, q.review_count DESC";
            default -> "q.is_sponsored DESC, q.rating_average DESC, q.review_count DESC";
        };
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String initials(String name) {
        if (name == null || name.isBlank()) {
            return "CL";
        }
        String[] parts = name.trim().split("\\s+");
        StringBuilder initials = new StringBuilder();
        for (int index = 0; index < Math.min(parts.length, 2); index++) {
            initials.append(Character.toUpperCase(parts[index].charAt(0)));
        }
        return initials.toString();
    }

    private static double round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private static Double decimalToDouble(BigDecimal value) {
        return value == null ? null : value.doubleValue();
    }

    private static Integer nullableInt(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private static Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private static String toIsoString(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().toString();
    }

    public record ProfessionalRow(
            String id,
            String userId,
            String name,
            String avatarUrl,
            String categoryId,
            String categoryName,
            String categoryColor,
            String categorySoft,
            boolean regulated,
            String businessName,
            String headline,
            String profession,
            String bio,
            int experienceYears,
            String languagesJson,
            BigDecimal serviceRadiusKm,
            String availabilityStatus,
            String workingHoursJson,
            String nextSlot,
            String verificationStatus,
            boolean identityVerified,
            boolean qualificationVerified,
            BigDecimal ratingAverage,
            int reviewCount,
            int completedEnquiries,
            BigDecimal responseRate,
            String responseTime,
            boolean sponsored,
            boolean active,
            int priceFrom,
            String area,
            String city,
            String state,
            BigDecimal latitude,
            BigDecimal longitude,
            int requestCount,
            int profileViews,
            int profileCompleteness,
            Instant createdAt,
            BigDecimal distanceKm
    ) {
    }

    public record ProfileWrite(
            String id,
            String userId,
            String categoryId,
            String businessName,
            String headline,
            String profession,
            String bio,
            int experienceYears,
            String languagesJson,
            BigDecimal serviceRadiusKm,
            String availabilityStatus,
            String workingHoursJson,
            String nextSlot,
            int priceFrom,
            String area,
            String city,
            String state,
            BigDecimal latitude,
            BigDecimal longitude,
            int profileCompleteness
    ) {
    }

    private record ContactRow(String professionalId, String channel, String value, boolean publicValue) {
    }

    private static final class ContactInfo {
        private final Map<String, String> values = new LinkedHashMap<>();
        private final Map<String, Boolean> visibility = new LinkedHashMap<>();

        private void add(String channel, String value, boolean publicValue) {
            values.put(channel, value);
            visibility.put(channel, publicValue);
        }

        private String value(String channel) {
            return values.get(channel);
        }

        private String publicValue(String channel) {
            return Boolean.TRUE.equals(visibility.get(channel)) ? values.get(channel) : null;
        }

        private Map<String, Boolean> visibility() {
            Map<String, Boolean> result = new LinkedHashMap<>();
            result.put("phone", Boolean.TRUE.equals(visibility.get("phone")));
            result.put("email", Boolean.TRUE.equals(visibility.get("email")));
            result.put("whatsapp", Boolean.TRUE.equals(visibility.get("whatsapp")));
            result.put("social", Boolean.TRUE.equals(visibility.get("instagram"))
                    || Boolean.TRUE.equals(visibility.get("linkedin"))
                    || Boolean.TRUE.equals(visibility.get("facebook"))
                    || Boolean.TRUE.equals(visibility.get("website")));
            return result;
        }
    }
}
