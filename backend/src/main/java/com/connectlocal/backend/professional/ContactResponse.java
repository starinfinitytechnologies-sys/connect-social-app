package com.connectlocal.backend.professional;

import java.util.Map;

public record ContactResponse(
        String email,
        String phone,
        String whatsapp,
        String instagram,
        String linkedin,
        String facebook,
        String website,
        Map<String, Boolean> visibility
) {
}
