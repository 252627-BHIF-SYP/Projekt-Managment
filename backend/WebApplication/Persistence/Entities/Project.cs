namespace Persistence.Entities;

public class Project : EntityObject
{
    public required string Title { get; set; }

    public required string Description { get; set; }

    public string? GithubUrl { get; set; }

    public string? LogoUrl { get; set; }

    public ProjectStatus Status { get; set; } = ProjectStatus.New;

    public string? Technology { get; set; }

    public ProjectType ProjectType { get; set; } = ProjectType.Others;

    public ICollection<ProjectStudent> ProjectStudents { get; init; } = [];

    public ICollection<ProjectSupervisor> ProjectSupervisors { get; init; } = [];

    public ICollection<SchoolYearProject> SchoolYearProjects { get; init; } = [];
}
