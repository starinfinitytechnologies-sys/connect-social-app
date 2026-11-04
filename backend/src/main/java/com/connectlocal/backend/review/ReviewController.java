package com.connectlocal.backend.review;

import com.connectlocal.backend.professional.ReviewResponse;
import com.connectlocal.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/professionals/{professionalId}/reviews")
    public List<ReviewResponse> list(@PathVariable String professionalId) {
        return reviewService.listForProfessional(professionalId);
    }

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewItemResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        return reviewService.create(principal, request);
    }
}
