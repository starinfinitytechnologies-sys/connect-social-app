package com.connectlocal.backend.saved;

import com.connectlocal.backend.professional.ProfessionalDetailResponse;
import com.connectlocal.backend.professional.ProfessionalRepository;
import com.connectlocal.backend.professional.ProfessionalSummaryResponse;
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
@RequestMapping("/api/saved")
public class SavedController {

    private final SavedRepository savedRepository;
    private final ProfessionalRepository professionalRepository;

    public SavedController(
            SavedRepository savedRepository,
            ProfessionalRepository professionalRepository
    ) {
        this.savedRepository = savedRepository;
        this.professionalRepository = professionalRepository;
    }

    @GetMapping
    public List<ProfessionalSummaryResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return savedRepository.listProfessionalIds(principal.id()).stream()
                .map(professionalRepository::findDetail)
                .flatMap(java.util.Optional::stream)
                .map(ProfessionalDetailResponse::profile)
                .toList();
    }

    @PostMapping("/{professionalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String professionalId
    ) {
        savedRepository.save(principal.id(), professionalId);
    }

    @DeleteMapping("/{professionalId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String professionalId
    ) {
        savedRepository.remove(principal.id(), professionalId);
    }
}
