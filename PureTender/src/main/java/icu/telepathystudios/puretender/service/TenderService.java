package icu.telepathystudios.puretender.service;


import icu.telepathystudios.puretender.dto.audit.CancelTenderRequest;
import icu.telepathystudios.puretender.dto.audit.TenderCancellationResponse;
import icu.telepathystudios.puretender.dto.tender.CreateTenderRequest;
import icu.telepathystudios.puretender.dto.tender.TenderResponse;
import icu.telepathystudios.puretender.dto.tender.UpdateTenderRequest;
import icu.telepathystudios.puretender.model.classes.Tender;
import icu.telepathystudios.puretender.model.classes.User;
import icu.telepathystudios.puretender.model.enums.AccountStatus;
import icu.telepathystudios.puretender.model.enums.Role;
import icu.telepathystudios.puretender.model.enums.TenderStatus;
import icu.telepathystudios.puretender.repo.AuthRepo;
import icu.telepathystudios.puretender.repo.tender.TenderRepo;
import icu.telepathystudios.puretender.service.blockchain.BlockchainRecordService;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.config.ConfigDataResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenderService {

    private final TenderRepo tenderRepo;
    private final AuthRepo authRepo;
    private final BlockchainRecordService blockchainRecordService;

    // CREATE TENDER
    @Transactional
    public TenderResponse createTender(
            Authentication authentication,
            CreateTenderRequest request
    ) {

        UUID authorityId = getUserIdFromAuthentication(authentication);

        User authority = getAuthority(authorityId);

        validateDates(
                request.submissionDeadline(),
                request.openingDate()
        );

        Tender tender = new Tender();

        tender.setTitle(request.title());
        tender.setDescription(request.description());
        tender.setEstimatedValue(request.estimatedValue().setScale(2, RoundingMode.UNNECESSARY));
        tender.setSubmissionDeadline(databasePrecision(request.submissionDeadline()));
        tender.setOpeningDate(databasePrecision(request.openingDate()));

        tender.setAuthority(authority);
        tender.setStatus(TenderStatus.SUBMITTED);

        Tender savedTender = tenderRepo.save(tender);
        blockchainRecordService.createTenderRecord(savedTender);
        return mapToResponse(savedTender);
    }

    // UPDATE TENDER
    @Transactional
    public TenderResponse updateTender(
            UUID tenderId,
            Authentication authentication,
            UpdateTenderRequest request
    ) {

        UUID authorityId = getUserIdFromAuthentication(authentication);

        Tender tender = tenderRepo
                .findByIdAndAuthority_Id(tenderId, authorityId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tender not found"
                ));

        if (tender.getStatus() != TenderStatus.SUBMITTED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only submitted tenders can be edited"
            );
        }

        validateDates(
                request.submissionDeadline(),
                request.openingDate()
        );

        tender.setTitle(request.title());
        tender.setDescription(request.description());
        tender.setEstimatedValue(request.estimatedValue().setScale(2, RoundingMode.UNNECESSARY));
        tender.setSubmissionDeadline(databasePrecision(request.submissionDeadline()));
        tender.setOpeningDate(databasePrecision(request.openingDate()));

        Tender savedTender = tenderRepo.save(tender);
        blockchainRecordService.updateTenderRecord(savedTender);
        return mapToResponse(savedTender);
    }

    // GET AUTHORITY'S TENDERS
    @Transactional(readOnly = true)
    public Page<TenderResponse> getMyTenders(
            Authentication authentication,
            Pageable pageable
    ) {
        UUID authorityId = getUserIdFromAuthentication(authentication);
        return tenderRepo
                .findAllByAuthority_Id(authorityId, pageable)
                .map(this::mapToResponse);
    }

    // GET PUBLISHED TENDERS
    @Transactional(readOnly = true)
    public Page<TenderResponse> getPublishedTenders(
            Pageable pageable
    ) {

        return tenderRepo
                .findAllByStatusOrderByPublishedAtDesc(
                        TenderStatus.PUBLISHED,
                        pageable
                )
                .map(this::mapToResponse);
    }

    // GET TENDER DETAILS
    @Transactional(readOnly = true)
    public TenderResponse getTender(
            UUID tenderId,
            Authentication authentication
    ) {

        UUID userId = getUserIdFromAuthentication(authentication);

        Tender tender = tenderRepo.findById(tenderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tender not found"
                ));

        boolean isOwner = tender.getAuthority()
                .getId()
                .equals(userId);

        boolean isPublished =
                tender.getStatus() == TenderStatus.PUBLISHED;

        if (!isOwner && !isPublished) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to view this tender"
            );
        }

        return mapToResponse(tender);
    }

    @Transactional(readOnly = true)
    public TenderResponse getTenderForAdminOrAuditor(UUID tenderId) {

        Tender tender = tenderRepo.findById(tenderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tender not found"
                ));

        return mapToResponse(tender);
    }

    @Transactional
    public TenderCancellationResponse cancelTender(
            UUID tenderId,
            CancelTenderRequest request,
            Authentication authentication
    ) {

        User authority = authRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        if (authority.getRole() != Role.AUTHORITY) {
            throw new AccessDeniedException("Only authorities can cancel tenders");
        }

        if (authority.getStatus() != AccountStatus.VERIFIED) {
            throw new AccessDeniedException("Your account is not verified");
        }

        Tender tender = tenderRepo.findById(tenderId)
                .orElseThrow(() -> new AccessDeniedException("Tender not found"));

        if (!tender.getAuthority().getId().equals(authority.getId())) {
            throw new AccessDeniedException(
                    "You can only cancel tenders created by your account"
            );
        }

        if (tender.getStatus() != TenderStatus.PUBLISHED
                && tender.getStatus() != TenderStatus.UNDER_EVALUATION) {

            throw new IllegalStateException(
                    "Only published or under-evaluation tenders can be cancelled"
            );
        }

        Instant now = Instant.now();

        tender.setStatus(TenderStatus.CANCELLED);
        tender.setCancellationReason(request.reason().trim());
        tender.setCancelledAt(now);
        tender.setCancelledBy(authority);

        tenderRepo.save(tender);

        return new TenderCancellationResponse(
                tender.getId(),
                tender.getTitle(),
                tender.getStatus().name(),
                tender.getCancellationReason(),
                authority.getFullName(),
                tender.getCancelledAt()
        );
    }

    // VALIDATE AUTHORITY
    private User getAuthority(UUID authorityId) {

        User authority = authRepo.findById(authorityId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authority user not found"
                ));

        if (authority.getRole() != Role.AUTHORITY) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only authority users can create tenders"
            );
        }

        if (authority.getStatus() != AccountStatus.VERIFIED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account must be verified to create tenders"
            );
        }

        return authority;
    }

    private UUID getUserIdFromAuthentication(
            Authentication authentication
    ) {
        return authRepo.findByEmail(authentication.getName().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User not found"
                ))
                .getId();
    }

    // VALIDATE TENDER DATES
    private void validateDates(
            Instant submissionDeadline,
            Instant openingDate
    ) {

        Instant now = Instant.now();

        if (!submissionDeadline.isAfter(now)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Submission deadline must be in the future"
            );
        }

        if (!openingDate.isAfter(submissionDeadline)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Opening date must be after submission deadline"
            );
        }
    }

    private Instant databasePrecision(Instant value) {
        return value.truncatedTo(ChronoUnit.MICROS);
    }

    // ENTITY TO DTO
    private TenderResponse mapToResponse(Tender tender) {

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
}
