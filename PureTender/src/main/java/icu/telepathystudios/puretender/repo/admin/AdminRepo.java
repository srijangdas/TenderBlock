package icu.telepathystudios.puretender.repo.admin;

import icu.telepathystudios.puretender.model.enums.AccountStatus;
import icu.telepathystudios.puretender.model.classes.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AdminRepo extends JpaRepository<User, UUID> {

    Page<User> findAllByStatus(
            AccountStatus status,
            Pageable pageable
    );

    Page<User> findAllByStatusNot(
            AccountStatus status,
            Pageable pageable
    );
}
