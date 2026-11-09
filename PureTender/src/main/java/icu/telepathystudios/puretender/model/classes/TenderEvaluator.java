package icu.telepathystudios.puretender.model.classes;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "tender_evaluators",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_tender_evaluator_tender",
                        columnNames = "tender_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class TenderEvaluator {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tender_id", nullable = false)
    private Tender tender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Column(nullable = false, updatable = false)
    private Instant assignedAt;

    @PrePersist
    protected void onCreate() {
        assignedAt = Instant.now();
    }
}
