package icu.telepathystudios.puretender.service.audit;

import icu.telepathystudios.puretender.dto.audit.IntegrityReportResponse;
import icu.telepathystudios.puretender.dto.audit.ResolveIntegrityReportRequest;
import icu.telepathystudios.puretender.model.classes.IntegrityReport;
import icu.telepathystudios.puretender.model.classes.Tender;
import icu.telepathystudios.puretender.model.classes.TenderAward;
import icu.telepathystudios.puretender.model.classes.User;
import icu.telepathystudios.puretender.model.enums.*;
import icu.telepathystudios.puretender.repo.AuthRepo;
import icu.telepathystudios.puretender.repo.IntegrityReportRepo;
import icu.telepathystudios.puretender.repo.tender.TenderAwardRepo;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditorService {

    private final AuthRepo authRepo;
    private final IntegrityReportRepo integrityReportRepo;
    private final TenderAwardRepo tenderAwardRepo;

    // 1. List all integrity reports
    @Transactional(readOnly = true)
    public Page<IntegrityReportResponse> getReports(
            Authentication authentication,
            Pageable pageable
    ) {
        getVerifiedAuditor(authentication);

        return integrityReportRepo
                .findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToIntegrityReportResponse);
    }

    // 2. View a particular report
    @Transactional(readOnly = true)
    public IntegrityReportResponse getReport(
            UUID reportId,
            Authentication authentication
    ) {
        getVerifiedAuditor(authentication);

        IntegrityReport report = getIntegrityReport(reportId);

        return mapToIntegrityReportResponse(report);
    }

    // 3. Claim a report for investigation
    @Transactional
    public IntegrityReportResponse claimReport(
            UUID reportId,
            Authentication authentication
    ) {
        User auditor = getVerifiedAuditor(authentication);

        IntegrityReport report = getIntegrityReport(reportId);

        if (report.getStatus() != IntegrityReportStatus.OPEN) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only open reports can be claimed."
            );
        }

        if (report.getAssignedAuditor() != null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This report has already been assigned."
            );
        }

        report.setAssignedAuditor(auditor);
        report.setStatus(IntegrityReportStatus.UNDER_REVIEW);

        updateAwardVerificationStatus(
                report.getTender().getId(),
                VerificationStatus.UNDER_AUDIT
        );

        IntegrityReport saved = integrityReportRepo.save(report);

        return mapToIntegrityReportResponse(saved);
    }

    // 4. Resolve a report
    @Transactional
    public IntegrityReportResponse resolveReport(
            UUID reportId,
            ResolveIntegrityReportRequest request,
            Authentication authentication
    ) {
        User auditor = getVerifiedAuditor(authentication);

        IntegrityReport report = getIntegrityReport(reportId);

        if (report.getStatus() != IntegrityReportStatus.UNDER_REVIEW) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This report is not currently under review."
            );
        }

        if (report.getAssignedAuditor() == null ||
                !report.getAssignedAuditor().getId().equals(auditor.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only the assigned auditor can resolve this report."
            );
        }

        report.setResolutionNotes(request.resolutionNotes());
        report.setResolvedAt(Instant.now());

        UUID tenderId = report.getTender().getId();

        if (request.issueConfirmed()) {

            report.setStatus(IntegrityReportStatus.RESOLVED);

            // Confirmed integrity violation.
            updateAwardVerificationStatus(
                    tenderId,
                    VerificationStatus.FAILED
            );

            Tender tender = report.getTender();

            if (tender.getStatus() == TenderStatus.AWARDED) {
                tender.setStatus(TenderStatus.VOIDED);
            }

        } else {

            report.setStatus(IntegrityReportStatus.DISMISSED);

            updateVerificationAfterDismissal(tenderId);
        }

        IntegrityReport saved = integrityReportRepo.save(report);

        return mapToIntegrityReportResponse(saved);
    }


    // ---------------- PRIVATE HELPERS ----------------

    private User getVerifiedAuditor(Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required."
            );
        }

        User auditor = authRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Auditor account not found."
                ));

        if (auditor.getRole() != Role.AUDITOR) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only auditors can access this resource."
            );
        }

        if (auditor.getStatus() != AccountStatus.VERIFIED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not verified."
            );
        }

        return auditor;
    }

    private IntegrityReport getIntegrityReport(UUID reportId) {
        return integrityReportRepo.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Integrity report not found."
                ));
    }

    private void updateAwardVerificationStatus(
            UUID tenderId,
            VerificationStatus status
    ) {
        TenderAward award = tenderAwardRepo.findByTender_Id(tenderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Tender award record not found."
                ));

        // Once a confirmed failure is recorded, don't downgrade it.
        if (award.getVerificationStatus() == VerificationStatus.FAILED &&
                status != VerificationStatus.FAILED) {
            return;
        }

        award.setVerificationStatus(status);
        tenderAwardRepo.save(award);
    }

    private void updateVerificationAfterDismissal(UUID tenderId) {

        TenderAward award = tenderAwardRepo.findByTender_Id(tenderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Tender award record not found."
                ));

        if (award.getVerificationStatus() == VerificationStatus.FAILED) {
            return;
        }

        boolean hasOpenReports =
                integrityReportRepo.existsByTender_IdAndStatus(
                        tenderId,
                        IntegrityReportStatus.OPEN
                );

        boolean hasReportsUnderReview =
                integrityReportRepo.existsByTender_IdAndStatus(
                        tenderId,
                        IntegrityReportStatus.UNDER_REVIEW
                );

        if (hasReportsUnderReview) {
            award.setVerificationStatus(VerificationStatus.UNDER_AUDIT);
        } else if (hasOpenReports) {
            award.setVerificationStatus(VerificationStatus.DISCREPANCY_FOUND);
        } else {
            award.setVerificationStatus(VerificationStatus.VERIFIED);
        }

        tenderAwardRepo.save(award);
    }

    private IntegrityReportResponse mapToIntegrityReportResponse(
            IntegrityReport report
    ) {
        return new IntegrityReportResponse(
                report.getId(),
                report.getTender().getId(),
                report.getTender().getTitle(),
                report.getBid() != null
                        ? report.getBid().getId()
                        : null,
                report.getAssignedAuditor() != null
                        ? report.getAssignedAuditor().getFullName()
                        : null,
                report.getType(),
                report.getSource(),
                report.getDescription(),
                report.getEvidenceReference(),
                report.getStatus(),
                report.getResolutionNotes(),
                report.getCreatedAt(),
                report.getUpdatedAt(),
                report.getResolvedAt()
        );
    }
}
