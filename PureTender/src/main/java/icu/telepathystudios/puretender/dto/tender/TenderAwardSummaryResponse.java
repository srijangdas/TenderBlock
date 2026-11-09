package icu.telepathystudios.puretender.dto.tender;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TenderAwardSummaryResponse(
        UUID tenderId,
        String tenderTitle,
        UUID winningBidId,
        String winningContractorName,
        BigDecimal winningBidAmount,
        Instant awardedAt
) {}
