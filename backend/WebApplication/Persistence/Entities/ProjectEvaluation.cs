namespace Persistence.Entities;

public class ProjectEvaluation : EntityObject
{
    public int CompetitionId { get; set; }

    public Competition Competition { get; set; } = null!;

    public int ProjectId { get; set; }

    public Project Project { get; set; } = null!;

    public int JuryMemberId { get; set; }

    public JuryMember JuryMember { get; set; } = null!;

    public int CriterionId { get; set; }

    public EvaluationCriterion Criterion { get; set; } = null!;

    public double Score { get; set; }

    public string? Note { get; set; }

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
