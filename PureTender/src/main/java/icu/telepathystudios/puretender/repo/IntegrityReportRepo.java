package icu.telepathystudios.puretender.repo;

import icu.telepathystudios.puretender.model.classes.IntegrityReport;
import icu.telepathystudios.puretender.model.enums.IntegrityReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
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
}
