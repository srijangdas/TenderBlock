package icu.telepathystudios.puretender.service.role_man;

import icu.telepathystudios.puretender.dto.admin.AdminActionResponse;
import icu.telepathystudios.puretender.dto.admin.AdminUserDetailsResponse;
import icu.telepathystudios.puretender.dto.admin.AdminUserResponse;
import icu.telepathystudios.puretender.dto.company.CompanyProfileResponse;
import icu.telepathystudios.puretender.dto.tender.TenderResponse;
import icu.telepathystudios.puretender.model.classes.Tender;
import icu.telepathystudios.puretender.model.classes.TenderEvaluator;
import icu.telepathystudios.puretender.model.classes.User;
import icu.telepathystudios.puretender.model.enums.AccountStatus;
import icu.telepathystudios.puretender.model.enums.Role;
import icu.telepathystudios.puretender.model.enums.TenderStatus;
import icu.telepathystudios.puretender.repo.AuthRepo;
import icu.telepathystudios.puretender.repo.TenderRepo;
import icu.telepathystudios.puretender.repo.admin.AdminRepo;
import icu.telepathystudios.puretender.repo.CompanyProfileRepo;
import icu.telepathystudios.puretender.repo.admin.TenderEvaluatorRepo;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final AdminRepo adminRepo;
    private final CompanyProfileRepo companyProfileRepo;
    private final TenderEvaluatorRepo tenderEvaluatorRepo;
    private final TenderRepo tenderRepo;
    private final AuthRepo authRepo;

    // View all pending registrations
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getPendingUsers(Pageable pageable) {

        return adminRepo.findAllByStatus(
                AccountStatus.PENDING,
                pageable
        ).map(this::toResponse);
    }

    // View all users
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getAllUsers(Pageable pageable) {

        return adminRepo.findAll(pageable)
                .map(this::toResponse);
    }

    // View individual user details
    @Transactional(readOnly = true)
    public AdminUserResponse getUser(UUID userId) {

        User user = findUser(userId);

        return toResponse(user);
    }

    // Approve registration
    @Transactional
    public AdminActionResponse verifyUser(UUID userId) {

        User user = findUser(userId);

        if (user.getStatus() != AccountStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only pending accounts can be approved"
            );
        }

        if (user.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin accounts cannot be approved through registration"
            );
        }

        user.setStatus(AccountStatus.VERIFIED);

        adminRepo.save(user);

        return new AdminActionResponse(
                user.getId(),
                "User account successfully verified",
                user.getStatus()
        );
    }

    // Reject registration
    @Transactional
    public AdminActionResponse rejectUser(UUID userId) {

        User user = findUser(userId);

        if (user.getStatus() != AccountStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only pending accounts can be rejected"
            );
        }

        user.setStatus(AccountStatus.REJECTED);

        adminRepo.save(user);

        return new AdminActionResponse(
                user.getId(),
                "User registration rejected",
                user.getStatus()
        );
    }

    // Disable verified account
    @Transactional
    public AdminActionResponse disableUser(UUID userId) {

        User user = findUser(userId);

        if (user.getStatus() != AccountStatus.VERIFIED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only verified accounts can be disabled"
            );
        }

        if (user.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Cannot disable an admin through this operation"
            );
        }

        user.setStatus(AccountStatus.DISABLED);

        adminRepo.save(user);

        return new AdminActionResponse(
                user.getId(),
                "User account disabled",
                user.getStatus()
        );
    }

    // Re-enable disabled account
    @Transactional
    public AdminActionResponse enableUser(UUID userId) {

        User user = findUser(userId);

        if (user.getStatus() != AccountStatus.DISABLED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only disabled accounts can be enabled"
            );
        }

        user.setStatus(AccountStatus.VERIFIED);

        adminRepo.save(user);

        return new AdminActionResponse(
                user.getId(),
                "User account enabled",
                user.getStatus()
        );
    }

    // APPROVE TENDER AND ASSIGN EVALUATOR
    @Transactional
    public TenderResponse approveTender(
            UUID tenderId,
            UUID evaluatorId,
            Authentication authentication
    ) {

        UUID adminId = authRepo.findByEmail(authentication.getName().toLowerCase()).get().getId();

        // Find tender
        Tender tender = tenderRepo.findById(tenderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tender not found"
                ));

        // Only submitted tenders can be approved
        if (tender.getStatus() != TenderStatus.SUBMITTED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only submitted tenders can be approved"
            );
        }

        // Find evaluator
        User evaluator = authRepo.findById(evaluatorId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Evaluator not found"
                ));

        // Validate evaluator role
        if (evaluator.getRole() != Role.EVALUATOR) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected user is not an evaluator"
            );
        }

        // Evaluator must be verified
        if (evaluator.getStatus() != AccountStatus.VERIFIED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Evaluator account is not verified"
            );
        }

        // Find admin
        User admin = authRepo.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Admin not found"
                ));

        if (admin.getRole() != Role.ADMIN
                || admin.getStatus() != AccountStatus.VERIFIED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Invalid admin account"
            );
        }

        // Create evaluator assignment
        TenderEvaluator assignment = new TenderEvaluator();

        assignment.setTender(tender);
        assignment.setEvaluator(evaluator);
        assignment.setAssignedBy(admin);

        tenderEvaluatorRepo.save(assignment);

        // Publish tender
        tender.setStatus(TenderStatus.PUBLISHED);
        tender.setPublishedAt(Instant.now());
        tender.setRejectionReason(null);

        tenderRepo.save(tender);

        return mapTenderToResponse(tender);
    }


    // REJECT TENDER
    @Transactional
    public TenderResponse rejectTender(
            UUID tenderId,
            String reason
    ) {

        Tender tender = tenderRepo.findById(tenderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tender not found"
                ));

        if (tender.getStatus() != TenderStatus.SUBMITTED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only submitted tenders can be rejected"
            );
        }

        tender.setStatus(TenderStatus.REJECTED);
        tender.setRejectionReason(reason);

        tenderRepo.save(tender);

        return mapTenderToResponse(tender);
    }


    // MAP TENDER ENTITY TO RESPONSE DTO
    private TenderResponse mapTenderToResponse(Tender tender) {

        return new TenderResponse(
                tender.getId(),
                tender.getTitle(),
                tender.getDescription(),
                tender.getEstimatedValue(),
                tender.getSubmissionDeadline(),
                tender.getOpeningDate(),
                tender.getPublishedAt(),
                tender.getStatus(),
                tender.getAuthority().getId(),
                tender.getAuthority().getFullName(),
                tender.getCreatedAt()
        );
    }

    //return user and company details to frontend
    @Transactional(readOnly = true)
    public AdminUserDetailsResponse getUserDetails(UUID userId) {

        User user = adminRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"
                ));

        CompanyProfileResponse companyProfile =
                companyProfileRepo.findByUserId(userId)
                        .map(profile -> new CompanyProfileResponse(
                                profile.getId(),
                                user.getId(),
                                profile.getCompanyName(),
                                profile.getRegistrationNumber(),
                                profile.getGstin(),
                                profile.getPan(),
                                profile.getAddress(),
                                profile.getContactNumber(),
                                profile.getWebsite(),
                                profile.getSubmittedAt()
                        ))
                        .orElse(null);

        return new AdminUserDetailsResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                companyProfile
        );
    }


    private User findUser(UUID userId) {

        return adminRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
    }

    private AdminUserResponse toResponse(User user) {

        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}
