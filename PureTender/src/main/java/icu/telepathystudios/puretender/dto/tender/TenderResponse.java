package icu.telepathystudios.puretender.dto.tender;


import icu.telepathystudios.puretender.model.TenderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TenderResponse(

        UUID id,
        String title,
        String description,
        BigDecimal estimatedValue,
        Instant submissionDeadline,
        Instant openingDate,
        Instant publishedAt,
        TenderStatus status,
        UUID authorityId,
        String authorityName,
        Instant createdAt

) {}
