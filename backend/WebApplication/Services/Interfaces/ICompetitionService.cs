using Persistence.Entities;
using Services.Results;

namespace Services.Interfaces;

public record CompetitionProjectDto(
    int ProjectId,
    string Title,
    string Description,
    string? GithubUrl,
    string? LogoUrl,
    ProjectStatus Status,
    ProjectType ProjectType,
    string? Technology,
    DateTime JoinedAtUtc,
    string? Note);

public record ScheduleSlotDto(
    int ScheduleSlotId,
    int CompetitionId,
    int? ProjectId,
    string? ProjectTitle,
    ScheduleSlotType SlotType,
    DateOnly Date,
    TimeOnly StartTime,
    int DurationMinutes,
    string Title,
    string? Note);

public record CompetitionSummaryDto(
    int CompetitionId,
    string Name,
    CompetitionType CompetitionType,
    DateOnly StartDate,
    DateOnly? EndDate,
    int PresentationDurationMinutes,
    int BreakDurationMinutes,
    string AllowedClassTypes,
    CompetitionStatus Status,
    DateTime CreatedAtUtc,
    int ProjectCount,
    int SlotCount);

public record CompetitionDto(
    int CompetitionId,
    string Name,
    CompetitionType CompetitionType,
    DateOnly StartDate,
    DateOnly? EndDate,
    int PresentationDurationMinutes,
    int BreakDurationMinutes,
    string AllowedClassTypes,
    CompetitionStatus Status,
    DateTime CreatedAtUtc,
    IReadOnlyList<CompetitionProjectDto> Projects,
    IReadOnlyList<ScheduleSlotDto> ScheduleSlots);

public record CreateCompetitionDto(
    string Name,
    CompetitionType CompetitionType,
    DateOnly StartDate,
    DateOnly? EndDate,
    int PresentationDurationMinutes,
    int BreakDurationMinutes,
    string AllowedClassTypes);

public record UpdateCompetitionDto(
    string Name,
    CompetitionType CompetitionType,
    DateOnly StartDate,
    DateOnly? EndDate,
    int PresentationDurationMinutes,
    int BreakDurationMinutes,
    string AllowedClassTypes);

public record SetCompetitionProjectsDto(IReadOnlyList<int> ProjectIds);

public record CreateScheduleSlotDto(
    int? ProjectId,
    ScheduleSlotType SlotType,
    DateOnly Date,
    TimeOnly StartTime,
    int DurationMinutes,
    string Title,
    string? Note);

public record UpdateScheduleSlotDto(
    int? ProjectId,
    ScheduleSlotType SlotType,
    DateOnly Date,
    TimeOnly StartTime,
    int DurationMinutes,
    string Title,
    string? Note);

public record SchedulePdfResultDto(byte[] Bytes, string ContentType, string FileName);

public interface ICompetitionService
{
    Task<IReadOnlyList<CompetitionSummaryDto>> GetCompetitionsAsync(CompetitionType? type = null, DateOnly? fromDate = null);
    Task<CompetitionDto?> GetCompetitionByIdAsync(int id);
    Task<ServiceResult<CompetitionDto>> CreateCompetitionAsync(CreateCompetitionDto dto);
    Task<ServiceResult<CompetitionDto>> UpdateCompetitionAsync(int id, UpdateCompetitionDto dto);
    Task<ServiceResult> DeleteCompetitionAsync(int id);
    Task<ServiceResult> SetCompetitionProjectsAsync(int competitionId, SetCompetitionProjectsDto dto);
    Task<ServiceResult<ScheduleSlotDto>> CreateScheduleSlotAsync(int competitionId, CreateScheduleSlotDto dto);
    Task<ServiceResult<ScheduleSlotDto>> UpdateScheduleSlotAsync(int competitionId, int slotId, UpdateScheduleSlotDto dto);
    Task<ServiceResult> DeleteScheduleSlotAsync(int competitionId, int slotId);
    Task<ServiceResult<SchedulePdfResultDto>> GenerateSchedulePdfAsync(int competitionId);
}
