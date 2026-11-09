package icu.telepathystudios.puretender.service.role_man;

import icu.telepathystudios.puretender.dto.company.CompanyProfileRequest;
import icu.telepathystudios.puretender.dto.company.CompanyProfileResponse;
import icu.telepathystudios.puretender.model.enums.AccountStatus;
import icu.telepathystudios.puretender.model.classes.CompanyProfile;
import icu.telepathystudios.puretender.model.enums.Role;
import icu.telepathystudios.puretender.model.classes.User;
import icu.telepathystudios.puretender.repo.AuthRepo;
import icu.telepathystudios.puretender.repo.CompanyProfileRepo;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyProfileService {
    private final CompanyProfileRepo companyProfileRepo;
    private final AuthRepo authRepo;

    //region Company profile operations
    @Transactional
    public CompanyProfileResponse createProfile(
            Authentication authentication,
            CompanyProfileRequest request
    ) {
        UUID userId = getUserIdFromAuthentication(authentication);
        User user = authRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"
                ));

        validateRole(user);

        if (companyProfileRepo.existsByUserId(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Company profile already exists. Use update instead."
            );
        }

        CompanyProfile profile = new CompanyProfile();

        profile.setUser(user);
        updateFields(profile, request);

        return mapToResponse(companyProfileRepo.save(profile));
    }

    @Transactional(readOnly = true)
    public CompanyProfileResponse getProfile(Authentication authentication) {

        UUID userId = getUserIdFromAuthentication(authentication);
        CompanyProfile profile = companyProfileRepo.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Company profile not found"
                ));

        return mapToResponse(profile);
    }

    @Transactional
    public CompanyProfileResponse updateProfile(
            Authentication authentication,
            CompanyProfileRequest request
    ) {
        UUID userId = getUserIdFromAuthentication(authentication);
        User user = authRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"
                ));

        validateRole(user);

        if (user.getStatus() != AccountStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Company details cannot be changed after verification"
            );
        }

        CompanyProfile profile = companyProfileRepo.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Company profile not found"
                ));

        updateFields(profile, request);

        return mapToResponse(companyProfileRepo.save(profile));
    }
    //endregion

    //region Authentication and validation helpers
    private UUID getUserIdFromAuthentication(
            Authentication authentication
    ) {
        return authRepo.findByEmail(authentication.getName().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User not found"
                ))
                .getId();
    }

    private void validateRole(User user) {

        if (user.getRole() != Role.AUTHORITY
                && user.getRole() != Role.CONTRACTOR) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only Authority and Contractor accounts can create company profiles"
            );
        }
    }
    //endregion

    //region Profile field updates and response mapping
    private void updateFields(
            CompanyProfile profile,
            CompanyProfileRequest request
    ) {

        profile.setCompanyName(request.companyName());
        profile.setRegistrationNumber(request.registrationNumber());
        profile.setGstin(request.gstin());
        profile.setPan(request.pan());
        profile.setAddress(request.address());
        profile.setContactNumber(request.contactNumber());
        profile.setWebsite(request.website());
    }

    public CompanyProfileResponse mapToResponse(
            CompanyProfile profile
    ) {

        return new CompanyProfileResponse(
                profile.getId(),
                profile.getUser().getId(),
                profile.getCompanyName(),
                profile.getRegistrationNumber(),
                profile.getGstin(),
                profile.getPan(),
                profile.getAddress(),
                profile.getContactNumber(),
                profile.getWebsite(),
                profile.getSubmittedAt()
        );
    }
    //endregion
}
