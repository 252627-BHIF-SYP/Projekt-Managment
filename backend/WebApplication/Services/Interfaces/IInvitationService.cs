using Persistence.Entities;
using Services.Results;

namespace Services.Interfaces;

public record InvitationDto(
    int InvitationId,
    string Email,
    string RecipientName,
    string? SchoolName,
    InvitationRole TargetRole,
    int? CompetitionId,
    string? CompetitionName,
    int? ProjectId,
    string? ProjectTitle,
    string Token,
    InvitationStatus Status,
    DateTime CreatedAtUtc,
    DateTime ExpiresAtUtc,
    DateTime? AcceptedAtUtc,
    string? CreatedByUserId);

public record CreateInvitationDto(
    string Email,
    string RecipientName,
    string? SchoolName,
    InvitationRole TargetRole,
    int? CompetitionId,
    int? ProjectId);

public record AcceptInvitationDto(
    string? Password);

public record ExternalStudentInputDto(
    string FirstName,
    string LastName,
    string? Email,
    string? ClassGrade);

public record CreateExternalProjectDto(
    string Token,
    string Title,
    string Description,
    string? Technology,
    string? GithubUrl,
    string? LogoUrl,
    string SchoolName,
    int? CompetitionId,
    IReadOnlyList<ExternalStudentInputDto> Students);

public record ConfirmConsentDto(
    string ConfirmedBy,
    bool HasConsent);

public interface IInvitationService
{
    Task<IReadOnlyList<InvitationDto>> GetInvitationsAsync(int? competitionId = null, InvitationStatus? status = null);
    Task<ServiceResult<InvitationDto>> CreateInvitationAsync(CreateInvitationDto dto, string? createdByUserId);
    Task<ServiceResult<InvitationDto>> GetInvitationByTokenAsync(string token);
    Task<ServiceResult<InvitationDto>> AcceptInvitationAsync(string token, AcceptInvitationDto dto);
    Task<ServiceResult> RevokeInvitationAsync(int invitationId);
    Task<ServiceResult<ProjectDto>> SubmitExternalProjectAsync(CreateExternalProjectDto dto);
    Task<ServiceResult> ConfirmProjectConsentAsync(int projectId, ConfirmConsentDto dto);
}
