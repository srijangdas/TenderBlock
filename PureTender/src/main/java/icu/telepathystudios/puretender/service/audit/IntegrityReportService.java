package icu.telepathystudios.puretender.service.audit;

import icu.telepathystudios.puretender.model.classes.Bid;
import icu.telepathystudios.puretender.model.classes.IntegrityReport;
import icu.telepathystudios.puretender.model.classes.Tender;
import icu.telepathystudios.puretender.model.classes.TenderAward;
import icu.telepathystudios.puretender.model.enums.*;
import icu.telepathystudios.puretender.repo.*;

import icu.telepathystudios.puretender.repo.bid.BidRepo;
import icu.telepathystudios.puretender.repo.tender.TenderAwardRepo;
import icu.telepathystudios.puretender.repo.tender.TenderRepo;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IntegrityReportService {

    private final TenderRepo tenderRepo;
    private final BidRepo bidRepo;
    private final TenderAwardRepo tenderAwardRepo;
    private final IntegrityReportRepo integrityReportRepo;

    // Called internally when system/blockchain verification finds a discrepancy.
    @Transactional
    public IntegrityReport createSystemReport(
            UUID tenderId,
            UUID bidId,
            IntegrityReportType type,
            String description,
            String evidenceReference
    ) {

        Tender tender = tenderRepo.findById(tenderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tender not found."
                ));

        TenderAward award = tenderAwardRepo.findByTender_Id(tenderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "An integrity report can only be generated for an awarded tender."
                ));

        if (tender.getStatus() != TenderStatus.AWARDED &&
                tender.getStatus() != TenderStatus.VOIDED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The tender is not in an awarded state."
            );
        }

        Bid bid = null;

        if (bidId != null) {
            bid = bidRepo.findById(bidId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Bid not found."
                    ));

            if (!bid.getTender().getId().equals(tenderId)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "The specified bid does not belong to this tender."
                );
            }
        }

        IntegrityReport report = new IntegrityReport();

        report.setTender(tender);
        report.setBid(bid);
        report.setType(type);
        report.setSource(IntegrityReportSource.BLOCKCHAIN_VERIFICATION);
        report.setDescription(description);
        report.setEvidenceReference(evidenceReference);
        report.setStatus(IntegrityReportStatus.OPEN);

        IntegrityReport savedReport = integrityReportRepo.save(report);

        // Update the award's verification status.
        if (award.getVerificationStatus() != VerificationStatus.FAILED &&
                award.getVerificationStatus() != VerificationStatus.UNDER_AUDIT) {

            award.setVerificationStatus(
                    VerificationStatus.DISCREPANCY_FOUND
            );

            tenderAwardRepo.save(award);
        }

        return savedReport;
    }
}
