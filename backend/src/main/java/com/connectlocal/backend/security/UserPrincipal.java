package com.connectlocal.backend.security;

public record UserPrincipal(String id, String email, String role) {

    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(role);
    }

    public boolean isProfessional() {
        return "professional".equalsIgnoreCase(role);
    }
}
