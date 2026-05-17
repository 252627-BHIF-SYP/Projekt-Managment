namespace Services.Interfaces;

public record AdminStatsDto(
    int SchoolYearsCount,
    int StudentClassesCount,
    int ProjectsCount,
    int ProjectsInProgress,
    int ProjectsCompleted,
    int StudentsCount,
    int ProfessorsCount);

public interface IAdminService
{
    Task<AdminStatsDto> GetStatsAsync();
}
