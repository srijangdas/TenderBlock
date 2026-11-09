package icu.telepathystudios.puretender.dto.audit;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AwardHeldTenderRequest(
        @NotNull UUID winningBidId,
        @Size(max = 2000) String remarks
) {}
