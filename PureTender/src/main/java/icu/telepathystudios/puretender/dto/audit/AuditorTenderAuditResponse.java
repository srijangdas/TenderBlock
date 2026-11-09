package icu.telepathystudios.puretender.dto.audit;

import icu.telepathystudios.puretender.model.enums.IntegrityStatus;
import icu.telepathystudios.puretender.model.enums.TenderStatus;

import java.util.List;
import java.util.UUID;

public record AuditorTenderAuditResponse(
        UUID tenderId,
        String tenderTitle,
        String authorityName,
        String description,
        TenderStatus status,
        IntegrityStatus databaseIntegrity,
        IntegrityStatus blockchainIntegrity,
        List<AuditorBidAuditResponse> bids,
        List<IntegrityReportResponse> reports,
        String verificationMessage,
        boolean unavailable
) {}
