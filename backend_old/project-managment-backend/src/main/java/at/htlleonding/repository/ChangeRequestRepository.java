package at.htlleonding.repository;

import at.htlleonding.entity.ChangeRequest;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ChangeRequestRepository implements PanacheRepository<ChangeRequest> {
}
