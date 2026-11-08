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
        BidStatus status,
        Instant submittedAt,
        Instant openedAt,
        Instant createdAt,
        Instant updatedAt,
        boolean proposalUploaded

) {}