package icu.telepathystudios.puretender.dto.tender;

import icu.telepathystudios.puretender.model.enums.TenderStatus;

import java.time.Instant;
import java.util.UUID;

public record AssignedTenderResponse(
        UUID tenderId,
        String title,
        Instant openingDate,
        Instant submissionDeadline,
        TenderStatus status,
        long submittedBidCount
) {}
