package icu.telepathystudios.puretender.dto.audit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelTenderRequest(

        @NotBlank(message = "Cancellation reason is required")
        @Size(max = 2000, message = "Cancellation reason cannot exceed 2000 characters")
        String reason

) {}
