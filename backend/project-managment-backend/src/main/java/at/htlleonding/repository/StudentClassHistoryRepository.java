package at.htlleonding.repository;

import at.htlleonding.entity.StudentClassHistory;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class StudentClassHistoryRepository implements PanacheRepository<StudentClassHistory> {
}
