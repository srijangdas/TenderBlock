package icu.telepathystudios.puretender.dto.admin;

import icu.telepathystudios.puretender.model.AccountStatus;
import icu.telepathystudios.puretender.model.Role;

import java.time.Instant;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String fullName,
        String email,
        Role role,
        AccountStatus status,
        Instant createdAt
) {}
