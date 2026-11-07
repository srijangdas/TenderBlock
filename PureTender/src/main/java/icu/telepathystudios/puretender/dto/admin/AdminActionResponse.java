package icu.telepathystudios.puretender.dto.admin;

import icu.telepathystudios.puretender.model.enums.AccountStatus;

import java.util.UUID;

public record AdminActionResponse(
        UUID userId,
        String message,
        AccountStatus status) {}
