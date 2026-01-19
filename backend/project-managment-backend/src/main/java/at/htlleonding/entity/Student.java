package at.htlleonding.entity;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_id")
    public Long id;

    @Column(name = "first_name", nullable = false, length = 80)
    public String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    public String lastName;

    @Column(name = "if_name", length = 80)
    public String ifName;

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
