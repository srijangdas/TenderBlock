package icu.telepathystudios.puretender.service;


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

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenderService {

    private final TenderRepo tenderRepo;
    private final AuthRepo authRepo;

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
        tender.setEstimatedValue(request.estimatedValue());
        tender.setSubmissionDeadline(request.submissionDeadline());
        tender.setOpeningDate(request.openingDate());

        tender.setAuthority(authority);
        tender.setStatus(TenderStatus.SUBMITTED);

        return mapToResponse(tenderRepo.save(tender));
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
        tender.setEstimatedValue(request.estimatedValue());
        tender.setSubmissionDeadline(request.submissionDeadline());
        tender.setOpeningDate(request.openingDate());

        return mapToResponse(tenderRepo.save(tender));
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
