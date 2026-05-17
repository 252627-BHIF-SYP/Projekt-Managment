namespace Persistence.Entities;

public class ProjectStudent : EntityObject
{
    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public int HistoryId { get; set; }
    public StudentClassHistory? StudentClassHistory { get; set; }

    public required string Role { get; set; }
}
