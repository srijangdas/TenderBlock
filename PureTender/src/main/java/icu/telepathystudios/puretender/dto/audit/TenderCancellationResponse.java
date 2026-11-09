package icu.telepathystudios.puretender.dto.audit;

import java.time.Instant;
import java.util.UUID;

public record TenderCancellationResponse(
        UUID tenderId,
        String title,
        String status,
        String cancellationReason,
        String cancelledBy,
        Instant cancelledAt
) {}