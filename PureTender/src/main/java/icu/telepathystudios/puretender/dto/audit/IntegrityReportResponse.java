package icu.telepathystudios.puretender.dto.audit;

import icu.telepathystudios.puretender.model.enums.IntegrityReportSource;
import icu.telepathystudios.puretender.model.enums.IntegrityReportStatus;
import icu.telepathystudios.puretender.model.enums.IntegrityReportType;

import java.time.Instant;
import java.util.UUID;

public record IntegrityReportResponse(

        UUID reportId,

        UUID tenderId,
        String tenderTitle,

        UUID bidId,

        String assignedAuditorName,

        IntegrityReportType type,
        IntegrityReportSource source,

        String description,
        String evidenceReference,

        IntegrityReportStatus status,

        String resolutionNotes,

        Instant createdAt,
        Instant updatedAt,
        Instant resolvedAt
) {}
