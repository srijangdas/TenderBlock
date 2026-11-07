package icu.telepathystudios.puretender.repo;

import icu.telepathystudios.puretender.model.classes.Bid;
import icu.telepathystudios.puretender.model.enums.BidStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BidRepo extends JpaRepository<Bid, UUID> {

    // All bids submitted by a contractor
    Page<Bid> findAllByContractor_Id(
            UUID contractorId,
            Pageable pageable
    );

    // Bids submitted against a particular tender
    Page<Bid> findAllByTender_Id(
            UUID tenderId,
            Pageable pageable
    );

    // Find a contractor's bid for a particular tender
    Optional<Bid> findByTender_IdAndContractor_Id(
            UUID tenderId,
            UUID contractorId
    );

    // Check whether contractor already has a bid
    boolean existsByTender_IdAndContractor_Id(
            UUID tenderId,
            UUID contractorId
    );

    // Retrieve bids by tender and status
    Page<Bid> findAllByTender_IdAndStatus(
            UUID tenderId,
            BidStatus status,
            Pageable pageable
    );

    // Retrieve bids by contractor and status
    Page<Bid> findAllByContractor_IdAndStatus(
            UUID contractorId,
            BidStatus status,
            Pageable pageable
    );

    // Count submitted bids for a tender
    long countByTender_IdAndStatus(
            UUID tenderId,
            BidStatus status
    );
}
