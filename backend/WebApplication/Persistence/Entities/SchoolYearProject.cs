namespace Persistence.Entities;

public class SchoolYearProject : EntityObject
{
    public int SchoolYearId { get; set; }
    public SchoolYear? SchoolYear { get; set; }

    public int ProjectId { get; set; }
    public Project? Project { get; set; }
}
