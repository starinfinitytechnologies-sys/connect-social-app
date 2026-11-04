package com.connectlocal.backend.connection;

import com.connectlocal.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/connections")
public class ConnectionController {

    private final ConnectionService connectionService;

    public ConnectionController(ConnectionService connectionService) {
        this.connectionService = connectionService;
    }

    @GetMapping
    public List<ConnectionResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return connectionService.list(principal);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConnectionResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateConnectionRequest request
    ) {
        return connectionService.create(principal, request);
    }

    @PatchMapping("/{connectionId}")
    public ConnectionResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String connectionId,
            @Valid @RequestBody UpdateConnectionStatusRequest request
    ) {
        return connectionService.update(principal, connectionId, request.status());
    }
}
