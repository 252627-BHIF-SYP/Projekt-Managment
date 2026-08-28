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

public record ProjectApprovalDto(string? Note);

public record ProjectDto(
    int ProjectId,
    string Title,
    string Description,
    string? GithubUrl,
    string? LogoUrl,
    ProjectStatus Status,
    string? Technology,
    ProjectType ProjectType,
    string? ApprovalNote,
    DateTime? SubmittedAtUtc,
    DateTime? ApprovedAtUtc,
    string? ApprovedByProfessorId,
    string? ApprovedByProfessorName,
    bool IsExternal,
    string? ExternalSchoolName,
    bool HasConsent,
    DateTime? ConsentConfirmedAtUtc,
    string? ConsentConfirmedBy,
    IReadOnlyList<SchoolYearDto> SchoolYears,
    IReadOnlyList<ProjectStudentDto> Students,
    IReadOnlyList<ProjectSupervisorDto> Supervisors);

public record CreateProjectDto(
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

public record UpdateProjectDto(
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

public record ProjectActorDto(
    string? Username,
    bool IsAdmin,
    bool IsProfessor,
    bool IsStudent,
    bool IsAuthenticated);

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
    Task<IReadOnlyList<ProjectDto>> GetAssignedProjectsAsync(ProjectFilterDto filter, ProjectActorDto actor);
    Task<IReadOnlyList<ProjectDto>> GetStudentProjectsAsync(string studentId, ProjectFilterDto filter);
    Task<IReadOnlyList<ProjectDto>> GetProfessorProjectsAsync(string professorId, ProjectFilterDto filter);
    Task<ProjectDto?> GetProjectByIdAsync(int id);
    Task<ServiceResult<ProjectDto>> CreateProjectAsync(CreateProjectDto dto);
    Task<ServiceResult<ProjectDto>> UpdateProjectAsync(int id, UpdateProjectDto dto, ProjectActorDto actor);
    Task<ServiceResult> DeleteProjectAsync(int id, ProjectActorDto actor);
    Task<ServiceResult<ProjectPermissionDto>> GetProjectPermissionsAsync(int id, ProjectActorDto actor);
    Task<int> CountProjectsAsync();
    Task<IReadOnlyList<ProjectCountPerYearDto>> GetProjectCountPerYearAsync();

    // Workflow methods
    Task<ServiceResult<ProjectDto>> SubmitForApprovalAsync(int id, ProjectActorDto actor);
    Task<ServiceResult<ProjectDto>> ApproveProjectAsync(int id, ProjectApprovalDto dto, ProjectActorDto actor);
    Task<ServiceResult<ProjectDto>> RejectProjectAsync(int id, ProjectApprovalDto dto, ProjectActorDto actor);
    Task<ServiceResult<ProjectDto>> PublishProjectAsync(int id, ProjectApprovalDto dto, ProjectActorDto actor);
    Task<IReadOnlyList<ProjectDto>> GetPendingApprovalsAsync(ProjectFilterDto filter, ProjectActorDto actor);
}

public record ProjectCountPerYearDto(int SchoolYearId, string Year, int ProjectCount);

public record ProjectPermissionDto(bool CanEdit, bool CanDelete);
