namespace Persistence.Entities;

public class SchoolYear : EntityObject
{
    public required string Year { get; set; }

    public ICollection<StudentClassHistory> StudentClassHistories { get; init; } = [];

    public ICollection<SchoolYearProject> SchoolYearProjects { get; init; } = [];
}
