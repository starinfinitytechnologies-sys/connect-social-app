package com.connectlocal.backend.enquiry;

public record EnquiryResponse(
        String id,
        String customerId,
        String professionalId,
        String professionalName,
        String serviceId,
        String serviceName,
        String message,
        String status,
        String createdAt,
        String updatedAt
) {
}
