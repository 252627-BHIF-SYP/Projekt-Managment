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

    public string? ApprovalNote { get; set; }

    public DateTime? SubmittedAtUtc { get; set; }

    public DateTime? ApprovedAtUtc { get; set; }

    public string? ApprovedByProfessorId { get; set; }

    public Professor? ApprovedByProfessor { get; set; }

    public bool IsExternal { get; set; } = false;

    public string? ExternalSchoolName { get; set; }

    public bool HasConsent { get; set; } = false;

    public DateTime? ConsentConfirmedAtUtc { get; set; }

    public string? ConsentConfirmedBy { get; set; }

    public ICollection<ProjectStudent> ProjectStudents { get; init; } = [];

    public ICollection<ProjectSupervisor> ProjectSupervisors { get; init; } = [];

    public ICollection<SchoolYearProject> SchoolYearProjects { get; init; } = [];

    public ICollection<CompetitionProject> CompetitionProjects { get; init; } = [];

    public ICollection<ScheduleSlot> ScheduleSlots { get; init; } = [];
}
