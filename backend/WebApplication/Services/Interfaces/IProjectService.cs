using Persistence.Entities;
using Services.Results;

namespace Services.Interfaces;

public record SchoolYearDto(int SchoolYearId, string Year);

public record ProjectStudentDto(
    int ProjectStudentId,
    int HistoryId,
    string StudentId,
    string FirstName,
    string LastName,
    string ClassName,
    string Branch,
    int SchoolYearId,
    string SchoolYear,
    string Role);

public record ProjectStudentWriteDto(int HistoryId, string Role);

public record ProjectSupervisorDto(
    int ProjectSupervisorId,
    string ProfessorId,
    string FirstName,
    string LastName,
    string Role);

public record ProjectSupervisorWriteDto(string ProfessorId, string Role);

public record ProjectDto(
    int ProjectId,
    string Title,
    string Description,
    string? GithubUrl,
    string? LogoUrl,
    ProjectStatus Status,
    string? Technology,
    ProjectType ProjectType,
    IReadOnlyList<SchoolYearDto> SchoolYears,
    IReadOnlyList<ProjectStudentDto> Students,
    IReadOnlyList<ProjectSupervisorDto> Supervisors);

public record UpsertProjectDto(
    string Title,
    string Description,
    string? GithubUrl,
    string? LogoUrl,
    ProjectStatus Status,
    string? Technology,
    ProjectType ProjectType,
    IReadOnlyList<int> SchoolYearIds,
    IReadOnlyList<ProjectStudentWriteDto> Students,
    IReadOnlyList<ProjectSupervisorWriteDto> Supervisors);

public record ProjectFilterDto(
    string? SearchTerm,
    int? SchoolYearId,
    int? ClassId,
    string? SupervisorId,
    ProjectType? ProjectType,
    ProjectStatus? Status);

public interface IProjectService
{
    Task<IReadOnlyList<ProjectDto>> GetProjectsAsync(ProjectFilterDto filter);
    Task<ProjectDto?> GetProjectByIdAsync(int id);
    Task<ServiceResult<ProjectDto>> CreateProjectAsync(UpsertProjectDto dto);
    Task<ServiceResult<ProjectDto>> UpdateProjectAsync(int id, UpsertProjectDto dto, string? requesterId, bool requesterCanAdministrate);
    Task<ServiceResult> DeleteProjectAsync(int id, string? requesterId, bool requesterCanAdministrate);
    Task<int> CountProjectsAsync();
    Task<IReadOnlyList<ProjectCountPerYearDto>> GetProjectCountPerYearAsync();
}

public record ProjectCountPerYearDto(int SchoolYearId, string Year, int ProjectCount);
