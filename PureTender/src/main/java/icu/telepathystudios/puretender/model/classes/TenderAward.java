package icu.telepathystudios.puretender.model.classes;

import icu.telepathystudios.puretender.model.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "tender_awards",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_tender_award_tender",
                        columnNames = "tender_id"
                ),
                @UniqueConstraint(
                        name = "uk_tender_award_winning_bid",
                        columnNames = "winning_bid_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class TenderAward {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tender_id", nullable = false, unique = true)
    private Tender tender;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "winning_bid_id", nullable = false, unique = true)
    private Bid winningBid;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "triggered_by_user_id", nullable = false)
    private User triggeredBy;

    @Column(length = 2000)
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private VerificationStatus verificationStatus =
            VerificationStatus.PENDING;


    @Column(nullable = false, updatable = false)
    private Instant awardedAt;

    @PrePersist
    protected void onCreate() {
        awardedAt = Instant.now();
    }
}