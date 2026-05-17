namespace Persistence.Entities;

public class StudentClass : EntityObject
{
    public required string Name { get; set; }

    public required string Branch { get; set; }

    public ICollection<StudentClassHistory> StudentClassHistories { get; init; } = [];
}
