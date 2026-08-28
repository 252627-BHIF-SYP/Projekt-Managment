namespace Persistence.Entities;

public class Competition : EntityObject
{
    public required string Name { get; set; }

    public CompetitionType CompetitionType { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public int PresentationDurationMinutes { get; set; } = 10;

    public int BreakDurationMinutes { get; set; } = 5;

    public string AllowedClassTypes { get; set; } = "Alle";

    public CompetitionStatus Status { get; set; } = CompetitionStatus.Active;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<CompetitionProject> CompetitionProjects { get; init; } = [];

    public ICollection<ScheduleSlot> ScheduleSlots { get; init; } = [];

    public ICollection<EvaluationCriterion> EvaluationCriteria { get; init; } = [];

    public ICollection<JuryMember> JuryMembers { get; init; } = [];

    public ICollection<ProjectEvaluation> Evaluations { get; init; } = [];

    public ICollection<CompetitionAward> Awards { get; init; } = [];
}
