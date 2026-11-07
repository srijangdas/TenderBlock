package icu.telepathystudios.puretender.dto.bid;

import icu.telepathystudios.puretender.model.enums.BidStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BidResponse(

        UUID id,
        UUID tenderId,
        String tenderTitle,
        UUID contractorId,
        String contractorName,
        BigDecimal quotedAmount,
        String technicalProposal,
        BidStatus status,
        Instant submittedAt,
        Instant openedAt,
        Instant createdAt,
        Instant updatedAt

) {}