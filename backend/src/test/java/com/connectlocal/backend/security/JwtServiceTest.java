package com.connectlocal.backend.security;

import com.connectlocal.backend.config.JwtProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    @Test
    void createsAndParsesAccessToken() {
        JwtService service = new JwtService(new JwtProperties(
                "connect-local-test-secret-change-me-32-chars-minimum",
                60,
                7
        ));

        UserPrincipal principal = new UserPrincipal("user-1", "user@example.com", "professional");
        String token = service.createAccessToken(principal);
        UserPrincipal parsed = service.parseAccessToken(token);

        assertThat(parsed).isEqualTo(principal);
        assertThat(service.accessTokenSeconds()).isEqualTo(3600);
    }

    @Test
    void rejectsMalformedToken() {
        JwtService service = new JwtService(new JwtProperties(
                "connect-local-test-secret-change-me-32-chars-minimum",
                60,
                7
        ));

        assertThat(service.parseAccessToken("not-a-token")).isNull();
    }
}
