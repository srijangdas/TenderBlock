package icu.telepathystudios.puretender.repo;

import icu.telepathystudios.puretender.model.CompanyProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CompanyProfileRepo extends JpaRepository<CompanyProfile, UUID> {
    Optional<CompanyProfile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}
