package icu.telepathystudios.puretender.repo;

import icu.telepathystudios.puretender.model.classes.IntegrityReport;
import icu.telepathystudios.puretender.model.enums.IntegrityReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IntegrityReportRepo
        extends JpaRepository<IntegrityReport, UUID> {

    Page<IntegrityReport> findAllByOrderByCreatedAtDesc(
            Pageable pageable
    );

    boolean existsByTender_IdAndStatusIn(
            UUID tenderId,
            Collection<IntegrityReportStatus> statuses
    );

    boolean existsByTender_IdAndStatus(
            UUID tenderId,
            IntegrityReportStatus status
    );

    List<IntegrityReport> findAllByTender_IdOrderByCreatedAtDesc(UUID tenderId);

    long countByTender_Id(UUID tenderId);

    Optional<IntegrityReport> findFirstByTender_IdOrderByCreatedAtDesc(UUID tenderId);

    Optional<IntegrityReport> findFirstByTender_IdAndBid_IdAndTypeAndStatusIn(
            UUID tenderId,
            UUID bidId,
            icu.telepathystudios.puretender.model.enums.IntegrityReportType type,
            Collection<IntegrityReportStatus> statuses
    );
}
