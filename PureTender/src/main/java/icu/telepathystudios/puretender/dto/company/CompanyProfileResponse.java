package icu.telepathystudios.puretender.dto.company;

import java.time.Instant;
import java.util.UUID;

public record CompanyProfileResponse(
        UUID id,
        UUID userId,
        String companyName,
        String registrationNumber,
        String gstin,
        String pan,
        String address,
        String contactNumber,
        String website,
        Instant submittedAt
) {}
