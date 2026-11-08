package icu.telepathystudios.puretender.model.classes;

import icu.telepathystudios.puretender.model.enums.EvaluationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "bid_evaluations",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_bid_evaluation_bid",
                        columnNames = "bid_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class BidEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bid_id", nullable = false, unique = true)
    private Bid bid;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evaluator_user_id", nullable = false)
    private User evaluator;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal technicalScore;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal financialScore;

    @Column(length = 5000)
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EvaluationStatus status = EvaluationStatus.DRAFT;

    private Instant evaluatedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(precision = 5, scale = 2)
    private BigDecimal totalScore;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
