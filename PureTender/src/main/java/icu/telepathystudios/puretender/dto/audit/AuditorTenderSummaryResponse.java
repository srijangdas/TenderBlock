package icu.telepathystudios.puretender.dto.audit;

import icu.telepathystudios.puretender.model.enums.TenderStatus;

import java.time.Instant;
import java.util.UUID;

public record AuditorTenderSummaryResponse(
        UUID tenderId,
        String tenderTitle,
        String authorityName,
        TenderStatus status,
        Instant flaggedAt,
        Instant completedAt,
        long reportCount,
        UUID winningBidId
) {}
