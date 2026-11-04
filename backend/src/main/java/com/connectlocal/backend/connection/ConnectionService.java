package com.connectlocal.backend.connection;

import com.connectlocal.backend.blocked.BlockedRepository;
import com.connectlocal.backend.chat.ConversationRepository;
import com.connectlocal.backend.common.ApiException;
import com.connectlocal.backend.professional.ProfessionalRepository;
import com.connectlocal.backend.security.UserPrincipal;
import com.connectlocal.backend.user.UserAccount;
import com.connectlocal.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ConnectionService {

    private final ConnectionRepository connectionRepository;
    private final ConversationRepository conversationRepository;
    private final ProfessionalRepository professionalRepository;
    private final UserRepository userRepository;
    private final BlockedRepository blockedRepository;

    public ConnectionService(
            ConnectionRepository connectionRepository,
            ConversationRepository conversationRepository,
            ProfessionalRepository professionalRepository,
            UserRepository userRepository,
            BlockedRepository blockedRepository
    ) {
        this.connectionRepository = connectionRepository;
        this.conversationRepository = conversationRepository;
        this.professionalRepository = professionalRepository;
        this.userRepository = userRepository;
        this.blockedRepository = blockedRepository;
    }

    public List<ConnectionResponse> list(UserPrincipal principal) {
        return connectionRepository.listForUser(principal.id()).stream()
                .map(row -> toResponse(row, principal.id()))
                .toList();
    }

    @Transactional
    public ConnectionResponse create(UserPrincipal principal, CreateConnectionRequest request) {
        String recipientId = professionalRepository.findUserIdById(request.professionalId())
                .orElseThrow(() -> ApiException.notFound("Professional profile not found."));

        if (recipientId.equals(principal.id())) {
            throw ApiException.badRequest("You cannot connect with your own profile.");
        }

        if (blockedRepository.isBlockedBetween(principal.id(), recipientId)) {
            throw ApiException.forbidden("This connection is not available.");
        }

        if (connectionRepository.hasActiveConnection(principal.id(), recipientId)) {
            throw ApiException.conflict("A connection request already exists.");
        }

        String id = connectionRepository.insert(
                principal.id(),
                recipientId,
                trimToNull(request.message())
        );

        return connectionRepository.findById(id)
                .map(row -> toResponse(row, principal.id()))
                .orElseThrow(() -> ApiException.conflict("The connection could not be created."));
    }

    @Transactional
    public ConnectionResponse update(
            UserPrincipal principal,
            String connectionId,
            String nextStatus
    ) {
        ConnectionRepository.ConnectionRow connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> ApiException.notFound("Connection not found."));

        boolean requester = connection.requesterId().equals(principal.id());
        boolean recipient = connection.recipientId().equals(principal.id());

        if (!requester && !recipient && !principal.isAdmin()) {
            throw ApiException.forbidden("You are not part of this connection.");
        }

        String currentStatus = connection.status();
        String status = nextStatus.toLowerCase();

        if ("pending".equals(currentStatus)) {
            if (("accepted".equals(status) || "declined".equals(status)) && !recipient && !principal.isAdmin()) {
                throw ApiException.forbidden("Only the recipient can accept or decline this request.");
            }
            if (!List.of("accepted", "declined", "cancelled").contains(status)) {
                throw ApiException.badRequest("Unsupported connection status.");
            }
        } else if ("accepted".equals(currentStatus)) {
            if (!"cancelled".equals(status)) {
                throw ApiException.badRequest("Only cancellation is allowed after acceptance.");
            }
        } else {
            throw ApiException.badRequest("This connection can no longer be changed.");
        }

        connectionRepository.updateStatus(connectionId, status);

        if ("accepted".equals(status)) {
            conversationRepository.createForConnection(connectionId);
        }

        return connectionRepository.findById(connectionId)
                .map(row -> toResponse(row, principal.id()))
                .orElseThrow(() -> ApiException.notFound("Connection not found."));
    }

    private ConnectionResponse toResponse(ConnectionRepository.ConnectionRow row, String currentUserId) {
        boolean incoming = row.recipientId().equals(currentUserId);
        String otherUserId = incoming ? row.requesterId() : row.recipientId();
        UserAccount other = userRepository.findById(otherUserId).orElse(null);
        var professional = professionalRepository.findSummaryByUserId(otherUserId).orElse(null);

        return new ConnectionResponse(
                row.id(),
                otherUserId,
                other == null
                        ? null
                        : (other.displayName() == null ? other.fullName() : other.displayName()),
                professional == null ? null : professional.id(),
                professional,
                row.status(),
                incoming ? "incoming" : "outgoing",
                row.message(),
                row.createdAt() == null ? null : row.createdAt().toString()
        );
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
