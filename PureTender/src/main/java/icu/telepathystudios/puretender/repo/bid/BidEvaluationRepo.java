package icu.telepathystudios.puretender.repo.bid;

import icu.telepathystudios.puretender.model.classes.BidEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BidEvaluationRepo
        extends JpaRepository<BidEvaluation, UUID> {

    Optional<BidEvaluation> findByBid_Id(UUID bidId);

    boolean existsByBid_Id(UUID bidId);
}
