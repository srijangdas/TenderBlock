package icu.telepathystudios.puretender.controller;

import icu.telepathystudios.puretender.dto.bid.BidProposalDownload;
import icu.telepathystudios.puretender.dto.bid.BidResponse;
import icu.telepathystudios.puretender.dto.bid.CreateBidRequest;
import icu.telepathystudios.puretender.dto.bid.UpdateBidRequest;
import icu.telepathystudios.puretender.service.BidService;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;

import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bids")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CONTRACTOR')")
public class BidController {

    private final BidService bidService;

    // CREATE DRAFT BID
    @PostMapping("/tender/{tenderId}")
    @ResponseStatus(HttpStatus.CREATED)
    public BidResponse createBid(
            @PathVariable UUID tenderId,
            @Valid @RequestBody CreateBidRequest request,
            Authentication authentication
    ) {

        return bidService.createBid(
                tenderId,
                request,
                authentication
        );
    }

    // UPDATE DRAFT BID
    @PutMapping("/{bidId}")
    public BidResponse updateBid(
            @PathVariable UUID bidId,
            @Valid @RequestBody UpdateBidRequest request,
            Authentication authentication
    ) {

        return bidService.updateBid(
                bidId,
                request,
                authentication
        );
    }

    // SUBMIT BID
    @PostMapping("/{bidId}/submit")
    public BidResponse submitBid(
            @PathVariable UUID bidId,
            Authentication authentication
    ) {

        return bidService.submitBid(
                bidId,
                authentication
        );
    }

    // GET MY BIDS
    @GetMapping("/my")
    public Page<BidResponse> getMyBids(
            Authentication authentication,
            @PageableDefault(size = 10) Pageable pageable
    ) {

        return bidService.getMyBids(
                authentication,
                pageable
        );
    }

    // GET MY BID DETAILS
    @GetMapping("/{bidId}")
    public BidResponse getMyBid(
            @PathVariable UUID bidId,
            Authentication authentication
    ) {

        return bidService.getMyBid(
                bidId,
                authentication
        );
    }
    @PutMapping(
            value = "/{bidId}/proposal",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Void> uploadProposal(
            @PathVariable UUID bidId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {

        bidService.uploadProposal(
                bidId,
                file,
                authentication
        );

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{bidId}/proposal")
    public ResponseEntity<byte[]> downloadProposal(
            @PathVariable UUID bidId,
            Authentication authentication
    ) {

        BidProposalDownload proposal =
                bidService.downloadProposal(bidId, authentication);

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(proposal.fileName())
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        disposition.toString()
                )
                .body(proposal.fileData());
    }

}
