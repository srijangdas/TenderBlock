package icu.telepathystudios.puretender.config;

import java.time.Instant;
import java.util.List;

public record ApiSecurityError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        String method,
        String principal,
        List<String> authorities
) {}
