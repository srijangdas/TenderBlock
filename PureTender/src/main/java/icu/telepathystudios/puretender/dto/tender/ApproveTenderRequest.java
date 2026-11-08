package icu.telepathystudios.puretender.dto.tender;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ApproveTenderRequest(

        @NotNull(message = "Evaluator ID is required")
        UUID evaluatorId

) {}
