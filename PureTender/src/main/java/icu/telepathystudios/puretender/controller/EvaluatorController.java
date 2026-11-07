package icu.telepathystudios.puretender.controller;

import icu.telepathystudios.puretender.dto.bid.BidProposalDownload;
import icu.telepathystudios.puretender.dto.bid.OpenBidsResponse;
import icu.telepathystudios.puretender.dto.evaluation.BidEvaluationResponse;
import icu.telepathystudios.puretender.dto.evaluation.SaveBidEvaluationRequest;
import icu.telepathystudios.puretender.dto.tender.AssignedTenderResponse;
import icu.telepathystudios.puretender.dto.tender.EvaluatorBidResponse;
import icu.telepathystudios.puretender.dto.tender.TenderAwardResponse;
import icu.telepathystudios.puretender.service.audit.EvaluatorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/evaluator")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EVALUATOR')")
public class EvaluatorController {

    private final EvaluatorService evaluatorService;

    // 1. Get tenders assigned to the logged-in evaluator
    @GetMapping("/tenders/my")
    public ResponseEntity<Page<AssignedTenderResponse>> getMyAssignedTenders(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "assignedAt") Pageable pageable
    ) {
        return ResponseEntity.ok(
                evaluatorService.getMyAssignedTenders(authentication, pageable)
        );
    }

    // 2. Open all submitted bids for a tender
    @PostMapping("/tenders/{tenderId}/open-bids")
    public ResponseEntity<OpenBidsResponse> openBids(
            @PathVariable UUID tenderId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                evaluatorService.openBids(tenderId, authentication)
        );
    }

    // 3. View opened bids for a tender
    @GetMapping("/tenders/{tenderId}/bids")
    public ResponseEntity<List<EvaluatorBidResponse>> getTenderBids(
            @PathVariable UUID tenderId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                evaluatorService.getTenderBids(tenderId, authentication)
        );
    }

    // 4. Download a bid's proposal PDF
    @GetMapping("/bids/{bidId}/proposal")
    public ResponseEntity<byte[]> downloadProposal(
            @PathVariable UUID bidId,
            Authentication authentication
    ) {
        BidProposalDownload proposal =
                evaluatorService.downloadProposal(bidId, authentication);

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(
                MediaType.parseMediaType(proposal.contentType())
        );

        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename(proposal.fileName())
                        .build()
        );

        headers.setContentLength(proposal.fileData().length);

        return new ResponseEntity<>(
                proposal.fileData(),
                headers,
                HttpStatus.OK
        );
    }

    // 5. Save or update an evaluation draft
    @PutMapping("/bids/{bidId}/evaluation")
    public ResponseEntity<BidEvaluationResponse> saveBidEvaluation(
            @PathVariable UUID bidId,
            @Valid @RequestBody SaveBidEvaluationRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                evaluatorService.saveBidEvaluation(
                        bidId,
                        request,
                        authentication
                )
        );
    }


    // 6. Finalize an evaluation
    @PostMapping("/bids/{bidId}/evaluation/finalize")
    public ResponseEntity<BidEvaluationResponse> finalizeBidEvaluation(
            @PathVariable UUID bidId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                evaluatorService.finalizeBidEvaluation(
                        bidId,
                        authentication
                )
        );
    }


    // 7. View an evaluation
    @GetMapping("/bids/{bidId}/evaluation")
    public ResponseEntity<BidEvaluationResponse> getBidEvaluation(
            @PathVariable UUID bidId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                evaluatorService.getBidEvaluation(
                        bidId,
                        authentication
                )
        );
    }

    @GetMapping("/tenders/{tenderId}/award")
    public ResponseEntity<TenderAwardResponse> getTenderAward(
            @PathVariable UUID tenderId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                evaluatorService.getTenderAward(
                        tenderId,
                        authentication
                )
        );
    }
}
