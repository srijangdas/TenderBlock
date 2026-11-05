package icu.telepathystudios.puretender.service.role_man;

import icu.telepathystudios.puretender.dto.admin.AdminActionResponse;
import icu.telepathystudios.puretender.dto.admin.AdminUserResponse;
import icu.telepathystudios.puretender.model.AccountStatus;
import icu.telepathystudios.puretender.model.Role;
import icu.telepathystudios.puretender.model.User;
import icu.telepathystudios.puretender.repo.AdminRepo;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final AdminRepo adminRepo;

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
