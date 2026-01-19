package at.htlleonding.entity;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "change_request")
public class ChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "change_id")
    public Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    public Project project;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_history_id", nullable = false)
    public StudentClassHistory requestedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_professor_id")
    public Professor approvedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    public ChangeRequestStatus status;

    @Column(name = "new_title", length = 200)
    public String newTitle;

    @Column(name = "new_description", columnDefinition = "TEXT")
    public String newDescription;

    @Column(name = "new_github_url", length = 500)
    public String newGithubUrl;

    @Column(name = "new_logo_url", length = 500)
    public String newLogoUrl;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ChangeRequest other)) return false;
        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
