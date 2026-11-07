package icu.telepathystudios.puretender.dto.auth;


import icu.telepathystudios.puretender.model.enums.AccountStatus;
import icu.telepathystudios.puretender.model.enums.Role;

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
