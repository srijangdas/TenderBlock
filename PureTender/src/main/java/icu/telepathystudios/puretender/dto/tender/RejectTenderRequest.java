package icu.telepathystudios.puretender.dto.tender;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectTenderRequest(

        @NotBlank(message = "Rejection reason is required")
        @Size(max = 1000)
        String reason

) {}
