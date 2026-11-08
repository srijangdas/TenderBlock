package icu.telepathystudios.puretender.dto.bid;

import icu.telepathystudios.puretender.model.enums.TenderStatus;

import java.time.Instant;
import java.util.UUID;

public record OpenBidsResponse(
        UUID tenderId,
        int openedBidCount,
        TenderStatus tenderStatus,
        Instant openedAt
) {}
