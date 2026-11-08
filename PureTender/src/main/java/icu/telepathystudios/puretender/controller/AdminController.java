package icu.telepathystudios.puretender.controller;

import icu.telepathystudios.puretender.dto.admin.AdminActionResponse;
import icu.telepathystudios.puretender.dto.admin.AdminUserDetailsResponse;
import icu.telepathystudios.puretender.dto.admin.AdminUserResponse;
import icu.telepathystudios.puretender.dto.tender.ApproveTenderRequest;
import icu.telepathystudios.puretender.dto.tender.RejectTenderRequest;
import icu.telepathystudios.puretender.dto.tender.TenderResponse;
import icu.telepathystudios.puretender.service.role_man.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/users/pending")
    public ResponseEntity<Page<AdminUserResponse>> getPendingUsers(
            @PageableDefault(size = 10) Pageable pageable) {

        return ResponseEntity.ok(
                adminService.getPendingUsers(pageable)
        );
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserResponse>> getAllUsers(
            @PageableDefault(size = 10) Pageable pageable) {

        return ResponseEntity.ok(
                adminService.getAllUsers(pageable)
        );
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminUserResponse> getUser(
            @PathVariable UUID userId) {

        return ResponseEntity.ok(
                adminService.getUser(userId)
        );
    }

    @PatchMapping("/users/{userId}/verify")
    public ResponseEntity<AdminActionResponse> verifyUser(
            @PathVariable UUID userId) {

        return ResponseEntity.ok(
                adminService.verifyUser(userId)
        );
    }

    @PatchMapping("/users/{userId}/reject")
    public ResponseEntity<AdminActionResponse> rejectUser(
            @PathVariable UUID userId) {

        return ResponseEntity.ok(
                adminService.rejectUser(userId)
        );
    }

    @PatchMapping("/users/{userId}/disable")
    public ResponseEntity<AdminActionResponse> disableUser(
            @PathVariable UUID userId) {

        return ResponseEntity.ok(
                adminService.disableUser(userId)
        );
    }

    @PatchMapping("/users/{userId}/enable")
    public ResponseEntity<AdminActionResponse> enableUser(
            @PathVariable UUID userId) {

        return ResponseEntity.ok(
                adminService.enableUser(userId)
        );
    }

    @GetMapping("/users/{userId}/details")
    public AdminUserDetailsResponse getUserDetails(
            @PathVariable UUID userId
    ) {
        return adminService.getUserDetails(userId);
    }

    @GetMapping("/tenders/pending")
    public ResponseEntity<Page<TenderResponse>> getPendingTenders(
            @PageableDefault(size = 10) Pageable pageable) {

        return ResponseEntity.ok(adminService.getPendingTenders(pageable));
    }

    // APPROVE TENDER AND ASSIGN EVALUATOR
    @PatchMapping("/tenders/{tenderId}/approve")
    public TenderResponse approveTender(
            @PathVariable UUID tenderId,
            @Valid @RequestBody ApproveTenderRequest request,
            Authentication authentication
    ) {

        return adminService.approveTender(
                tenderId,
                request.evaluatorId(),
                authentication
        );
    }


    // REJECT TENDER
    @PatchMapping("/tenders/{tenderId}/reject")
    public TenderResponse rejectTender(
            @PathVariable UUID tenderId,
            @Valid @RequestBody RejectTenderRequest request
    ) {

        return adminService.rejectTender(
                tenderId,
                request.reason()
        );
    }
}
