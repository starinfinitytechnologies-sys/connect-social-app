package com.connectlocal.backend.blocked;

import com.connectlocal.backend.common.ApiException;
import com.connectlocal.backend.professional.ProfessionalRepository;
import com.connectlocal.backend.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/blocked")
public class BlockedController {

    private final BlockedRepository blockedRepository;
    private final ProfessionalRepository professionalRepository;

    public BlockedController(
            BlockedRepository blockedRepository,
            ProfessionalRepository professionalRepository
    ) {
        this.blockedRepository = blockedRepository;
        this.professionalRepository = professionalRepository;
    }

    @GetMapping
    public List<String> list(@AuthenticationPrincipal UserPrincipal principal) {
        return blockedRepository.listProfessionalIds(principal.id());
    }

    @PostMapping("/{professionalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void block(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String professionalId
    ) {
        String blockedUserId = professionalRepository.findUserIdById(professionalId)
                .orElseThrow(() -> ApiException.notFound("Professional profile not found."));
        if (blockedUserId.equals(principal.id())) {
            throw ApiException.badRequest("You cannot block your own profile.");
        }
        blockedRepository.block(principal.id(), blockedUserId, null);
    }

    @DeleteMapping("/{professionalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblock(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String professionalId
    ) {
        String blockedUserId = professionalRepository.findUserIdById(professionalId)
                .orElseThrow(() -> ApiException.notFound("Professional profile not found."));
        blockedRepository.unblock(principal.id(), blockedUserId);
    }
}
