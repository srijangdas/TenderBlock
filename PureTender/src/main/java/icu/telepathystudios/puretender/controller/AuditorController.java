package icu.telepathystudios.puretender.controller;

import icu.telepathystudios.puretender.dto.audit.IntegrityReportResponse;
import icu.telepathystudios.puretender.dto.audit.ResolveIntegrityReportRequest;
import icu.telepathystudios.puretender.service.audit.AuditorService;
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
@RequestMapping("/api/v1/auditor")
@RequiredArgsConstructor
@PreAuthorize("hasRole('AUDITOR')")
public class AuditorController {

    private final AuditorService auditorService;

    // 1. View all integrity reports
    @GetMapping("/reports")
    public ResponseEntity<Page<IntegrityReportResponse>> getReports(
            Authentication authentication,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(
                auditorService.getReports(authentication, pageable)
        );
    }

    // 2. View an individual report
    @GetMapping("/reports/{reportId}")
    public ResponseEntity<IntegrityReportResponse> getReport(
            @PathVariable UUID reportId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                auditorService.getReport(reportId, authentication)
        );
    }

    // 3. Claim an open report
    @PostMapping("/reports/{reportId}/claim")
    public ResponseEntity<IntegrityReportResponse> claimReport(
            @PathVariable UUID reportId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                auditorService.claimReport(reportId, authentication)
        );
    }

    // 4. Submit investigation findings
    @PostMapping("/reports/{reportId}/resolve")
    public ResponseEntity<IntegrityReportResponse> resolveReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody ResolveIntegrityReportRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                auditorService.resolveReport(
                        reportId,
                        request,
                        authentication
                )
        );
    }
}
