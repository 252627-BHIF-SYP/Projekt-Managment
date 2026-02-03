package at.htlleonding.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import at.htlleonding.entity.SchoolYear;

@ApplicationScoped
public class SchoolYearRepository implements PanacheRepository<SchoolYear> {
}
