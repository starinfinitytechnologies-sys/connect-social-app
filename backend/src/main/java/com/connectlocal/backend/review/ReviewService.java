package com.connectlocal.backend.review;

import com.connectlocal.backend.common.ApiException;
import com.connectlocal.backend.professional.ProfessionalDetailResponse;
import com.connectlocal.backend.professional.ProfessionalRepository;
import com.connectlocal.backend.professional.ReviewResponse;
import com.connectlocal.backend.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProfessionalRepository professionalRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            ProfessionalRepository professionalRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.professionalRepository = professionalRepository;
    }

    public List<ReviewResponse> listForProfessional(String professionalId) {
        return professionalRepository.findDetail(professionalId)
                .map(ProfessionalDetailResponse::reviews)
                .orElseThrow(() -> ApiException.notFound("Professional profile not found."));
    }

    public List<AdminReviewRow> listForModeration(String status) {
        return reviewRepository.listByStatus(status == null || status.isBlank() ? null : status);
    }

    @Transactional
    public AdminReviewRow moderate(String reviewId, String status) {
        String professionalId = reviewRepository.updateStatus(reviewId, status);
        reviewRepository.syncRating(professionalId);

        return reviewRepository.listByStatus(null).stream()
                .filter(row -> row.id().equals(reviewId))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("Review not found."));
    }

    @Transactional
    public ReviewItemResponse create(UserPrincipal principal, CreateReviewRequest request) {
        ReviewRepository.EnquiryReviewInfo enquiry = reviewRepository.findEnquiryInfo(request.enquiryId())
                .orElseThrow(() -> ApiException.notFound("Enquiry not found."));

        if (!enquiry.customerId().equals(principal.id())) {
            throw ApiException.forbidden("Only the customer on this enquiry can leave a review.");
        }

        if (!List.of("responded", "closed").contains(enquiry.status())) {
            throw ApiException.badRequest("You can review an enquiry after the professional responds.");
        }

        if (reviewRepository.existsForEnquiry(request.enquiryId())) {
            throw ApiException.conflict("A review already exists for this enquiry.");
        }

        String id = reviewRepository.insert(
                request.enquiryId(),
                principal.id(),
                enquiry.professionalId(),
                request.rating(),
                request.body() == null ? null : request.body().trim()
        );

        return reviewRepository.findById(id)
                .orElseThrow(() -> ApiException.conflict("The review could not be created."));
    }
}
