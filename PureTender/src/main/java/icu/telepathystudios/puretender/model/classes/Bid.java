package icu.telepathystudios.puretender.model.classes;

import icu.telepathystudios.puretender.model.enums.BidStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "bids",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_tender_contractor",
                        columnNames = {"tender_id", "contractor_user_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tender_id", nullable = false)
    private Tender tender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contractor_user_id", nullable = false)
    private User contractor;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal quotedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BidStatus status = BidStatus.DRAFT;

    private Instant submittedAt;

    private Instant openedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToOne(
            mappedBy = "bid",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private BidDocument proposal;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}