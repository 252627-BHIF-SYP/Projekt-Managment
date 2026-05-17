namespace Persistence.Entities;

public class ProjectSupervisor : EntityObject
{
    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public required string ProfessorId { get; set; }
    public Professor? Professor { get; set; }

    public required string Role { get; set; }
}
