package icu.telepathystudios.puretender.controller;


import icu.telepathystudios.puretender.dto.company.CompanyProfileRequest;
import icu.telepathystudios.puretender.dto.company.CompanyProfileResponse;
import icu.telepathystudios.puretender.service.role_man.CompanyProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/company/profile")
@RequiredArgsConstructor
public class CompanyProfileController {
    private final CompanyProfileService companyProfileService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CompanyProfileResponse createProfile(
            @Valid @RequestBody CompanyProfileRequest request,
            Authentication authentication
    ) {

        // Assumes JWT subject is the user's email.
        String email = authentication.getName();

        // Replace with your existing AuthRepo lookup if you use
        // a different principal structure.
        return companyProfileService.createProfile(
                authentication,
                request
        );
    }

    @GetMapping("/me")
    public CompanyProfileResponse getMyProfile(
            Authentication authentication
    ) {

        return companyProfileService.getProfile(
                authentication
        );
    }

    @PutMapping("/me")
    public CompanyProfileResponse updateMyProfile(
            @Valid @RequestBody CompanyProfileRequest request,
            Authentication authentication
    ) {

        return companyProfileService.updateProfile(
                authentication,
                request
        );
    }
}
