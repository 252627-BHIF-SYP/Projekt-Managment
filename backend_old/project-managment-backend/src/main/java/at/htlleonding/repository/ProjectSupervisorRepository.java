package at.htlleonding.repository;

import at.htlleonding.entity.ProjectSupervisor;
import at.htlleonding.entity.ProjectSupervisorId;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProjectSupervisorRepository implements PanacheRepositoryBase<ProjectSupervisor, ProjectSupervisorId> {
}
