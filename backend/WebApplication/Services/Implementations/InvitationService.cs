using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Persistence;
using Persistence.Entities;
using Services.Interfaces;
using Services.Results;

namespace Services.Implementations;

public class InvitationService(
    ApplicationDbContext context,
    IProjectService projectService) : IInvitationService
{
    public async Task<IReadOnlyList<InvitationDto>> GetInvitationsAsync(int? competitionId = null, InvitationStatus? status = null)
    {
        var query = context.Invitations
            .AsNoTracking()
            .Include(i => i.Competition)
            .Include(i => i.Project)
            .AsQueryable();

        if (competitionId.HasValue)
        {
            query = query.Where(i => i.CompetitionId == competitionId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(i => i.Status == status.Value);
        }

        var list = await query.OrderByDescending(i => i.CreatedAtUtc).ToListAsync();
        return list.Select(ToDto).ToList();
    }

    public async Task<ServiceResult<InvitationDto>> CreateInvitationAsync(CreateInvitationDto dto, string? createdByUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || !dto.Email.Contains('@'))
        {
            return ServiceResult<InvitationDto>.ValidationError("A valid email address is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.RecipientName))
        {
            return ServiceResult<InvitationDto>.ValidationError("Recipient name is required.");
        }

        if (dto.CompetitionId.HasValue)
        {
            var competitionExists = await context.Competitions.AnyAsync(c => c.Id == dto.CompetitionId.Value);
            if (!competitionExists)
            {
                return ServiceResult<InvitationDto>.NotFound($"Competition with ID {dto.CompetitionId.Value} not found.");
            }
        }

        var tokenBytes = RandomNumberGenerator.GetBytes(24);
        var token = "inv_" + Convert.ToHexString(tokenBytes).ToLowerInvariant();

        var invitation = new Invitation
        {
            Email = dto.Email.Trim().ToLowerInvariant(),
            RecipientName = dto.RecipientName.Trim(),
            SchoolName = dto.SchoolName?.Trim(),
            TargetRole = dto.TargetRole,
            CompetitionId = dto.CompetitionId,
            ProjectId = dto.ProjectId,
            Token = token,
            Status = InvitationStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(14),
            CreatedByUserId = createdByUserId
        };

        context.Invitations.Add(invitation);
        await context.SaveChangesAsync();

        var created = await context.Invitations
            .Include(i => i.Competition)
            .Include(i => i.Project)
            .FirstAsync(i => i.Id == invitation.Id);

        return ServiceResult<InvitationDto>.Success(ToDto(created));
    }

    public async Task<ServiceResult<InvitationDto>> GetInvitationByTokenAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return ServiceResult<InvitationDto>.ValidationError("Token is required.");
        }

        var invitation = await context.Invitations
            .Include(i => i.Competition)
            .Include(i => i.Project)
            .FirstOrDefaultAsync(i => i.Token == token.Trim());

        if (invitation == null)
        {
            return ServiceResult<InvitationDto>.NotFound("Invitation not found or invalid link.");
        }

        if (invitation.Status == InvitationStatus.Pending && invitation.ExpiresAtUtc < DateTime.UtcNow)
        {
            invitation.Status = InvitationStatus.Expired;
            await context.SaveChangesAsync();
        }

        return ServiceResult<InvitationDto>.Success(ToDto(invitation));
    }

    public async Task<ServiceResult<InvitationDto>> AcceptInvitationAsync(string token, AcceptInvitationDto dto)
    {
        var result = await GetInvitationByTokenAsync(token);
        if (!result.IsSuccess || result.Value == null)
        {
            return result;
        }

        var invitation = await context.Invitations
            .Include(i => i.Competition)
            .Include(i => i.Project)
            .FirstAsync(i => i.Id == result.Value.InvitationId);

        if (invitation.Status == InvitationStatus.Accepted)
        {
            return ServiceResult<InvitationDto>.Success(ToDto(invitation));
        }

        if (invitation.Status == InvitationStatus.Revoked || invitation.Status == InvitationStatus.Expired)
        {
            return ServiceResult<InvitationDto>.ValidationError($"This invitation has been {invitation.Status.ToString().ToLower()}.");
        }

        invitation.Status = InvitationStatus.Accepted;
        invitation.AcceptedAtUtc = DateTime.UtcNow;

        // If it's an external juror invitation for a competition, ensure jury member entry exists
        if (invitation.TargetRole == InvitationRole.ExternalJuror && invitation.CompetitionId.HasValue)
        {
            var alreadyJuror = await context.JuryMembers.AnyAsync(j =>
                j.CompetitionId == invitation.CompetitionId.Value &&
                j.ExternalEmail == invitation.Email);

            if (!alreadyJuror)
            {
                var juryMember = new JuryMember
                {
                    CompetitionId = invitation.CompetitionId.Value,
                    ExternalName = invitation.RecipientName,
                    ExternalEmail = invitation.Email,
                    Role = "Gastjuror",
                    AddedAtUtc = DateTime.UtcNow
                };
                context.JuryMembers.Add(juryMember);
            }
        }

        await context.SaveChangesAsync();
        return ServiceResult<InvitationDto>.Success(ToDto(invitation));
    }

    public async Task<ServiceResult> RevokeInvitationAsync(int invitationId)
    {
        var invitation = await context.Invitations.FirstOrDefaultAsync(i => i.Id == invitationId);
        if (invitation == null)
        {
            return ServiceResult.NotFound("Invitation not found.");
        }

        invitation.Status = InvitationStatus.Revoked;
        await context.SaveChangesAsync();
        return ServiceResult.Success();
    }

    public async Task<ServiceResult<ProjectDto>> SubmitExternalProjectAsync(CreateExternalProjectDto dto)
    {
        var invResult = await GetInvitationByTokenAsync(dto.Token);
        if (!invResult.IsSuccess || invResult.Value == null)
        {
            return ServiceResult<ProjectDto>.ValidationError("Invalid or expired invitation token.");
        }

        var invitation = invResult.Value;
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return ServiceResult<ProjectDto>.ValidationError("Project title is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Description))
        {
            return ServiceResult<ProjectDto>.ValidationError("Project description is required.");
        }

        var project = new Project
        {
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            Technology = string.IsNullOrWhiteSpace(dto.Technology) ? null : dto.Technology.Trim(),
            GithubUrl = string.IsNullOrWhiteSpace(dto.GithubUrl) ? null : dto.GithubUrl.Trim(),
            LogoUrl = string.IsNullOrWhiteSpace(dto.LogoUrl) ? null : dto.LogoUrl.Trim(),
            Status = ProjectStatus.Pending,
            ProjectType = ProjectType.ProjectAward,
            IsExternal = true,
            ExternalSchoolName = string.IsNullOrWhiteSpace(dto.SchoolName) ? invitation.SchoolName : dto.SchoolName.Trim(),
            HasConsent = true,
            ConsentConfirmedAtUtc = DateTime.UtcNow,
            ConsentConfirmedBy = invitation.RecipientName,
            SubmittedAtUtc = DateTime.UtcNow
        };

        context.Projects.Add(project);
        await context.SaveChangesAsync();

        // Assign to competition if specified in dto or invitation
        var targetCompetitionId = dto.CompetitionId ?? invitation.CompetitionId;
        if (targetCompetitionId.HasValue)
        {
            var competition = await context.Competitions.FirstOrDefaultAsync(c => c.Id == targetCompetitionId.Value);
            if (competition != null)
            {
                var compProj = new CompetitionProject
                {
                    CompetitionId = competition.Id,
                    ProjectId = project.Id,
                    JoinedAtUtc = DateTime.UtcNow,
                    HasConsent = true,
                    ConsentConfirmedAtUtc = DateTime.UtcNow,
                    Note = $"Extern eingereicht von {invitation.RecipientName} ({project.ExternalSchoolName})"
                };
                context.CompetitionProjects.Add(compProj);
                await context.SaveChangesAsync();
            }
        }

        // Link invitation to this project
        var invEntity = await context.Invitations.FirstOrDefaultAsync(i => i.Id == invitation.InvitationId);
        if (invEntity != null)
        {
            invEntity.ProjectId = project.Id;
            invEntity.Status = InvitationStatus.Accepted;
            invEntity.AcceptedAtUtc = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }

        var createdDto = await projectService.GetProjectByIdAsync(project.Id);
        return ServiceResult<ProjectDto>.Success(createdDto!);
    }

    public async Task<ServiceResult> ConfirmProjectConsentAsync(int projectId, ConfirmConsentDto dto)
    {
        var project = await context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null)
        {
            return ServiceResult.NotFound("Project not found.");
        }

        project.HasConsent = dto.HasConsent;
        project.ConsentConfirmedAtUtc = dto.HasConsent ? DateTime.UtcNow : null;
        project.ConsentConfirmedBy = dto.HasConsent ? dto.ConfirmedBy.Trim() : null;

        var compProjects = await context.CompetitionProjects.Where(cp => cp.ProjectId == projectId).ToListAsync();
        foreach (var cp in compProjects)
        {
            cp.HasConsent = dto.HasConsent;
            cp.ConsentConfirmedAtUtc = dto.HasConsent ? DateTime.UtcNow : null;
        }

        await context.SaveChangesAsync();
        return ServiceResult.Success();
    }

    private static InvitationDto ToDto(Invitation i) => new(
        i.Id,
        i.Email,
        i.RecipientName,
        i.SchoolName,
        i.TargetRole,
        i.CompetitionId,
        i.Competition?.Name,
        i.ProjectId,
        i.Project?.Title,
        i.Token,
        i.Status,
        i.CreatedAtUtc,
        i.ExpiresAtUtc,
        i.AcceptedAtUtc,
        i.CreatedByUserId);
}
