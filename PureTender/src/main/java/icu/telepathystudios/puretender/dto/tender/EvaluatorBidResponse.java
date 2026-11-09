package icu.telepathystudios.puretender.dto.tender;

import icu.telepathystudios.puretender.model.enums.BidStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EvaluatorBidResponse(
        UUID bidId,
        UUID tenderId,
        String contractorName,
        BigDecimal quotedAmount,
        BidStatus status,
        Instant submittedAt,
        Instant openedAt,
        boolean proposalUploaded
) {}
