package at.htlleonding.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import at.htlleonding.entity.Student;

@ApplicationScoped
public class StudentRepository implements PanacheRepository<Student> {
}
