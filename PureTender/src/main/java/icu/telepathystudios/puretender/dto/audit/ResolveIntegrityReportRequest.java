package icu.telepathystudios.puretender.dto.audit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveIntegrityReportRequest(

        boolean issueConfirmed,

        @NotBlank
        @Size(max = 5000)
        String resolutionNotes
) {}
