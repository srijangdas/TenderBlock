package icu.telepathystudios.puretender.service.audit;

import icu.telepathystudios.puretender.dto.audit.IntegrityReportResponse;
import icu.telepathystudios.puretender.dto.audit.ResolveIntegrityReportRequest;
import icu.telepathystudios.puretender.dto.audit.AwardHeldTenderRequest;
import icu.telepathystudios.puretender.dto.tender.TenderAwardResponse;
import icu.telepathystudios.puretender.model.classes.Bid;
import icu.telepathystudios.puretender.model.classes.BidEvaluation;
import icu.telepathystudios.puretender.model.classes.IntegrityReport;
import icu.telepathystudios.puretender.model.classes.Tender;
import icu.telepathystudios.puretender.model.classes.TenderAward;
import icu.telepathystudios.puretender.model.classes.User;
import icu.telepathystudios.puretender.model.enums.*;
import icu.telepathystudios.puretender.repo.bid.BidEvaluationRepo;
import icu.telepathystudios.puretender.repo.bid.BidRepo;
import icu.telepathystudios.puretender.repo.AuthRepo;
import icu.telepathystudios.puretender.repo.IntegrityReportRepo;
import icu.telepathystudios.puretender.repo.tender.TenderAwardRepo;
import icu.telepathystudios.puretender.repo.tender.TenderRepo;
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
    private final TenderRepo tenderRepo;
    private final BidRepo bidRepo;
    private final BidEvaluationRepo bidEvaluationRepo;

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

            Tender tender = report.getTender();
            if (tender.getStatus() != TenderStatus.ON_HOLD
                    || tenderAwardRepo.existsByTender_Id(tenderId)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Only a flagged, unawarded tender can be voided by this workflow."
                );
            }

            tender.setStatus(TenderStatus.VOIDED);

        } else {

            report.setStatus(IntegrityReportStatus.DISMISSED);

            if (report.getTender().getStatus() != TenderStatus.ON_HOLD) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "The tender is no longer on hold."
                );
            }
        }

        IntegrityReport saved = integrityReportRepo.save(report);

        return mapToIntegrityReportResponse(saved);
    }

    @Transactional
    public TenderAwardResponse awardHeldTender(
            UUID tenderId,
            AwardHeldTenderRequest request,
            Authentication authentication
    ) {
        User auditor = getVerifiedAuditor(authentication);
        Tender tender = tenderRepo.findById(tenderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tender not found."
                ));

        if (tender.getStatus() != TenderStatus.ON_HOLD
                || tenderAwardRepo.existsByTender_Id(tenderId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only a held, unawarded tender can be awarded through this workflow."
            );
        }

        if (integrityReportRepo.existsByTender_IdAndStatusIn(
                tenderId,
                List.of(IntegrityReportStatus.OPEN, IntegrityReportStatus.UNDER_REVIEW))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "All integrity reports must be resolved before the tender can be awarded."
            );
        }

        Bid winningBid = bidRepo.findById(request.winningBidId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Winning bid not found."
                ));
        if (!winningBid.getTender().getId().equals(tenderId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The selected bid does not belong to this tender."
            );
        }

        BidEvaluation winningEvaluation = bidEvaluationRepo.findByBid_Id(winningBid.getId())
                .filter(evaluation -> evaluation.getStatus() == EvaluationStatus.FINALIZED)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "The selected bid must have a finalized evaluation."
                ));
        if (winningBid.getStatus() != BidStatus.EVALUATED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The selected bid is not ready to be awarded."
            );
        }

        List<Bid> awardableBids = bidRepo.findAllByTender_IdAndStatusIn(
                tenderId,
                List.of(BidStatus.SUBMITTED, BidStatus.OPENED,
                        BidStatus.UNDER_EVALUATION, BidStatus.EVALUATED)
        );
        if (awardableBids.stream().anyMatch(bid -> bid.getStatus() != BidStatus.EVALUATED)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Every submitted bid must be evaluated before the tender can be awarded."
            );
        }

        List<Bid> evaluatedBids = awardableBids;
        for (Bid bid : evaluatedBids) {
            bid.setStatus(bid.getId().equals(winningBid.getId())
                    ? BidStatus.SELECTED : BidStatus.NOT_SELECTED);
        }
        bidRepo.saveAll(evaluatedBids);

        TenderAward award = new TenderAward();
        award.setTender(tender);
        award.setWinningBid(winningBid);
        award.setTriggeredBy(auditor);
        award.setRemarks(request.remarks());
        TenderAward savedAward = tenderAwardRepo.save(award);
        tender.setStatus(TenderStatus.AWARDED);
        tenderRepo.save(tender);

        return new TenderAwardResponse(
                savedAward.getId(), tender.getId(), tender.getTitle(),
                winningBid.getId(), winningBid.getContractor().getFullName(),
                winningBid.getQuotedAmount(), winningEvaluation.getTechnicalScore(),
                winningEvaluation.getFinancialScore(), winningEvaluation.getTotalScore(),
                auditor.getId(), auditor.getFullName(), savedAward.getRemarks(),
                savedAward.getVerificationStatus(), savedAward.getAwardedAt()
        );
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
