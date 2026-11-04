package com.connectlocal.backend.professional;

import com.connectlocal.backend.common.ApiException;
import com.connectlocal.backend.common.Ids;
import com.connectlocal.backend.common.PageResponse;
import com.connectlocal.backend.security.UserPrincipal;
import com.connectlocal.backend.user.UserAccount;
import com.connectlocal.backend.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ProfessionalProfileService {

    private static final Set<String> CONTACT_CHANNELS = Set.of(
            "phone", "email", "whatsapp", "instagram", "linkedin", "facebook", "website"
    );
    private static final Set<String> PRICE_TYPES = Set.of("from", "fixed", "visit", "monthly");

    private final ProfessionalRepository professionalRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ProfessionalProfileService(
            ProfessionalRepository professionalRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper
    ) {
        this.professionalRepository = professionalRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    public PageResponse<ProfessionalSummaryResponse> search(ProfessionalQuery query) {
        ProfessionalQuery normalized = new ProfessionalQuery(
                trimToNull(query.categoryId()),
                trimToNull(query.subcategoryId()),
                trimToNull(query.query()),
                trimToNull(query.city()),
                query.latitude(),
                query.longitude(),
                query.radiusKm(),
                query.sort(),
                query.page(),
                query.size()
        );
        return professionalRepository.search(normalized);
    }

    @Transactional
    public ProfessionalDetailResponse getDetail(String professionalId) {
        professionalRepository.incrementProfileViews(professionalId);
        return professionalRepository.findDetail(professionalId)
                .orElseThrow(() -> ApiException.notFound("Professional profile not found."));
    }

    public ProfessionalDetailResponse getMine(UserPrincipal principal) {
        ProfessionalRepository.ProfessionalRow row = professionalRepository
                .findRowByUserId(principal.id())
                .orElseThrow(() -> ApiException.notFound("You do not have a professional profile yet."));
        return professionalRepository.findDetail(row.id())
                .orElseThrow(() -> ApiException.notFound("Professional profile not found."));
    }

    @Transactional
    public ProfessionalDetailResponse onboard(UserPrincipal principal, ProfessionalProfileRequest request) {
        if (professionalRepository.existsByUserId(principal.id())) {
            throw ApiException.conflict("You already have a professional profile.");
        }

        validateRequest(request);
        String id = Ids.newId();
        ProfessionalRepository.ProfileWrite profile = toWrite(
                id,
                principal.id(),
                request,
                null,
                request.workingHours()
        );

        professionalRepository.insertProfile(profile);
        professionalRepository.replaceSubcategories(id, safeList(request.subcategoryIds()));
        professionalRepository.replaceServices(id, safeList(request.services()));
        professionalRepository.replaceContacts(id, safeList(request.contacts()));

        UserAccount account = userRepository.findById(principal.id())
                .orElseThrow(() -> ApiException.unauthorized("Your account could not be found."));
        if ("customer".equalsIgnoreCase(account.role())) {
            userRepository.updateRole(account.id(), "professional");
        }

        return professionalRepository.findDetail(id)
                .orElseThrow(() -> ApiException.notFound("Professional profile not found."));
    }

    @Transactional
    public ProfessionalDetailResponse updateMine(
            UserPrincipal principal,
            ProfessionalProfileRequest request
    ) {
        ProfessionalRepository.ProfessionalRow existing = professionalRepository
                .findRowByUserId(principal.id())
                .orElseThrow(() -> ApiException.notFound("You do not have a professional profile yet."));

        validateRequest(request);

        Map<String, String> workingHours = request.workingHours() == null
                ? professionalRepository.parseWorkingHours(existing.workingHoursJson())
                : request.workingHours();

        ProfessionalRepository.ProfileWrite profile = toWrite(
                existing.id(),
                principal.id(),
                request,
                existing,
                workingHours
        );

        professionalRepository.updateProfile(profile);

        if (request.subcategoryIds() != null) {
            professionalRepository.replaceSubcategories(existing.id(), request.subcategoryIds());
        }
        if (request.services() != null) {
            professionalRepository.replaceServices(existing.id(), request.services());
        }
        if (request.contacts() != null) {
            professionalRepository.replaceContacts(existing.id(), request.contacts());
        }

        return professionalRepository.findDetail(existing.id())
                .orElseThrow(() -> ApiException.notFound("Professional profile not found."));
    }

    private ProfessionalRepository.ProfileWrite toWrite(
            String id,
            String userId,
            ProfessionalProfileRequest request,
            ProfessionalRepository.ProfessionalRow existing,
            Map<String, String> workingHours
    ) {
        List<String> languages = request.languages() == null
                ? (existing == null ? List.of("English", "Hindi") : readLanguages(existing.languagesJson()))
                : request.languages();

        return new ProfessionalRepository.ProfileWrite(
                id,
                userId,
                request.categoryId(),
                valueOr(existing == null ? null : existing.businessName(), request.businessName()),
                valueOr(existing == null ? null : existing.headline(), request.headline()),
                request.profession().trim(),
                valueOr(existing == null ? null : existing.bio(), request.bio()),
                request.experienceYears() == null
                        ? (existing == null ? 0 : existing.experienceYears())
                        : request.experienceYears(),
                writeJson(languages),
                request.serviceRadiusKm() == null
                        ? (existing == null ? BigDecimal.TEN : existing.serviceRadiusKm())
                        : request.serviceRadiusKm(),
                valueOr(
                        existing == null ? "available_this_week" : existing.availabilityStatus(),
                        request.availabilityStatus()
                ),
                writeJson(workingHours == null ? defaultWorkingHours() : workingHours),
                valueOr(existing == null ? "This week" : existing.nextSlot(), request.nextSlot()),
                request.pricingFrom() == null
                        ? (existing == null ? 0 : existing.priceFrom())
                        : request.pricingFrom(),
                valueOr(existing == null ? null : existing.area(), request.area()),
                valueOr(existing == null ? null : existing.city(), request.city()),
                valueOr(existing == null ? null : existing.state(), request.state()),
                request.latitude() == null ? (existing == null ? null : existing.latitude()) : request.latitude(),
                request.longitude() == null ? (existing == null ? null : existing.longitude()) : request.longitude(),
                completeness(request, existing)
        );
    }

    private void validateRequest(ProfessionalProfileRequest request) {
        if (!professionalRepository.categoryExists(request.categoryId())) {
            throw ApiException.badRequest("Choose a valid service category.");
        }

        if (request.subcategoryIds() != null && !request.subcategoryIds().isEmpty()) {
            Set<String> allowed = Set.copyOf(
                    professionalRepository.findSubcategoryIdsForCategory(request.categoryId())
            );
            for (String subcategoryId : request.subcategoryIds()) {
                if (!allowed.contains(subcategoryId)) {
                    throw ApiException.badRequest(
                            "Subcategory " + subcategoryId + " does not belong to the selected category."
                    );
                }
            }
        }

        if (request.services() != null) {
            for (ServiceInput service : request.services()) {
                if (service.priceType() != null
                        && !PRICE_TYPES.contains(service.priceType().toLowerCase(Locale.ROOT))) {
                    throw ApiException.badRequest("Unsupported service price type.");
                }
            }
        }

        if (request.contacts() != null) {
            for (ContactInput contact : request.contacts()) {
                if (!CONTACT_CHANNELS.contains(contact.channel().toLowerCase(Locale.ROOT))) {
                    throw ApiException.badRequest("Unsupported contact channel: " + contact.channel());
                }
            }
        }
    }

    private int completeness(
            ProfessionalProfileRequest request,
            ProfessionalRepository.ProfessionalRow existing
    ) {
        List<Boolean> checks = new ArrayList<>();
        checks.add(hasText(request.profession()));
        checks.add(hasText(request.headline()));
        checks.add(hasText(request.bio()));
        checks.add(request.experienceYears() != null && request.experienceYears() > 0);
        checks.add(request.languages() != null && !request.languages().isEmpty());
        checks.add(request.pricingFrom() != null && request.pricingFrom() > 0);
        checks.add(request.area() != null || (existing != null && existing.area() != null));
        checks.add(request.city() != null || (existing != null && existing.city() != null));
        checks.add(request.services() != null && !request.services().isEmpty());
        checks.add(request.contacts() != null && !request.contacts().isEmpty());
        checks.add(request.subcategoryIds() != null && !request.subcategoryIds().isEmpty());

        long complete = checks.stream().filter(Boolean::booleanValue).count();
        return (int) Math.round((complete * 100.0) / checks.size());
    }

    private List<String> readLanguages(String json) {
        try {
            return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<>() {
            });
        } catch (Exception exception) {
            return List.of("English", "Hindi");
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Could not serialize profile data.", exception);
        }
    }

    private static Map<String, String> defaultWorkingHours() {
        Map<String, String> hours = new LinkedHashMap<>();
        hours.put("monday", "10:00 - 19:00");
        hours.put("tuesday", "10:00 - 19:00");
        hours.put("wednesday", "10:00 - 19:00");
        hours.put("thursday", "10:00 - 19:00");
        hours.put("friday", "10:00 - 19:00");
        hours.put("saturday", "10:00 - 14:00");
        hours.put("sunday", "Closed");
        return hours;
    }

    private static <T> List<T> safeList(List<T> value) {
        return value == null ? List.of() : value;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String valueOr(String current, String next) {
        return next == null ? current : next.trim();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
