package icu.telepathystudios.puretender.dto.tender;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TenderAwardResponse(

        UUID awardId,

        UUID tenderId,
        String tenderTitle,

        UUID winningBidId,
        String winningContractorName,
        BigDecimal winningBidAmount,

        BigDecimal technicalScore,
        BigDecimal financialScore,
        BigDecimal totalScore,

        UUID triggeredByEvaluatorId,
        String triggeredByEvaluatorName,

        String remarks,
        Instant awardedAt
) {}
