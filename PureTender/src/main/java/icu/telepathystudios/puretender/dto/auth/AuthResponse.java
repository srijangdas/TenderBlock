package icu.telepathystudios.puretender.dto.auth;


import icu.telepathystudios.puretender.model.AccountStatus;
import icu.telepathystudios.puretender.model.Role;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String tokenType,
        UUID userId,
        String fullName,
        String email,
        Role role,
        AccountStatus accountStatus
) {}
