package icu.telepathystudios.puretender.controller;

import icu.telepathystudios.puretender.dto.tender.CreateTenderRequest;
import icu.telepathystudios.puretender.dto.tender.TenderResponse;
import icu.telepathystudios.puretender.dto.tender.UpdateTenderRequest;
import icu.telepathystudios.puretender.model.User;
import icu.telepathystudios.puretender.repo.AuthRepo;
import icu.telepathystudios.puretender.service.TenderService;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenders")
@RequiredArgsConstructor
public class TenderController {

    private final TenderService tenderService;
    //private final AuthRepo authRepo;

    // CREATE AND SUBMIT TENDER
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('AUTHORITY')")
    public TenderResponse createTender(
            @Valid @RequestBody CreateTenderRequest request,
            Authentication authentication
    ) {

        return tenderService.createTender(authentication, request);
    }

    // UPDATE SUBMITTED TENDER
    @PutMapping("/{tenderId}")
    @PreAuthorize("hasRole('AUTHORITY')")
    public TenderResponse updateTender(
            @PathVariable UUID tenderId,
            @Valid @RequestBody UpdateTenderRequest request,
            Authentication authentication
    ) {

        return tenderService.updateTender(
                tenderId,
                authentication,
                request
        );
    }

    // GET MY TENDERS
    @GetMapping("/my")
    @PreAuthorize("hasRole('AUTHORITY')")
    public Page<TenderResponse> getMyTenders(
            Authentication authentication,
            @PageableDefault(size = 10) Pageable pageable
    ) {

        return tenderService.getMyTenders(authentication, pageable);
    }

    // GET ALL PUBLISHED TENDERS
    @GetMapping("/published")
    @PreAuthorize("hasRole('CONTRACTOR')")
    public Page<TenderResponse> getPublishedTenders(
            @PageableDefault(size = 10) Pageable pageable
    ) {

        return tenderService.getPublishedTenders(pageable);
    }

    // GET TENDER DETAILS
    @GetMapping("/{tenderId}")
    @PreAuthorize("""
            hasAnyRole(
                'AUTHORITY',
                'CONTRACTOR',
                'EVALUATOR',
                'AUDITOR',
                'ADMIN'
            )
            """)
    public TenderResponse getTender(
            @PathVariable UUID tenderId,
            Authentication authentication
    ) {

        // Admin and Auditor can inspect tender details.
        if (authentication.getAuthorities().toString().equals("ADMIN")
                || authentication.getAuthorities().toString().equals("AUDITOR")) {

            return tenderService.getTenderForAdminOrAuditor(tenderId);
        }

        // Authority owner or any user viewing a published tender.
        return tenderService.getTender(tenderId, authentication);
    }
}
