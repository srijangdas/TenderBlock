package icu.telepathystudios.puretender.repo.tender;

import icu.telepathystudios.puretender.model.classes.TenderAward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TenderAwardRepo
        extends JpaRepository<TenderAward, UUID> {

    Optional<TenderAward> findByTender_Id(UUID tenderId);

    boolean existsByTender_Id(UUID tenderId);
}