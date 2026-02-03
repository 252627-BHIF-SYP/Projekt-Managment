package at.htlleonding.entity;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "class")
public class SchoolClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "class_id")
    public Long id;

    @Column(name = "name", nullable = false, length = 50)
    public String name;

    @Column(name = "year_level", nullable = false)
    public Integer yearLevel;

    @Column(name = "branch", nullable = false, length = 50)
    public String branch;

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
