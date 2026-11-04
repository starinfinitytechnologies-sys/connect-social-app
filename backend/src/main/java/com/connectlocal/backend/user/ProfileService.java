package com.connectlocal.backend.user;

import com.connectlocal.backend.common.ApiException;
import com.connectlocal.backend.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse get(UserPrincipal principal) {
        return UserResponse.from(requireUser(principal.id()));
    }

    @Transactional
    public UserResponse update(UserPrincipal principal, UpdateProfileRequest request) {
        UserAccount current = requireUser(principal.id());

        UserAccount updated = new UserAccount(
                current.id(),
                current.email(),
                current.passwordHash(),
                current.role(),
                valueOr(current.fullName(), request.fullName()),
                valueOr(current.displayName(), request.displayName()),
                valueOr(current.avatarUrl(), request.avatarUrl()),
                valueOr(current.city(), request.city()),
                valueOr(current.state(), request.state()),
                valueOr(current.area(), request.area()),
                valueOr(current.phone(), request.phone()),
                current.phoneVerified(),
                current.enabled(),
                current.createdAt(),
                current.updatedAt()
        );

        if (updated.fullName() == null || updated.fullName().isBlank()) {
            throw ApiException.badRequest("Full name cannot be empty.");
        }

        userRepository.updateProfile(updated);
        return UserResponse.from(requireUser(principal.id()));
    }

    public UserAccount requireUser(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.unauthorized("Your account could not be found."));
    }

    private static String valueOr(String current, String next) {
        return next == null ? current : next.trim();
    }
}
