using Persistence.Entities;
using Services.Results;

namespace Services.Interfaces;

public record EvaluationCriterionDto(
    int CriterionId,
    int CompetitionId,
    string Name,
    string? Description,
    int MinScore,
    int MaxScore,
    double Weight,
    int OrderIndex);

public record CreateEvaluationCriterionDto(
    string Name,
    string? Description,
    int MinScore,
    int MaxScore,
    double Weight,
    int OrderIndex);

public record UpdateEvaluationCriterionDto(
    string Name,
    string? Description,
    int MinScore,
    int MaxScore,
    double Weight,
    int OrderIndex);

public record JuryMemberDto(
    int JuryMemberId,
    int CompetitionId,
    string? ProfessorId,
    string? ProfessorName,
    string? ExternalName,
    string? ExternalEmail,
    string Role,
    DateTime AddedAtUtc);

public record AddJuryMemberDto(
    string? ProfessorId,
    string? ExternalName,
    string? ExternalEmail,
    string Role);

public record ProjectEvaluationDto(
    int EvaluationId,
    int CompetitionId,
    int ProjectId,
    string ProjectTitle,
    int JuryMemberId,
    string JurorName,
    int CriterionId,
    string CriterionName,
    double Score,
    string? Note,
    DateTime UpdatedAtUtc);

public record SubmitEvaluationDto(
    int ProjectId,
    int JuryMemberId,
    int CriterionId,
    double Score,
    string? Note);

public record BatchSubmitProjectEvaluationDto(
    int ProjectId,
    int JuryMemberId,
    IReadOnlyList<CriterionScoreInputDto> Scores,
    string? Note);

public record CriterionScoreInputDto(
    int CriterionId,
    double Score);

public record CriterionAverageDto(
    int CriterionId,
    string CriterionName,
    double AverageScore,
    int MaxScore,
    double Weight);

public record LeaderboardEntryDto(
    int Rank,
    int ProjectId,
    string ProjectTitle,
    string? Technology,
    ProjectType ProjectType,
    double TotalWeightedScore,
    double MaxPossibleWeightedScore,
    int EvaluatedJurorCount,
    int TotalJurorCount,
    IReadOnlyList<CriterionAverageDto> CriterionAverages,
    string? AwardName);

public record LeaderboardDto(
    int CompetitionId,
    string CompetitionName,
    CompetitionStatus Status,
    int TotalProjects,
    int TotalJuryMembers,
    IReadOnlyList<LeaderboardEntryDto> Entries);

public record CompetitionAwardDto(
    int AwardId,
    int CompetitionId,
    string Name,
    int? Rank,
    string? PrizeDetails,
    int? WinningProjectId,
    string? WinningProjectTitle,
    DateTime? AwardedAtUtc);

public record CreateAwardDto(
    string Name,
    int? Rank,
    string? PrizeDetails);

public record AssignAwardWinnerDto(
    int? WinningProjectId);

public record UpdateCompetitionStatusDto(
    CompetitionStatus Status);

public record JurorCompetitionDto(
    int CompetitionId,
    string Name,
    CompetitionType CompetitionType,
    DateOnly StartDate,
    DateOnly? EndDate,
    CompetitionStatus Status,
    int JuryMemberId,
    string JurorName,
    string JurorRole,
    int TotalProjects,
    int EvaluatedProjects);

public interface IEvaluationService
{
    // Juror Portal
    Task<IReadOnlyList<JurorCompetitionDto>> GetMyJurorCompetitionsAsync(string? username, string? email);

    // Criteria
    Task<IReadOnlyList<EvaluationCriterionDto>> GetCriteriaAsync(int competitionId);
    Task<ServiceResult<EvaluationCriterionDto>> CreateCriterionAsync(int competitionId, CreateEvaluationCriterionDto dto);
    Task<ServiceResult<EvaluationCriterionDto>> UpdateCriterionAsync(int competitionId, int criterionId, UpdateEvaluationCriterionDto dto);
    Task<ServiceResult> DeleteCriterionAsync(int competitionId, int criterionId);

    // Jury
    Task<IReadOnlyList<JuryMemberDto>> GetJuryMembersAsync(int competitionId);
    Task<ServiceResult<JuryMemberDto>> AddJuryMemberAsync(int competitionId, AddJuryMemberDto dto);
    Task<ServiceResult> RemoveJuryMemberAsync(int competitionId, int juryMemberId);

    // Evaluations
    Task<IReadOnlyList<ProjectEvaluationDto>> GetEvaluationsAsync(int competitionId, int? juryMemberId = null, int? projectId = null);
    Task<ServiceResult<ProjectEvaluationDto>> SubmitEvaluationAsync(int competitionId, SubmitEvaluationDto dto);
    Task<ServiceResult> BatchSubmitProjectEvaluationsAsync(int competitionId, BatchSubmitProjectEvaluationDto dto);

    // Leaderboard
    Task<ServiceResult<LeaderboardDto>> GetLeaderboardAsync(int competitionId);

    // Awards
    Task<IReadOnlyList<CompetitionAwardDto>> GetAwardsAsync(int competitionId);
    Task<ServiceResult<CompetitionAwardDto>> CreateAwardAsync(int competitionId, CreateAwardDto dto);
    Task<ServiceResult> DeleteAwardAsync(int competitionId, int awardId);
    Task<ServiceResult<CompetitionAwardDto>> AssignAwardWinnerAsync(int competitionId, int awardId, AssignAwardWinnerDto dto);

    // Status
    Task<ServiceResult> UpdateStatusAsync(int competitionId, UpdateCompetitionStatusDto dto);
}
