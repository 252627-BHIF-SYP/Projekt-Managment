package at.htlleonding.entity;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "project_supervisor")
public class ProjectSupervisor {

    @EmbeddedId
    public ProjectSupervisorId id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @MapsId("projectId")
    @JoinColumn(name = "project_id", nullable = false)
    public Project project;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @MapsId("professorId")
    @JoinColumn(name = "professor_id", nullable = false)
    public Professor professor;

    public ProjectSupervisor() {
    }

    public ProjectSupervisor(Project project, Professor professor) {
        this.project = project;
        this.professor = professor;
        this.id = new ProjectSupervisorId(project.id, professor.id);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProjectSupervisor other)) return false;
        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
