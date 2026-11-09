package icu.telepathystudios.puretender.dto.audit;

import icu.telepathystudios.puretender.model.enums.BidStatus;
import icu.telepathystudios.puretender.model.enums.IntegrityStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AuditorBidAuditResponse(
        UUID bidId,
        UUID bidderId,
        String bidderName,
        BigDecimal quotedAmount,
        BidStatus status,
        Instant openedAt,
        boolean proposalUploaded,
        IntegrityStatus databaseIntegrity,
        IntegrityStatus blockchainIntegrity,
        String proposalSha256
) {}
