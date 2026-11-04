package com.connectlocal.backend.enquiry;

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
@RequestMapping("/api/enquiries")
public class EnquiryController {

    private final EnquiryService enquiryService;

    public EnquiryController(EnquiryService enquiryService) {
        this.enquiryService = enquiryService;
    }

    @GetMapping
    public List<EnquiryResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return enquiryService.list(principal);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EnquiryResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateEnquiryRequest request
    ) {
        return enquiryService.create(principal, request);
    }

    @PatchMapping("/{enquiryId}")
    public EnquiryResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String enquiryId,
            @Valid @RequestBody UpdateEnquiryStatusRequest request
    ) {
        return enquiryService.update(principal, enquiryId, request.status());
    }
}
