package icu.telepathystudios.puretender.repo.bid;

import icu.telepathystudios.puretender.model.classes.BidDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BidDocumentRepo
        extends JpaRepository<BidDocument, UUID> {

    Optional<BidDocument> findByBid_Id(UUID bidId);

    boolean existsByBid_Id(UUID bidId);
}