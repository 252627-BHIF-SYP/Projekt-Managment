namespace Persistence.Entities;

public class CompetitionProject
{
    public int CompetitionId { get; set; }

    public Competition Competition { get; set; } = null!;

    public int ProjectId { get; set; }

    public Project Project { get; set; } = null!;

    public DateTime JoinedAtUtc { get; set; } = DateTime.UtcNow;

    public string? Note { get; set; }

    public bool HasConsent { get; set; } = false;

    public DateTime? ConsentConfirmedAtUtc { get; set; }
}
