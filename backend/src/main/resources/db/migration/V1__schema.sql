CREATE TABLE users (
    id CHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    full_name VARCHAR(120) NOT NULL,
    display_name VARCHAR(80),
    avatar_url VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    area VARCHAR(120),
    phone VARCHAR(30),
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    CONSTRAINT chk_users_role CHECK (role IN ('customer', 'professional', 'admin'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE refresh_tokens (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_refresh_tokens_hash (token_hash),
    KEY idx_refresh_tokens_user (user_id, expires_at),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE categories (
    id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    icon VARCHAR(80),
    color VARCHAR(20),
    soft_color VARCHAR(20),
    regulated BOOLEAN NOT NULL DEFAULT FALSE,
    disclaimer TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE subcategories (
    id VARCHAR(60) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_subcategories_category (category_id),
    CONSTRAINT fk_subcategories_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE professional_profiles (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    business_name VARCHAR(160),
    headline VARCHAR(160),
    profession VARCHAR(120) NOT NULL,
    bio TEXT,
    experience_years INT NOT NULL DEFAULT 0,
    languages JSON NOT NULL,
    service_radius_km DECIMAL(6, 2) NOT NULL DEFAULT 10.00,
    availability_status VARCHAR(30) NOT NULL DEFAULT 'available_this_week',
    working_hours JSON NOT NULL,
    next_slot VARCHAR(80),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified',
    identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    qualification_verified BOOLEAN NOT NULL DEFAULT FALSE,
    rating_average DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    review_count INT NOT NULL DEFAULT 0,
    completed_enquiries INT NOT NULL DEFAULT 0,
    response_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    response_time VARCHAR(50),
    is_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    price_from INT NOT NULL DEFAULT 0,
    area VARCHAR(120),
    city VARCHAR(100),
    state VARCHAR(100),
    latitude_approx DECIMAL(9, 6),
    longitude_approx DECIMAL(9, 6),
    request_count INT NOT NULL DEFAULT 0,
    profile_views INT NOT NULL DEFAULT 0,
    profile_completeness INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_professional_profiles_user (user_id),
    KEY idx_professional_profiles_category (category_id),
    KEY idx_professional_profiles_active (is_active),
    KEY idx_professional_profiles_rating (rating_average DESC),
    KEY idx_professional_profiles_city (city),
    CONSTRAINT fk_professional_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_professional_profiles_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT chk_professional_experience CHECK (experience_years BETWEEN 0 AND 80),
    CONSTRAINT chk_professional_radius CHECK (service_radius_km > 0),
    CONSTRAINT chk_professional_rating CHECK (rating_average BETWEEN 0 AND 5),
    CONSTRAINT chk_professional_response_rate CHECK (response_rate BETWEEN 0 AND 100),
    CONSTRAINT chk_professional_verification CHECK (
        verification_status IN ('unverified', 'pending', 'verified', 'rejected')
    ),
    CONSTRAINT chk_professional_availability CHECK (
        availability_status IN ('available_now', 'available_today', 'available_this_week', 'busy', 'away')
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE professional_subcategories (
    professional_id CHAR(36) NOT NULL,
    subcategory_id VARCHAR(60) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (professional_id, subcategory_id),
    KEY idx_professional_subcategories_subcategory (subcategory_id),
    CONSTRAINT fk_professional_subcategories_profile FOREIGN KEY (professional_id) REFERENCES professional_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_professional_subcategories_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE professional_services (
    id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    price_inr INT NOT NULL DEFAULT 0,
    price_type VARCHAR(20) NOT NULL DEFAULT 'from',
    duration VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_professional_services_profile (professional_id),
    CONSTRAINT fk_professional_services_profile FOREIGN KEY (professional_id) REFERENCES professional_profiles (id) ON DELETE CASCADE,
    CONSTRAINT chk_professional_services_price CHECK (price_inr >= 0),
    CONSTRAINT chk_professional_services_price_type CHECK (price_type IN ('from', 'fixed', 'visit', 'monthly'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE professional_service_areas (
    id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    label VARCHAR(120) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    latitude_approx DECIMAL(9, 6),
    longitude_approx DECIMAL(9, 6),
    radius_km DECIMAL(6, 2) NOT NULL DEFAULT 10.00,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_professional_service_areas_profile (professional_id),
    KEY idx_professional_service_areas_city (city),
    CONSTRAINT fk_professional_service_areas_profile FOREIGN KEY (professional_id) REFERENCES professional_profiles (id) ON DELETE CASCADE,
    CONSTRAINT chk_professional_service_areas_radius CHECK (radius_km > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE professional_contacts (
    id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    value VARCHAR(255) NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_professional_contacts_channel (professional_id, channel),
    CONSTRAINT fk_professional_contacts_profile FOREIGN KEY (professional_id) REFERENCES professional_profiles (id) ON DELETE CASCADE,
    CONSTRAINT chk_professional_contacts_channel CHECK (
        channel IN ('phone', 'email', 'whatsapp', 'instagram', 'linkedin', 'facebook', 'website')
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE professional_education (
    id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    degree VARCHAR(160) NOT NULL,
    institute VARCHAR(160) NOT NULL,
    graduation_year INT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_professional_education_profile (professional_id),
    CONSTRAINT fk_professional_education_profile FOREIGN KEY (professional_id) REFERENCES professional_profiles (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE professional_certifications (
    id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    title VARCHAR(160) NOT NULL,
    issuer VARCHAR(160) NOT NULL,
    certification_year INT,
    document_url VARCHAR(500),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_professional_certifications_profile (professional_id),
    CONSTRAINT fk_professional_certifications_profile FOREIGN KEY (professional_id) REFERENCES professional_profiles (id) ON DELETE CASCADE,
    CONSTRAINT chk_professional_certifications_verification CHECK (
        verification_status IN ('unverified', 'pending', 'verified', 'rejected')
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE portfolio_items (
    id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    category_label VARCHAR(100),
    sort_order INT NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_portfolio_items_profile (professional_id),
    CONSTRAINT fk_portfolio_items_profile FOREIGN KEY (professional_id) REFERENCES professional_profiles (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE saved_profiles (
    user_id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, professional_id),
    KEY idx_saved_profiles_professional (professional_id),
    CONSTRAINT fk_saved_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_profiles_professional FOREIGN KEY (professional_id) REFERENCES professional_profiles (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE blocked_users (
    user_id CHAR(36) NOT NULL,
    blocked_user_id CHAR(36) NOT NULL,
    reason VARCHAR(255),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, blocked_user_id),
    KEY idx_blocked_users_blocked (blocked_user_id),
    CONSTRAINT fk_blocked_users_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_blocked_users_blocked FOREIGN KEY (blocked_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_blocked_users_no_self CHECK (user_id <> blocked_user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE connections (
    id CHAR(36) NOT NULL,
    requester_id CHAR(36) NOT NULL,
    recipient_id CHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    message VARCHAR(500),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    responded_at DATETIME(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_connections_requester (requester_id),
    KEY idx_connections_recipient (recipient_id),
    KEY idx_connections_status (status),
    CONSTRAINT fk_connections_requester FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_connections_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_connections_no_self CHECK (requester_id <> recipient_id),
    CONSTRAINT chk_connections_status CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE enquiries (
    id CHAR(36) NOT NULL,
    customer_id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    service_id CHAR(36),
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'recorded',
    metadata JSON NOT NULL,
    responded_at DATETIME(6),
    closed_at DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_enquiries_customer (customer_id, created_at DESC),
    KEY idx_enquiries_professional (professional_id, created_at DESC),
    KEY idx_enquiries_status (status),
    CONSTRAINT fk_enquiries_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_enquiries_professional FOREIGN KEY (professional_id) REFERENCES professional_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_enquiries_service FOREIGN KEY (service_id) REFERENCES professional_services (id) ON DELETE SET NULL,
    CONSTRAINT chk_enquiries_status CHECK (
        status IN ('recorded', 'delivered', 'responded', 'closed', 'cancelled')
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE conversations (
    id CHAR(36) NOT NULL,
    connection_id CHAR(36) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    last_message_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_conversations_connection (connection_id),
    KEY idx_conversations_last_message (last_message_at DESC),
    CONSTRAINT fk_conversations_connection FOREIGN KEY (connection_id) REFERENCES connections (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE messages (
    id CHAR(36) NOT NULL,
    conversation_id CHAR(36) NOT NULL,
    sender_id CHAR(36) NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    body TEXT,
    attachment_url VARCHAR(500),
    read_at DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_messages_conversation (conversation_id, created_at),
    KEY idx_messages_sender (sender_id),
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_messages_type CHECK (message_type IN ('text', 'image', 'file', 'system')),
    CONSTRAINT chk_messages_body CHECK (
        message_type <> 'text' OR (body IS NOT NULL AND CHAR_LENGTH(body) BETWEEN 1 AND 4000)
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE reviews (
    id CHAR(36) NOT NULL,
    enquiry_id CHAR(36) NOT NULL,
    customer_id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    rating INT NOT NULL,
    body TEXT,
    verified_interaction BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_reviews_enquiry (enquiry_id),
    KEY idx_reviews_professional (professional_id, created_at DESC),
    KEY idx_reviews_customer (customer_id),
    KEY idx_reviews_status (status),
    CONSTRAINT fk_reviews_enquiry FOREIGN KEY (enquiry_id) REFERENCES enquiries (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_professional FOREIGN KEY (professional_id) REFERENCES professional_profiles (id) ON DELETE CASCADE,
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_status CHECK (status IN ('pending', 'published', 'rejected'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE review_responses (
    review_id CHAR(36) NOT NULL,
    professional_id CHAR(36) NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (review_id),
    CONSTRAINT fk_review_responses_review FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE,
    CONSTRAINT fk_review_responses_professional FOREIGN KEY (professional_id) REFERENCES professional_profiles (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE reports (
    id CHAR(36) NOT NULL,
    reporter_id CHAR(36) NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id CHAR(36) NOT NULL,
    reason VARCHAR(120) NOT NULL,
    details TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by CHAR(36),
    reviewed_at DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_reports_reporter (reporter_id),
    KEY idx_reports_status (status, created_at),
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_reports_target_type CHECK (target_type IN ('profile', 'enquiry', 'message', 'review')),
    CONSTRAINT chk_reports_status CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE plans (
    id VARCHAR(30) NOT NULL,
    name VARCHAR(80) NOT NULL,
    tagline VARCHAR(255),
    monthly_price_inr INT NOT NULL DEFAULT 0,
    annual_price_inr INT NOT NULL DEFAULT 0,
    limits JSON NOT NULL,
    features JSON NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE credit_packs (
    id VARCHAR(30) NOT NULL,
    credits INT NOT NULL,
    price_inr INT NOT NULL,
    label VARCHAR(80) NOT NULL,
    description VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT chk_credit_packs_credits CHECK (credits > 0),
    CONSTRAINT chk_credit_packs_price CHECK (price_inr >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE subscriptions (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    plan_id VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    current_period_start DATETIME(6),
    current_period_end DATETIME(6),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    provider VARCHAR(20),
    provider_subscription_id VARCHAR(120),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_subscriptions_user (user_id, status),
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans (id),
    CONSTRAINT chk_subscriptions_status CHECK (
        status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE credit_ledger (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    delta INT NOT NULL,
    reason VARCHAR(80) NOT NULL,
    reference_type VARCHAR(40),
    reference_id CHAR(36),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_credit_ledger_user (user_id, created_at DESC),
    CONSTRAINT fk_credit_ledger_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE payments (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    provider VARCHAR(20) NOT NULL DEFAULT 'razorpay',
    provider_order_id VARCHAR(120),
    provider_payment_id VARCHAR(120),
    amount_inr INT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'created',
    purpose_type VARCHAR(30) NOT NULL,
    purpose_id VARCHAR(60),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_payments_provider_payment (provider_payment_id),
    KEY idx_payments_user (user_id, created_at DESC),
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_payments_status CHECK (
        status IN ('created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded')
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE payment_events (
    id CHAR(36) NOT NULL,
    provider_event_id VARCHAR(120) NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    payload JSON NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_payment_events_provider (provider_event_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE platform_settings (
    setting_key VARCHAR(80) NOT NULL,
    value JSON NOT NULL,
    description VARCHAR(255),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (setting_key)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE audit_logs (
    id CHAR(36) NOT NULL,
    actor_id CHAR(36),
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(80),
    metadata JSON NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_audit_logs_actor (actor_id, created_at DESC),
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
