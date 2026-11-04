package com.connectlocal.backend.professional;

import com.connectlocal.backend.common.PageResponse;
import com.connectlocal.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/professionals")
public class ProfessionalController {

    private final ProfessionalProfileService professionalProfileService;

    public ProfessionalController(ProfessionalProfileService professionalProfileService) {
        this.professionalProfileService = professionalProfileService;
    }

    @GetMapping
    public PageResponse<ProfessionalSummaryResponse> search(
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String subcategoryId,
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(defaultValue = "recommended") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return professionalProfileService.search(new ProfessionalQuery(
                categoryId, subcategoryId, query, city, lat, lng, radiusKm, sort, page, size
        ));
    }

    @GetMapping("/me")
    public ProfessionalDetailResponse mine(@AuthenticationPrincipal UserPrincipal principal) {
        return professionalProfileService.getMine(principal);
    }

    @GetMapping("/{id}")
    public ProfessionalDetailResponse detail(@PathVariable String id) {
        return professionalProfileService.getDetail(id);
    }

    @PostMapping("/onboard")
    @ResponseStatus(HttpStatus.CREATED)
    public ProfessionalDetailResponse onboard(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProfessionalProfileRequest request
    ) {
        return professionalProfileService.onboard(principal, request);
    }

    @PutMapping("/me")
    public ProfessionalDetailResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProfessionalProfileRequest request
    ) {
        return professionalProfileService.updateMine(principal, request);
    }
}
