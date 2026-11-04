package com.connectlocal.backend.enquiry;

import com.connectlocal.backend.blocked.BlockedRepository;
import com.connectlocal.backend.common.ApiException;
import com.connectlocal.backend.professional.ProfessionalRepository;
import com.connectlocal.backend.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EnquiryService {

    private final EnquiryRepository enquiryRepository;
    private final ProfessionalRepository professionalRepository;
    private final BlockedRepository blockedRepository;

    public EnquiryService(
            EnquiryRepository enquiryRepository,
            ProfessionalRepository professionalRepository,
            BlockedRepository blockedRepository
    ) {
        this.enquiryRepository = enquiryRepository;
        this.professionalRepository = professionalRepository;
        this.blockedRepository = blockedRepository;
    }

    public List<EnquiryResponse> list(UserPrincipal principal) {
        List<EnquiryRepository.EnquiryRow> rows = principal.isProfessional()
                ? professionalRepository.findRowByUserId(principal.id())
                        .map(row -> enquiryRepository.listForProfessional(row.id()))
                        .orElse(List.of())
                : enquiryRepository.listForCustomer(principal.id());

        return rows.stream().map(EnquiryService::toResponse).toList();
    }

    @Transactional
    public EnquiryResponse create(UserPrincipal principal, CreateEnquiryRequest request) {
        String professionalUserId = professionalRepository.findUserIdById(request.professionalId())
                .orElseThrow(() -> ApiException.notFound("Professional profile not found."));

        if (professionalUserId.equals(principal.id())) {
            throw ApiException.badRequest("You cannot send an enquiry to your own profile.");
        }

        if (blockedRepository.isBlockedBetween(principal.id(), professionalUserId)) {
            throw ApiException.forbidden("This professional is not available for enquiries.");
        }

        if (request.serviceId() != null
                && !enquiryRepository.serviceBelongsToProfessional(
                        request.serviceId(), request.professionalId())) {
            throw ApiException.badRequest("That service does not belong to the selected professional.");
        }

        String id = enquiryRepository.insert(
                principal.id(),
                request.professionalId(),
                request.serviceId(),
                request.message().trim()
        );

        return enquiryRepository.findById(id)
                .map(EnquiryService::toResponse)
                .orElseThrow(() -> ApiException.conflict("The enquiry could not be created."));
    }

    @Transactional
    public EnquiryResponse update(UserPrincipal principal, String enquiryId, String nextStatus) {
        EnquiryRepository.EnquiryRow enquiry = enquiryRepository.findById(enquiryId)
                .orElseThrow(() -> ApiException.notFound("Enquiry not found."));

        String status = nextStatus.toLowerCase();
        boolean customer = enquiry.customerId().equals(principal.id());
        boolean professional = principal.isProfessional()
                && professionalRepository.findRowByUserId(principal.id())
                .map(row -> row.id().equals(enquiry.professionalId()))
                .orElse(false);

        if (!customer && !professional && !principal.isAdmin()) {
            throw ApiException.forbidden("You are not part of this enquiry.");
        }

        if (customer && !principal.isAdmin()) {
            if (!"cancelled".equals(status)
                    || !List.of("recorded", "delivered").contains(enquiry.status())) {
                throw ApiException.forbidden("You can only cancel an enquiry before it is answered.");
            }
        }

        if (professional && !principal.isAdmin()) {
            if (!List.of("delivered", "responded", "closed").contains(status)) {
                throw ApiException.badRequest("Unsupported enquiry status.");
            }
            if (List.of("cancelled", "closed").contains(enquiry.status())) {
                throw ApiException.badRequest("This enquiry can no longer be changed.");
            }
        }

        enquiryRepository.updateStatus(enquiryId, status);
        return enquiryRepository.findById(enquiryId)
                .map(EnquiryService::toResponse)
                .orElseThrow(() -> ApiException.notFound("Enquiry not found."));
    }

    private static EnquiryResponse toResponse(EnquiryRepository.EnquiryRow row) {
        return new EnquiryResponse(
                row.id(),
                row.customerId(),
                row.professionalId(),
                row.professionalName(),
                row.serviceId(),
                row.serviceName(),
                row.message(),
                row.status(),
                row.createdAt(),
                row.updatedAt()
        );
    }
}
