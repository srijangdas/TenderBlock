package icu.telepathystudios.puretender.service.blockchain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import icu.telepathystudios.puretender.model.classes.Bid;
import icu.telepathystudios.puretender.model.classes.BidDocument;
import icu.telepathystudios.puretender.model.classes.Tender;
import icu.telepathystudios.puretender.repo.bid.BidDocumentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BlockchainRecordService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final FabricService fabricService;
    private final DocumentHashService documentHashService;
    private final BidDocumentRepo bidDocumentRepo;

    //region Tender integrity records
    public void createTenderRecord(Tender tender) {
        submit(true, tenderLedgerId(tender), "TENDER", "", hashTender(tender));
    }

    private Map<String, Object> payLoadExtract(Tender tender) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", tender.getId().toString());
        payload.put("title", tender.getTitle());
        payload.put("description", tender.getDescription());
        payload.put("estimatedValue", tender.getEstimatedValue().toPlainString());
        payload.put("submissionDeadline", tender.getSubmissionDeadline().toString());
        payload.put("openingDate", tender.getOpeningDate().toString());
        payload.put("authorityId", tender.getAuthority().getId().toString());

        return payload;
    }

    public void updateTenderRecord(Tender tender) {
        submit(false, tenderLedgerId(tender), "TENDER", "", hashTender(tender));
    }

    public String hashTender(Tender tender) {
        return hash(payLoadExtract(tender));
    }

    //endregion

    //region Ledger reads and bid integrity records
    public boolean integrityRecordExists(String recordId) throws Exception {
        return fabricService.integrityRecordExists(recordId);
    }

    public String readIntegrityRecord(String recordId) throws Exception {
        return fabricService.readIntegrityRecord(recordId);
    }

    public void createBidRecord(Bid bid) {
        writeBidRecord(bid, true, null);
    }

    public void updateBidRecord(Bid bid, BidDocument document) {
        writeBidRecord(bid, false, document);
    }

    private void writeBidRecord(Bid bid, boolean create, BidDocument suppliedDocument) {
        BidDocument document = suppliedDocument != null
                ? suppliedDocument
                : bidDocumentRepo.findByBid_Id(bid.getId())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "A proposal PDF is required to record a submitted bid"
                        ));

        if (!documentHashService.matches(document.getFileData(), document.getSha256Hash())) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Proposal PDF failed its integrity check"
            );
        }

        String payloadHash = hashBid(bid, document);
        submit(create, bidLedgerId(bid), "BID",
                tenderLedgerId(bid.getTender()), payloadHash);
    }

    public String hashBid(Bid bid, BidDocument document) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", bid.getId().toString());
        payload.put("tenderId", bid.getTender().getId().toString());
        payload.put("contractorId", bid.getContractor().getId().toString());
        payload.put("quotedAmount", bid.getQuotedAmount().toPlainString());
        payload.put("submittedAt", bid.getSubmittedAt().toString());
        payload.put("proposalSha256", document.getSha256Hash());

        return hash(payload);
    }

    //endregion

    //region Ledger identifiers, payload hashing, and submission
    private String tenderLedgerId(Tender tender) {
        return "TENDER:" + tender.getId();
    }

    private String bidLedgerId(Bid bid) {
        return "BID:" + bid.getId();
    }

    private String hash(Map<String, Object> payload) {
        try {
            return documentHashService.sha256(OBJECT_MAPPER.writeValueAsBytes(payload));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialize blockchain commitment", e);
        }
    }

    private void submit(
            boolean create,
            String id,
            String type,
            String parentId,
            String payloadHash
    ) {
        try {
            if (create) {
                fabricService.createIntegrityRecord(id, type, parentId, payloadHash);
            } else {
                fabricService.updateIntegrityRecord(id, payloadHash);
            }
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not commit the record to Hyperledger Fabric",
                    e
            );
        }
    }
    //endregion
}
