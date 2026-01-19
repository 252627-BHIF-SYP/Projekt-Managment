package at.htlleonding.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import at.htlleonding.entity.SchoolClass;

@ApplicationScoped
public class SchoolClassRepository implements PanacheRepository<SchoolClass> {
}
