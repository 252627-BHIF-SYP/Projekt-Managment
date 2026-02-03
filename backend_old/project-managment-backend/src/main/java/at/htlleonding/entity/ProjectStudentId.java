package at.htlleonding.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ProjectStudentId implements Serializable {

    @Column(name = "project_id")
    public Long projectId;

    @Column(name = "history_id")
    public Long historyId;

    public ProjectStudentId() {
    }

    public ProjectStudentId(Long projectId, Long historyId) {
        this.projectId = projectId;
        this.historyId = historyId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProjectStudentId other)) return false;
        return Objects.equals(projectId, other.projectId) &&
                Objects.equals(historyId, other.historyId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(projectId, historyId);
    }
}
