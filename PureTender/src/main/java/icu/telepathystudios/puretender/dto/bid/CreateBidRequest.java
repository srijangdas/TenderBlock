package icu.telepathystudios.puretender.dto.bid;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateBidRequest(

        @NotNull(message = "Quoted amount is required")
        @DecimalMin(value = "0.01", message = "Quoted amount must be positive")
        @Digits(integer = 17, fraction = 2)
        BigDecimal quotedAmount,

        @NotBlank(message = "Technical proposal is required")
        @Size(max = 20000)
        String technicalProposal

) {}
