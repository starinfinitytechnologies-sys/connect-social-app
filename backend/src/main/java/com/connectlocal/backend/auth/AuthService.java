package com.connectlocal.backend.auth;

import com.connectlocal.backend.common.ApiException;
import com.connectlocal.backend.common.Ids;
import com.connectlocal.backend.config.JwtProperties;
import com.connectlocal.backend.security.JwtService;
import com.connectlocal.backend.security.UserPrincipal;
import com.connectlocal.backend.user.UserAccount;
import com.connectlocal.backend.user.UserRepository;
import com.connectlocal.backend.user.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());

        if (userRepository.emailExists(email)) {
            throw ApiException.conflict("An account already exists for this email.");
        }

        UserAccount account = new UserAccount(
                Ids.newId(),
                email,
                passwordEncoder.encode(request.password()),
                "customer",
                request.fullName().trim(),
                null,
                null,
                trimToNull(request.city()),
                trimToNull(request.state()),
                trimToNull(request.area()),
                trimToNull(request.phone()),
                false,
                true,
                null,
                null
        );

        userRepository.insert(account);
        UserAccount created = userRepository.findById(account.id())
                .orElseThrow(() -> ApiException.conflict("The account could not be created."));
        return issueTokens(created);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        UserAccount account = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.unauthorized("The email or password is incorrect."));

        if (!account.enabled()) {
            throw ApiException.forbidden("This account has been disabled.");
        }

        if (!passwordEncoder.matches(request.password(), account.passwordHash())) {
            throw ApiException.unauthorized("The email or password is incorrect.");
        }

        return issueTokens(account);
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String hash = hashToken(rawRefreshToken);
        RefreshTokenRepository.StoredRefreshToken stored = refreshTokenRepository
                .findValidByHash(hash)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));

        UserAccount account = userRepository.findById(stored.userId())
                .orElseThrow(() -> ApiException.unauthorized("Your account could not be found."));

        if (!account.enabled()) {
            refreshTokenRepository.revokeByHash(hash);
            throw ApiException.forbidden("This account has been disabled.");
        }

        refreshTokenRepository.revokeByHash(hash);
        return issueTokens(account);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenRepository.revokeByHash(hashToken(rawRefreshToken));
        }
    }

    public UserResponse me(UserPrincipal principal) {
        return userRepository.findById(principal.id())
                .map(UserResponse::from)
                .orElseThrow(() -> ApiException.unauthorized("Your account could not be found."));
    }

    private AuthResponse issueTokens(UserAccount account) {
        UserPrincipal principal = new UserPrincipal(account.id(), account.email(), account.role());
        String accessToken = jwtService.createAccessToken(principal);
        String refreshToken = generateRefreshToken();
        Instant expiresAt = Instant.now().plus(jwtProperties.refreshTokenDays(), ChronoUnit.DAYS);

        refreshTokenRepository.insert(
                Ids.newId(),
                account.id(),
                hashToken(refreshToken),
                expiresAt
        );

        return new AuthResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtService.accessTokenSeconds(),
                UserResponse.from(account)
        );
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
