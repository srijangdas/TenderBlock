package icu.telepathystudios.puretender.dto.company;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CompanyProfileRequest(

        @NotBlank
        @Size(max = 200)
        String companyName,

        @Size(max = 100)
        String registrationNumber,

        @Pattern(
                regexp = "^[0-9A-Z]{15}$",
                message = "Invalid GSTIN format"
        )
        String gstin,

        @Pattern(
                regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$",
                message = "Invalid PAN format"
        )
        String pan,

        @NotBlank
        @Size(max = 500)
        String address,

        @NotBlank
        @Pattern(
                regexp = "^[0-9+() -]{7,20}$",
                message = "Invalid contact number"
        )
        String contactNumber,

        @Size(max = 255)
        String website
) {}
