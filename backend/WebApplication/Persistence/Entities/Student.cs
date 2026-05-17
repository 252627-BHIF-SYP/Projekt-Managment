namespace Persistence.Entities;

public class Student : Person
{
    public Student()
    {
        PersonType = PersonType.Student;
    }

    public ICollection<StudentClassHistory> StudentClassHistories { get; init; } = [];
}
