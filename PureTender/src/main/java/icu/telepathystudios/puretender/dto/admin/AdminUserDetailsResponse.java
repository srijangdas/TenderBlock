package icu.telepathystudios.puretender.dto.admin;



import icu.telepathystudios.puretender.dto.company.CompanyProfileResponse;
import icu.telepathystudios.puretender.model.AccountStatus;
import icu.telepathystudios.puretender.model.Role;

import java.time.Instant;
import java.util.UUID;

public record AdminUserDetailsResponse(
        UUID userId,
        String fullName,
        String email,
        Role role,
        AccountStatus status,
        Instant createdAt,
        CompanyProfileResponse companyProfile
) {}
