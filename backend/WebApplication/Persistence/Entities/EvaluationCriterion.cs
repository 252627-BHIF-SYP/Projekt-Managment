namespace Persistence.Entities;

public class EvaluationCriterion : EntityObject
{
    public int CompetitionId { get; set; }

    public Competition Competition { get; set; } = null!;

    public required string Name { get; set; }

    public string? Description { get; set; }

    public int MinScore { get; set; } = 0;

    public int MaxScore { get; set; } = 10;

    public double Weight { get; set; } = 1.0;

    public int OrderIndex { get; set; } = 0;

    public ICollection<ProjectEvaluation> Evaluations { get; init; } = [];
}
