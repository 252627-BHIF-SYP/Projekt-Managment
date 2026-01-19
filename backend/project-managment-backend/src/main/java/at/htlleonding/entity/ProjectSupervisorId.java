package at.htlleonding.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ProjectSupervisorId implements Serializable {

    @Column(name = "project_id")
    public Long projectId;

    @Column(name = "professor_id")
    public Long professorId;

    public ProjectSupervisorId() {
    }

    public ProjectSupervisorId(Long projectId, Long professorId) {
        this.projectId = projectId;
        this.professorId = professorId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProjectSupervisorId other)) return false;
        return Objects.equals(projectId, other.projectId) &&
                Objects.equals(professorId, other.professorId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(projectId, professorId);
    }
}
