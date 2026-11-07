package icu.telepathystudios.puretender.service.audit;

import icu.telepathystudios.puretender.dto.bid.BidProposalDownload;
import icu.telepathystudios.puretender.dto.bid.OpenBidsResponse;
import icu.telepathystudios.puretender.dto.evaluation.BidEvaluationResponse;
import icu.telepathystudios.puretender.dto.evaluation.SaveBidEvaluationRequest;
import icu.telepathystudios.puretender.dto.tender.AssignedTenderResponse;
import icu.telepathystudios.puretender.dto.tender.EvaluatorBidResponse;
import icu.telepathystudios.puretender.dto.tender.TenderAwardResponse;
import icu.telepathystudios.puretender.model.classes.*;
import icu.telepathystudios.puretender.model.enums.*;
import icu.telepathystudios.puretender.repo.AuthRepo;
import icu.telepathystudios.puretender.repo.bid.BidDocumentRepo;
import icu.telepathystudios.puretender.repo.bid.BidEvaluationRepo;
import icu.telepathystudios.puretender.repo.bid.BidRepo;
import icu.telepathystudios.puretender.repo.tender.TenderAwardRepo;
import icu.telepathystudios.puretender.repo.tender.TenderRepo;
import icu.telepathystudios.puretender.repo.admin.TenderEvaluatorRepo;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class EvaluatorService {

    private final AuthRepo authRepo;
    private final TenderRepo tenderRepo;
    private final TenderEvaluatorRepo tenderEvaluatorRepo;
    private final BidRepo bidRepo;
    private final BidDocumentRepo bidDocumentRepo;
    private final BidEvaluationRepo bidEvaluationRepo;
    private final TenderAwardRepo tenderAwardRepo;

    // 1. Get all tenders assigned to the logged-in evaluator
    @Transactional(readOnly = true)
    public Page<AssignedTenderResponse> getMyAssignedTenders(
            Authentication authentication,
            Pageable pageable
    ) {
        User evaluator = getVerifiedEvaluator(authentication);

        return tenderEvaluatorRepo
                .findAllByEvaluator_Id(evaluator.getId(), pageable)
                .map(assignment -> {
                    Tender tender = assignment.getTender();

                    long submittedBidCount = bidRepo.countByTender_IdAndStatus(
                            tender.getId(),
                            BidStatus.SUBMITTED
                    );

                    return new AssignedTenderResponse(
                            tender.getId(),
                            tender.getTitle(),
                            tender.getOpeningDate(),
                            tender.getSubmissionDeadline(),
                            tender.getStatus(),
                            submittedBidCount
                    );
                });
    }

    // 2. Open all submitted bids for an assigned tender
    @Transactional
    public OpenBidsResponse openBids(
            UUID tenderId,
            Authentication authentication
    ) {
        User evaluator = getVerifiedEvaluator(authentication);

        Tender tender = getTender(tenderId);

        verifyEvaluatorAssignment(tenderId, evaluator.getId());

        if (tender.getStatus() != TenderStatus.PUBLISHED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Bids can only be opened for a published tender."
            );
        }

        Instant now = Instant.now();

        if (tender.getOpeningDate() == null ||
                now.isBefore(tender.getOpeningDate())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "The tender opening date has not arrived yet."
            );
        }

        List<Bid> submittedBids = bidRepo.findAllByTender_IdAndStatus(
                tenderId,
                BidStatus.SUBMITTED
        );

        if (submittedBids.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "There are no submitted bids to open."
            );
        }

        for (Bid bid : submittedBids) {
            bid.setStatus(BidStatus.OPENED);
            bid.setOpenedAt(now);
        }

        bidRepo.saveAll(submittedBids);

        tender.setStatus(TenderStatus.UNDER_EVALUATION);
        tenderRepo.save(tender);

        return new OpenBidsResponse(
                tenderId,
                submittedBids.size(),
                TenderStatus.UNDER_EVALUATION,
                now
        );
    }

    // 3. View bids for an assigned tender after opening
    @Transactional(readOnly = true)
    public List<EvaluatorBidResponse> getTenderBids(
            UUID tenderId,
            Authentication authentication
    ) {
        User evaluator = getVerifiedEvaluator(authentication);

        Tender tender = getTender(tenderId);

        verifyEvaluatorAssignment(tenderId, evaluator.getId());
        verifyTenderBidsAreOpen(tender);

        List<Bid> bids = bidRepo.findAllByTender_Id(
                tenderId
        );

        return bids.stream()
                .map(this::mapToEvaluatorBidResponse)
                .toList();
    }

    // 4. Download a proposal PDF
    @Transactional(readOnly = true)
    public BidProposalDownload downloadProposal(
            UUID bidId,
            Authentication authentication
    ) {
        User evaluator = getVerifiedEvaluator(authentication);

        Bid bid = bidRepo.findById(bidId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Bid not found."
                ));

        UUID tenderId = bid.getTender().getId();

        verifyEvaluatorAssignment(tenderId, evaluator.getId());
        verifyTenderBidsAreOpen(bid.getTender());

        if (!isOpenedBid(bid.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This bid has not been opened."
            );
        }

        BidDocument document = bidDocumentRepo.findByBid_Id(bidId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No proposal PDF was uploaded for this bid."
                ));

        return new BidProposalDownload(
                document.getFileData(),
                document.getFileName(),
                document.getContentType()
        );
    }

    // ---------------- PRIVATE HELPERS ----------------

    private User getVerifiedEvaluator(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required."
            );
        }

        User evaluator = authRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Evaluator account not found."
                ));

        if (evaluator.getRole() != Role.EVALUATOR) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only evaluators can access this resource."
            );
        }

        if (evaluator.getStatus() != AccountStatus.VERIFIED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is not verified."
            );
        }

        return evaluator;
    }

    private Tender getTender(UUID tenderId) {
        return tenderRepo.findById(tenderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tender not found."
                ));
    }

    private void verifyEvaluatorAssignment(UUID tenderId, UUID evaluatorId) {
        boolean assigned = tenderEvaluatorRepo
                .existsByTender_IdAndEvaluator_Id(tenderId, evaluatorId);

        if (!assigned) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not assigned to this tender."
            );
        }
    }

    private void verifyTenderBidsAreOpen(Tender tender) {
        if (tender.getStatus() != TenderStatus.UNDER_EVALUATION &&
                tender.getStatus() != TenderStatus.AWARDED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Bids are not available for this tender yet."
            );
        }
    }

    private boolean isOpenedBid(BidStatus status) {
        return status == BidStatus.OPENED ||
                status == BidStatus.UNDER_EVALUATION ||
                status == BidStatus.EVALUATED ||
                status == BidStatus.SELECTED ||
                status == BidStatus.NOT_SELECTED;
    }

    private EvaluatorBidResponse mapToEvaluatorBidResponse(Bid bid) {
        return new EvaluatorBidResponse(
                bid.getId(),
                bid.getTender().getId(),
                bid.getContractor().getFullName(),
                bid.getQuotedAmount(),
                bid.getStatus(),
                bid.getSubmittedAt(),
                bid.getOpenedAt(),
                bidDocumentRepo.existsByBid_Id(bid.getId())
        );
    }

    // 5. Save or update an evaluation draft
    @Transactional
    public BidEvaluationResponse saveBidEvaluation(
            UUID bidId,
            SaveBidEvaluationRequest request,
            Authentication authentication
    ) {
        User evaluator = getVerifiedEvaluator(authentication);

        Bid bid = getBidForEvaluation(bidId, evaluator.getId());

        if (bid.getTender().getStatus() != TenderStatus.UNDER_EVALUATION) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This tender is not currently under evaluation."
            );
        }

        if (bid.getStatus() != BidStatus.OPENED &&
                bid.getStatus() != BidStatus.UNDER_EVALUATION) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This bid is not available for evaluation."
            );
        }

        BidEvaluation evaluation = bidEvaluationRepo.findByBid_Id(bidId)
                .orElseGet(() -> {
                    BidEvaluation newEvaluation = new BidEvaluation();
                    newEvaluation.setBid(bid);
                    newEvaluation.setEvaluator(evaluator);
                    return newEvaluation;
                });

        if (evaluation.getStatus() == EvaluationStatus.FINALIZED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This evaluation has already been finalized."
            );
        }

        evaluation.setTechnicalScore(request.technicalScore());
        evaluation.setFinancialScore(request.financialScore());
        evaluation.setRemarks(request.remarks());
        evaluation.setStatus(EvaluationStatus.DRAFT);

        // Mark the bid as currently being evaluated.
        bid.setStatus(BidStatus.UNDER_EVALUATION);

        bidRepo.save(bid);

        BidEvaluation saved = bidEvaluationRepo.save(evaluation);

        return mapToEvaluationResponse(saved);
    }


    // 6. Finalize an evaluation
    @Transactional
    public BidEvaluationResponse finalizeBidEvaluation(
            UUID bidId,
            Authentication authentication
    ) {
        User evaluator = getVerifiedEvaluator(authentication);

        Bid bid = getBidForEvaluation(bidId, evaluator.getId());

        if (bid.getTender().getStatus() != TenderStatus.UNDER_EVALUATION) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This tender is not currently under evaluation."
            );
        }

        BidEvaluation evaluation = bidEvaluationRepo.findByBid_Id(bidId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Save an evaluation before finalizing it."
                ));

        if (!evaluation.getEvaluator().getId().equals(evaluator.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot finalize another evaluator's evaluation."
            );
        }

        if (evaluation.getStatus() == EvaluationStatus.FINALIZED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This evaluation has already been finalized."
            );
        }

        // Calculate equal-weighted score: 50% technical + 50% financial.
        BigDecimal totalScore = evaluation.getTechnicalScore()
                .add(evaluation.getFinancialScore())
                .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);

        evaluation.setTotalScore(totalScore);
        evaluation.setStatus(EvaluationStatus.FINALIZED);
        evaluation.setEvaluatedAt(Instant.now());

        bid.setStatus(BidStatus.EVALUATED);

        bidRepo.save(bid);
        BidEvaluation savedEvaluation = bidEvaluationRepo.save(evaluation);

        // Check whether every submitted/opened bid has been evaluated.
        automaticallyAwardTenderIfReady(bid.getTender(), evaluator);

        return mapToEvaluationResponse(savedEvaluation);
    }

    // 7. View an evaluation
    @Transactional(readOnly = true)
    public BidEvaluationResponse getBidEvaluation(
            UUID bidId,
            Authentication authentication
    ) {
        User evaluator = getVerifiedEvaluator(authentication);

        getBidForEvaluation(bidId, evaluator.getId());

        BidEvaluation evaluation = bidEvaluationRepo.findByBid_Id(bidId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No evaluation exists for this bid."
                ));

        return mapToEvaluationResponse(evaluation);
    }

    @Transactional(readOnly = true)
    public TenderAwardResponse getTenderAward(
            UUID tenderId,
            Authentication authentication
    ) {
        User evaluator = getVerifiedEvaluator(authentication);

        // Only the assigned evaluator can view the award.
        verifyEvaluatorAssignment(tenderId, evaluator.getId());

        TenderAward award = tenderAwardRepo.findByTender_Id(tenderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No award has been recorded for this tender."
                ));

        return mapToTenderAwardResponse(award);
    }


// ---------------- EVALUATION HELPERS ----------------

    private void automaticallyAwardTenderIfReady(
            Tender tender,
            User evaluator
    ) {
        UUID tenderId = tender.getId();

        // Do not create a second award.
        if (tenderAwardRepo.existsByTender_Id(tenderId)) {
            return;
        }

        // Include all submitted bids, whether opened, being evaluated,
        // or already evaluated.
        List<Bid> bids = bidRepo.findAllByTender_IdAndStatusIn(
                tenderId,
                List.of(
                        BidStatus.SUBMITTED,
                        BidStatus.OPENED,
                        BidStatus.UNDER_EVALUATION,
                        BidStatus.EVALUATED
                )
        );

        if (bids.isEmpty()) {
            return;
        }

        // Collect and validate all evaluations.
        Map<UUID, BidEvaluation> evaluations = new HashMap<>();

        for (Bid bid : bids) {

            // Every submitted bid must be evaluated.
            if (bid.getStatus() != BidStatus.EVALUATED) {
                return;
            }

            BidEvaluation evaluation = bidEvaluationRepo
                    .findByBid_Id(bid.getId())
                    .orElse(null);

            if (evaluation == null ||
                    evaluation.getStatus() != EvaluationStatus.FINALIZED ||
                    evaluation.getTotalScore() == null) {
                return;
            }

            evaluations.put(bid.getId(), evaluation);
        }

        // Rank by:
        // 1. Highest total score.
        // 2. Highest technical score.
        // 3. Lowest quoted amount.
        // 4. Earliest submission time.
        // 5. Bid UUID as a deterministic final fallback.
        Comparator<Bid> rankingComparator =
                Comparator
                        .comparing((Bid bid) ->
                                evaluations.get(bid.getId()).getTotalScore()
                        )
                        .thenComparing(bid ->
                                evaluations.get(bid.getId()).getTechnicalScore()
                        )
                        .thenComparing(
                                Bid::getQuotedAmount,
                                Comparator.reverseOrder()
                        )
                        .thenComparing(
                                Bid::getSubmittedAt,
                                Comparator.reverseOrder()
                        )
                        .thenComparing(Bid::getId);

        Bid winningBid = bids.stream()
                .max(rankingComparator)
                .orElseThrow();

        // Update the status of every evaluated bid.
        for (Bid bid : bids) {
            if (bid.getId().equals(winningBid.getId())) {
                bid.setStatus(BidStatus.SELECTED);
            } else {
                bid.setStatus(BidStatus.NOT_SELECTED);
            }
        }

        bidRepo.saveAll(bids);

        BidEvaluation winningEvaluation = evaluations.get(winningBid.getId());

        // Create the award record.
        TenderAward award = new TenderAward();

        award.setTender(tender);
        award.setWinningBid(winningBid);
        award.setTriggeredBy(evaluator);

        award.setRemarks(
                "Automatically awarded based on equal-weighted evaluation. " +
                        "Technical score: " + winningEvaluation.getTechnicalScore() +
                        ", Financial score: " + winningEvaluation.getFinancialScore() +
                        ", Total score: " + winningEvaluation.getTotalScore()
        );

        tenderAwardRepo.save(award);

        // Update tender status.
        tender.setStatus(TenderStatus.AWARDED);

        tenderRepo.save(tender);
    }

    private TenderAwardResponse mapToTenderAwardResponse(
            TenderAward award
    ) {
        Bid winningBid = award.getWinningBid();

        BidEvaluation evaluation = bidEvaluationRepo
                .findByBid_Id(winningBid.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Winning bid evaluation could not be found."
                ));

        return new TenderAwardResponse(
                award.getId(),
                award.getTender().getId(),
                award.getTender().getTitle(),
                winningBid.getId(),
                winningBid.getContractor().getFullName(),
                winningBid.getQuotedAmount(),
                evaluation.getTechnicalScore(),
                evaluation.getFinancialScore(),
                evaluation.getTotalScore(),
                award.getTriggeredBy().getId(),
                award.getTriggeredBy().getFullName(),
                award.getRemarks(),
                award.getVerificationStatus(),
                award.getAwardedAt()
        );
    }

    private Bid getBidForEvaluation(UUID bidId, UUID evaluatorId) {

        Bid bid = bidRepo.findById(bidId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Bid not found."
                ));

        UUID tenderId = bid.getTender().getId();

        verifyEvaluatorAssignment(tenderId, evaluatorId);

        if (bid.getTender().getStatus() != TenderStatus.UNDER_EVALUATION &&
                bid.getTender().getStatus() != TenderStatus.AWARDED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "This tender is not available for evaluation."
            );
        }

        return bid;
    }


    private BidEvaluationResponse mapToEvaluationResponse(
            BidEvaluation evaluation
    ) {
        return new BidEvaluationResponse(
                evaluation.getId(),
                evaluation.getBid().getId(),
                evaluation.getBid().getTender().getId(),
                evaluation.getEvaluator().getFullName(),
                evaluation.getTechnicalScore(),
                evaluation.getFinancialScore(),
                evaluation.getTotalScore(),
                evaluation.getRemarks(),
                evaluation.getStatus(),
                evaluation.getEvaluatedAt(),
                evaluation.getCreatedAt(),
                evaluation.getUpdatedAt()
        );
    }
}
