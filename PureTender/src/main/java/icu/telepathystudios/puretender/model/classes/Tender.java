package icu.telepathystudios.puretender.model.classes;

import icu.telepathystudios.puretender.model.enums.TenderStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenders")
@Getter
@Setter
@NoArgsConstructor
public class Tender {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal estimatedValue;

    @Column(nullable = false)
    private Instant submissionDeadline;

    @Column(nullable = false)
    private Instant openingDate;

    private Instant publishedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TenderStatus status = TenderStatus.SUBMITTED;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "authority_user_id", nullable = false)
    private User authority;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(length = 1000)
    private String rejectionReason;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    @Column(length = 2000)
    private String cancellationReason;

    private Instant cancelledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by_user_id")
    private User cancelledBy;
}