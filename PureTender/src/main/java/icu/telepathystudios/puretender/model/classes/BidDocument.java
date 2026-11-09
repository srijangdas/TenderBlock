package icu.telepathystudios.puretender.model.classes;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "bid_documents",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_bid_document_bid",
                        columnNames = "bid_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class BidDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bid_id", nullable = false, unique = true)
    private Bid bid;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false, columnDefinition = "BYTEA")
    private byte[] fileData;

    @Column(nullable = false, length = 64)
    private String sha256Hash;

    @Column(nullable = false, updatable = false)
    private Instant uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = Instant.now();
    }
}
