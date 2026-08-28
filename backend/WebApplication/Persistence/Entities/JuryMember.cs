namespace Persistence.Entities;

public class JuryMember : EntityObject
{
    public int CompetitionId { get; set; }

    public Competition Competition { get; set; } = null!;

    public string? ProfessorId { get; set; }

    public Professor? Professor { get; set; }

    public string? ExternalName { get; set; }

    public string? ExternalEmail { get; set; }

    public string Role { get; set; } = "Juror";

    public DateTime AddedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<ProjectEvaluation> Evaluations { get; init; } = [];
}
