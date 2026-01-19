package at.htlleonding.repository;

import at.htlleonding.entity.ProjectStudent;
import at.htlleonding.entity.ProjectStudentId;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProjectStudentRepository implements PanacheRepositoryBase<ProjectStudent, ProjectStudentId> {
}
