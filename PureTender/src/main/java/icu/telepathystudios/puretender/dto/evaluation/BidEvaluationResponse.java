package icu.telepathystudios.puretender.dto.evaluation;

import icu.telepathystudios.puretender.model.enums.EvaluationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BidEvaluationResponse(
        UUID evaluationId,
        UUID bidId,
        UUID tenderId,
        String evaluatorName,
        BigDecimal technicalScore,
        BigDecimal financialScore,
        BigDecimal totalScore,
        String remarks,
        EvaluationStatus status,
        Instant evaluatedAt,
        Instant createdAt,
        Instant updatedAt
) {}
