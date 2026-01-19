package at.htlleonding.entity;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "project")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_id")
    public Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "school_year_id", nullable = false)
    public SchoolYear schoolYear;

    @Column(name = "title", nullable = false, length = 200)
    public String title;

    @Column(name = "description", columnDefinition = "TEXT")
    public String description;

    @Column(name = "github_url", length = 500)
    public String githubUrl;

    @Column(name = "logo_url", length = 500)
    public String logoUrl;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Project other)) return false;
        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
