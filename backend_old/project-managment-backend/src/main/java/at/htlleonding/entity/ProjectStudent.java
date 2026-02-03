package at.htlleonding.entity;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "project_student")
public class ProjectStudent {

    @EmbeddedId
    public ProjectStudentId id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @MapsId("projectId")
    @JoinColumn(name = "project_id", nullable = false)
    public Project project;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @MapsId("historyId")
    @JoinColumn(name = "history_id", nullable = false)
    public StudentClassHistory history;

    public ProjectStudent() {
    }

    public ProjectStudent(Project project, StudentClassHistory history) {
        this.project = project;
        this.history = history;
        this.id = new ProjectStudentId(project.id, history.id);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProjectStudent other)) return false;
        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
