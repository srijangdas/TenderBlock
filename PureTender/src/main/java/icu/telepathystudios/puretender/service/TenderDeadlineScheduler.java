package icu.telepathystudios.puretender.service;

import icu.telepathystudios.puretender.model.classes.Tender;
import icu.telepathystudios.puretender.model.enums.BidStatus;
import icu.telepathystudios.puretender.model.enums.TenderStatus;
import icu.telepathystudios.puretender.repo.bid.BidRepo;
import icu.telepathystudios.puretender.repo.tender.TenderRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenderDeadlineScheduler {
    private static final String NO_BIDS_REASON =
            "Automatically cancelled because no bids were submitted before the deadline.";

    private final TenderRepo tenderRepo;
    private final BidRepo bidRepo;

    @Scheduled(fixedDelayString = "${tender.auto-cancel.fixed-delay-ms:60000}")
    @Transactional
    public void cancelExpiredTendersWithoutBids() {
        Instant now = Instant.now();
        var expiredTenders = tenderRepo.findAllByStatusAndSubmissionDeadlineLessThanEqual(
                TenderStatus.PUBLISHED,
                now
        );

        for (Tender tender : expiredTenders) {
            if (bidRepo.countByTender_IdAndStatus(tender.getId(), BidStatus.SUBMITTED) == 0) {
                tender.setStatus(TenderStatus.CANCELLED);
                tender.setCancellationReason(NO_BIDS_REASON);
                tender.setCancelledAt(now);
                tender.setCancelledBy(null); // System action; no user initiated the cancellation.
                log.info("Automatically cancelled tender {} because its deadline passed with no submitted bids", tender.getId());
            }
        }
    }
}
