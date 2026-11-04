package com.connectlocal.backend.review;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reviews")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

    private final ReviewService reviewService;

    public AdminReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<AdminReviewRow> list(@RequestParam(required = false) String status) {
        return reviewService.listForModeration(status);
    }

    @PatchMapping("/{reviewId}")
    public AdminReviewRow moderate(
            @PathVariable String reviewId,
            @Valid @RequestBody ModerateReviewRequest request
    ) {
        return reviewService.moderate(reviewId, request.status());
    }
}
