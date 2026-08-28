namespace Persistence.Entities;

public class ScheduleSlot : EntityObject
{
    public int CompetitionId { get; set; }

    public Competition Competition { get; set; } = null!;

    public int? ProjectId { get; set; }

    public Project? Project { get; set; }

    public ScheduleSlotType SlotType { get; set; } = ScheduleSlotType.Presentation;

    public DateOnly Date { get; set; }

    public TimeOnly StartTime { get; set; }

    public int DurationMinutes { get; set; } = 10;

    public required string Title { get; set; }

    public string? Note { get; set; }
}
