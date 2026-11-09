package icu.telepathystudios.puretender.model.classes;

import icu.telepathystudios.puretender.model.enums.IntegrityReportSource;
import icu.telepathystudios.puretender.model.enums.IntegrityReportStatus;
import icu.telepathystudios.puretender.model.enums.IntegrityReportType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "integrity_reports")
@Getter
@Setter
@NoArgsConstructor
public class IntegrityReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tender_id", nullable = false)
    private Tender tender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bid_id")
    private Bid bid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_auditor_user_id")
    private User assignedAuditor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private IntegrityReportType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private IntegrityReportSource source;

    @Column(nullable = false, length = 5000)
    private String description;

    @Column(length = 1000)
    private String evidenceReference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private IntegrityReportStatus status = IntegrityReportStatus.OPEN;

    @Column(length = 5000)
    private String resolutionNotes;

    private Instant resolvedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

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
