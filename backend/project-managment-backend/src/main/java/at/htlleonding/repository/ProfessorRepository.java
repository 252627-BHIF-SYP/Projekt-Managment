package at.htlleonding.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import at.htlleonding.entity.Professor;

@ApplicationScoped
public class ProfessorRepository implements PanacheRepository<Professor> {
}
