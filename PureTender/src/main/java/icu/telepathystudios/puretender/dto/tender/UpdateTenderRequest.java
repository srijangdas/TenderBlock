package icu.telepathystudios.puretender.dto.tender;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public record UpdateTenderRequest(

        @NotBlank(message = "Tender title is required")
        @Size(max = 200)
        String title,

        @NotBlank(message = "Tender description is required")
        String description,

        @NotNull(message = "Estimated value is required")
        @DecimalMin(value = "0.01")
        @Digits(integer = 17, fraction = 2)
        BigDecimal estimatedValue,

        @NotNull(message = "Submission deadline is required")
        @Future
        Instant submissionDeadline,

        @NotNull(message = "Opening date is required")
        @Future
        Instant openingDate

) {}
