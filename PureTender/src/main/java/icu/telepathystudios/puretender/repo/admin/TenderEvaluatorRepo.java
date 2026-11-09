package icu.telepathystudios.puretender.repo.admin;


import icu.telepathystudios.puretender.model.classes.TenderEvaluator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TenderEvaluatorRepo
        extends JpaRepository<TenderEvaluator, UUID> {

    Optional<TenderEvaluator> findByTender_Id(UUID tenderId);

    boolean existsByTender_Id(UUID tenderId);

    boolean existsByTender_IdAndEvaluator_Id(
            UUID tenderId,
            UUID evaluatorId
    );

    Page<TenderEvaluator> findAllByEvaluator_Id(
            UUID evaluatorId,
            Pageable pageable
    );
}
