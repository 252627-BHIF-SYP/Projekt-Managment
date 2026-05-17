namespace Persistence.Entities;

public class StudentClassHistory : EntityObject
{
    public required string StudentId { get; set; }
    public Student? Student { get; set; }

    public int ClassId { get; set; }
    public StudentClass? StudentClass { get; set; }

    public int SchoolYearId { get; set; }
    public SchoolYear? SchoolYear { get; set; }

    public ICollection<ProjectStudent> ProjectStudents { get; init; } = [];
}
