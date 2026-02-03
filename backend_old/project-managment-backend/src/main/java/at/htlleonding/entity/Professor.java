package at.htlleonding.entity;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "professor")
public class Professor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "professor_id")
    public Long id;

    @Column(name = "first_name", nullable = false, length = 80)
    public String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    public String lastName;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StudentClassHistory other)) return false;
        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return 31;
    }
}
