package icu.telepathystudios.puretender.dto.tender;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateTenderRequest(

        @NotBlank(message = "Tender title is required")
        @Size(max = 200)
        String title,

        @NotBlank(message = "Tender description is required")
        String description,

        @NotNull(message = "Estimated value is required")
        @DecimalMin(value = "0.01", message = "Estimated value must be positive")
        @Digits(integer = 17, fraction = 2)
        BigDecimal estimatedValue,

        @NotNull(message = "Submission deadline is required")
        @Future(message = "Submission deadline must be in the future")
        Instant submissionDeadline,

        @NotNull(message = "Opening date is required")
        @Future(message = "Opening date must be in the future")
        Instant openingDate

) {}
