namespace Persistence.Entities;

public class CompetitionAward : EntityObject
{
    public int CompetitionId { get; set; }

    public Competition Competition { get; set; } = null!;

    public required string Name { get; set; }

    public int? Rank { get; set; }

    public string? PrizeDetails { get; set; }

    public int? WinningProjectId { get; set; }

    public Project? WinningProject { get; set; }

    public DateTime? AwardedAtUtc { get; set; }
}
