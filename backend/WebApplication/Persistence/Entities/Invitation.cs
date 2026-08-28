namespace Persistence.Entities;

public class Invitation : EntityObject
{
    public required string Email { get; set; }
    public required string RecipientName { get; set; }
    public string? SchoolName { get; set; }
    public InvitationRole TargetRole { get; set; }
    public int? CompetitionId { get; set; }
    public Competition? Competition { get; set; }
    public int? ProjectId { get; set; }
    public Project? Project { get; set; }
    public required string Token { get; set; }
    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAtUtc { get; set; } = DateTime.UtcNow.AddDays(14);
    public DateTime? AcceptedAtUtc { get; set; }
    public string? CreatedByUserId { get; set; }
}
