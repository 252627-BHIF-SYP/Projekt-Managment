using Microsoft.EntityFrameworkCore;
using Persistence;
using Persistence.Entities;
using Services.Interfaces;
using Services.Results;

namespace Services.Implementations;

public class EvaluationService(ApplicationDbContext context) : IEvaluationService
{
    // --- Juror Portal ---
    public async Task<IReadOnlyList<JurorCompetitionDto>> GetMyJurorCompetitionsAsync(string? username, string? email)
    {
        var query = context.Competitions
            .AsNoTracking()
            .Include(c => c.JuryMembers)
                .ThenInclude(j => j.Professor)
            .Include(c => c.CompetitionProjects)
            .Include(c => c.Evaluations)
            .AsQueryable();

        var competitions = await query.OrderBy(c => c.StartDate).ToListAsync();
        var results = new List<JurorCompetitionDto>();

        foreach (var comp in competitions)
        {
            JuryMember? juror = null;
            if (!string.IsNullOrWhiteSpace(username))
            {
                juror = comp.JuryMembers.FirstOrDefault(j =>
                    string.Equals(j.ProfessorId, username, StringComparison.OrdinalIgnoreCase));
            }

            if (juror == null && !string.IsNullOrWhiteSpace(email))
            {
                juror = comp.JuryMembers.FirstOrDefault(j =>
                    string.Equals(j.ExternalEmail, email, StringComparison.OrdinalIgnoreCase));
            }

            // Fallback for dev / unassigned demo view
            if (juror == null)
            {
                juror = comp.JuryMembers.FirstOrDefault();
            }

            if (juror != null)
            {
                var evaluatedProjectIds = comp.Evaluations
                    .Where(e => e.JuryMemberId == juror.Id)
                    .Select(e => e.ProjectId)
                    .Distinct()
                    .Count();

                string jurorName = juror.Professor != null
                    ? $"{juror.Professor.FirstName} {juror.Professor.LastName}"
                    : (juror.ExternalName ?? juror.ProfessorId ?? "Juror");

                results.Add(new JurorCompetitionDto(
                    comp.Id,
                    comp.Name,
                    comp.CompetitionType,
                    comp.StartDate,
                    comp.EndDate,
                    comp.Status,
                    juror.Id,
                    jurorName,
                    juror.Role,
                    comp.CompetitionProjects.Count,
                    evaluatedProjectIds));
            }
        }

        return results;
    }

    // --- Criteria ---
    public async Task<IReadOnlyList<EvaluationCriterionDto>> GetCriteriaAsync(int competitionId)
    {
        return await context.EvaluationCriteria
            .AsNoTracking()
            .Where(c => c.CompetitionId == competitionId)
            .OrderBy(c => c.OrderIndex)
            .ThenBy(c => c.Name)
            .Select(c => new EvaluationCriterionDto(
                c.Id,
                c.CompetitionId,
                c.Name,
                c.Description,
                c.MinScore,
                c.MaxScore,
                c.Weight,
                c.OrderIndex))
            .ToListAsync();
    }

    public async Task<ServiceResult<EvaluationCriterionDto>> CreateCriterionAsync(
        int competitionId,
        CreateEvaluationCriterionDto dto)
    {
        var competitionExists = await context.Competitions.AnyAsync(c => c.Id == competitionId);
        if (!competitionExists)
        {
            return ServiceResult<EvaluationCriterionDto>.NotFound($"Wettbewerb mit Id {competitionId} nicht gefunden.");
        }

        var criterion = new EvaluationCriterion
        {
            CompetitionId = competitionId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            MinScore = dto.MinScore,
            MaxScore = dto.MaxScore,
            Weight = dto.Weight > 0 ? dto.Weight : 1.0,
            OrderIndex = dto.OrderIndex
        };

        context.EvaluationCriteria.Add(criterion);
        await context.SaveChangesAsync();

        return ServiceResult<EvaluationCriterionDto>.Success(new EvaluationCriterionDto(
            criterion.Id,
            criterion.CompetitionId,
            criterion.Name,
            criterion.Description,
            criterion.MinScore,
            criterion.MaxScore,
            criterion.Weight,
            criterion.OrderIndex));
    }

    public async Task<ServiceResult<EvaluationCriterionDto>> UpdateCriterionAsync(
        int competitionId,
        int criterionId,
        UpdateEvaluationCriterionDto dto)
    {
        var criterion = await context.EvaluationCriteria
            .FirstOrDefaultAsync(c => c.Id == criterionId && c.CompetitionId == competitionId);

        if (criterion is null)
        {
            return ServiceResult<EvaluationCriterionDto>.NotFound($"Kriterium mit Id {criterionId} nicht gefunden.");
        }

        criterion.Name = dto.Name.Trim();
        criterion.Description = dto.Description?.Trim();
        criterion.MinScore = dto.MinScore;
        criterion.MaxScore = dto.MaxScore;
        criterion.Weight = dto.Weight > 0 ? dto.Weight : 1.0;
        criterion.OrderIndex = dto.OrderIndex;

        await context.SaveChangesAsync();

        return ServiceResult<EvaluationCriterionDto>.Success(new EvaluationCriterionDto(
            criterion.Id,
            criterion.CompetitionId,
            criterion.Name,
            criterion.Description,
            criterion.MinScore,
            criterion.MaxScore,
            criterion.Weight,
            criterion.OrderIndex));
    }

    public async Task<ServiceResult> DeleteCriterionAsync(int competitionId, int criterionId)
    {
        var criterion = await context.EvaluationCriteria
            .FirstOrDefaultAsync(c => c.Id == criterionId && c.CompetitionId == competitionId);

        if (criterion is null)
        {
            return ServiceResult.NotFound($"Kriterium mit Id {criterionId} nicht gefunden.");
        }

        context.EvaluationCriteria.Remove(criterion);
        await context.SaveChangesAsync();

        return ServiceResult.Success();
    }

    // --- Jury Members ---
    public async Task<IReadOnlyList<JuryMemberDto>> GetJuryMembersAsync(int competitionId)
    {
        return await context.JuryMembers
            .AsNoTracking()
            .Where(j => j.CompetitionId == competitionId)
            .Include(j => j.Professor)
            .OrderBy(j => j.Role)
            .ThenBy(j => j.Professor != null ? j.Professor.LastName : j.ExternalName)
            .Select(j => new JuryMemberDto(
                j.Id,
                j.CompetitionId,
                j.ProfessorId,
                j.Professor != null ? $"{j.Professor.FirstName} {j.Professor.LastName}" : null,
                j.ExternalName,
                j.ExternalEmail,
                j.Role,
                j.AddedAtUtc))
            .ToListAsync();
    }

    public async Task<ServiceResult<JuryMemberDto>> AddJuryMemberAsync(int competitionId, AddJuryMemberDto dto)
    {
        var competitionExists = await context.Competitions.AnyAsync(c => c.Id == competitionId);
        if (!competitionExists)
        {
            return ServiceResult<JuryMemberDto>.NotFound($"Wettbewerb mit Id {competitionId} nicht gefunden.");
        }

        string? professorName = null;
        if (!string.IsNullOrWhiteSpace(dto.ProfessorId))
        {
            var professor = await context.Professors.FindAsync(dto.ProfessorId);
            if (professor is null)
            {
                return ServiceResult<JuryMemberDto>.NotFound($"Professor mit Id {dto.ProfessorId} nicht gefunden.");
            }
            professorName = $"{professor.FirstName} {professor.LastName}";
        }

        var member = new JuryMember
        {
            CompetitionId = competitionId,
            ProfessorId = string.IsNullOrWhiteSpace(dto.ProfessorId) ? null : dto.ProfessorId,
            ExternalName = dto.ExternalName?.Trim(),
            ExternalEmail = dto.ExternalEmail?.Trim(),
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "Juror" : dto.Role.Trim(),
            AddedAtUtc = DateTime.UtcNow
        };

        context.JuryMembers.Add(member);
        await context.SaveChangesAsync();

        return ServiceResult<JuryMemberDto>.Success(new JuryMemberDto(
            member.Id,
            member.CompetitionId,
            member.ProfessorId,
            professorName,
            member.ExternalName,
            member.ExternalEmail,
            member.Role,
            member.AddedAtUtc));
    }

    public async Task<ServiceResult> RemoveJuryMemberAsync(int competitionId, int juryMemberId)
    {
        var member = await context.JuryMembers
            .FirstOrDefaultAsync(j => j.Id == juryMemberId && j.CompetitionId == competitionId);

        if (member is null)
        {
            return ServiceResult.NotFound($"Jury-Mitglied mit Id {juryMemberId} nicht gefunden.");
        }

        context.JuryMembers.Remove(member);
        await context.SaveChangesAsync();

        return ServiceResult.Success();
    }

    // --- Evaluations ---
    public async Task<IReadOnlyList<ProjectEvaluationDto>> GetEvaluationsAsync(
        int competitionId,
        int? juryMemberId = null,
        int? projectId = null)
    {
        var query = context.ProjectEvaluations
            .AsNoTracking()
            .Where(e => e.CompetitionId == competitionId)
            .Include(e => e.Project)
            .Include(e => e.Criterion)
            .Include(e => e.JuryMember)
                .ThenInclude(j => j.Professor)
            .AsQueryable();

        if (juryMemberId.HasValue)
        {
            query = query.Where(e => e.JuryMemberId == juryMemberId.Value);
        }

        if (projectId.HasValue)
        {
            query = query.Where(e => e.ProjectId == projectId.Value);
        }

        return await query
            .Select(e => new ProjectEvaluationDto(
                e.Id,
                e.CompetitionId,
                e.ProjectId,
                e.Project.Title,
                e.JuryMemberId,
                e.JuryMember.Professor != null
                    ? $"{e.JuryMember.Professor.FirstName} {e.JuryMember.Professor.LastName}"
                    : (e.JuryMember.ExternalName ?? "Unbekannter Juror"),
                e.CriterionId,
                e.Criterion.Name,
                e.Score,
                e.Note,
                e.UpdatedAtUtc))
            .ToListAsync();
    }

    public async Task<ServiceResult<ProjectEvaluationDto>> SubmitEvaluationAsync(
        int competitionId,
        SubmitEvaluationDto dto)
    {
        var competition = await context.Competitions.FindAsync(competitionId);
        if (competition is null)
        {
            return ServiceResult<ProjectEvaluationDto>.NotFound($"Wettbewerb mit Id {competitionId} nicht gefunden.");
        }

        var criterion = await context.EvaluationCriteria
            .FirstOrDefaultAsync(c => c.Id == dto.CriterionId && c.CompetitionId == competitionId);
        if (criterion is null)
        {
            return ServiceResult<ProjectEvaluationDto>.NotFound($"Kriterium mit Id {dto.CriterionId} nicht gefunden.");
        }

        var score = Math.Clamp(dto.Score, criterion.MinScore, criterion.MaxScore);

        var existing = await context.ProjectEvaluations
            .FirstOrDefaultAsync(e =>
                e.CompetitionId == competitionId &&
                e.ProjectId == dto.ProjectId &&
                e.JuryMemberId == dto.JuryMemberId &&
                e.CriterionId == dto.CriterionId);

        if (existing != null)
        {
            existing.Score = score;
            existing.Note = dto.Note?.Trim();
            existing.UpdatedAtUtc = DateTime.UtcNow;
        }
        else
        {
            existing = new ProjectEvaluation
            {
                CompetitionId = competitionId,
                ProjectId = dto.ProjectId,
                JuryMemberId = dto.JuryMemberId,
                CriterionId = dto.CriterionId,
                Score = score,
                Note = dto.Note?.Trim(),
                UpdatedAtUtc = DateTime.UtcNow
            };
            context.ProjectEvaluations.Add(existing);
        }

        await context.SaveChangesAsync();

        var reloaded = await context.ProjectEvaluations
            .AsNoTracking()
            .Include(e => e.Project)
            .Include(e => e.Criterion)
            .Include(e => e.JuryMember)
                .ThenInclude(j => j.Professor)
            .FirstAsync(e => e.Id == existing.Id);

        return ServiceResult<ProjectEvaluationDto>.Success(new ProjectEvaluationDto(
            reloaded.Id,
            reloaded.CompetitionId,
            reloaded.ProjectId,
            reloaded.Project.Title,
            reloaded.JuryMemberId,
            reloaded.JuryMember.Professor != null
                ? $"{reloaded.JuryMember.Professor.FirstName} {reloaded.JuryMember.Professor.LastName}"
                : (reloaded.JuryMember.ExternalName ?? "Juror"),
            reloaded.CriterionId,
            reloaded.Criterion.Name,
            reloaded.Score,
            reloaded.Note,
            reloaded.UpdatedAtUtc));
    }

    public async Task<ServiceResult> BatchSubmitProjectEvaluationsAsync(
        int competitionId,
        BatchSubmitProjectEvaluationDto dto)
    {
        var competitionExists = await context.Competitions.AnyAsync(c => c.Id == competitionId);
        if (!competitionExists)
        {
            return ServiceResult.NotFound($"Wettbewerb mit Id {competitionId} nicht gefunden.");
        }

        var criteria = await context.EvaluationCriteria
            .Where(c => c.CompetitionId == competitionId)
            .ToDictionaryAsync(c => c.Id);

        foreach (var scoreInput in dto.Scores)
        {
            if (!criteria.TryGetValue(scoreInput.CriterionId, out var criterion))
            {
                continue;
            }

            var clampedScore = Math.Clamp(scoreInput.Score, criterion.MinScore, criterion.MaxScore);

            var existing = await context.ProjectEvaluations
                .FirstOrDefaultAsync(e =>
                    e.CompetitionId == competitionId &&
                    e.ProjectId == dto.ProjectId &&
                    e.JuryMemberId == dto.JuryMemberId &&
                    e.CriterionId == scoreInput.CriterionId);

            if (existing != null)
            {
                existing.Score = clampedScore;
                existing.Note = dto.Note?.Trim();
                existing.UpdatedAtUtc = DateTime.UtcNow;
            }
            else
            {
                context.ProjectEvaluations.Add(new ProjectEvaluation
                {
                    CompetitionId = competitionId,
                    ProjectId = dto.ProjectId,
                    JuryMemberId = dto.JuryMemberId,
                    CriterionId = scoreInput.CriterionId,
                    Score = clampedScore,
                    Note = dto.Note?.Trim(),
                    UpdatedAtUtc = DateTime.UtcNow
                });
            }
        }

        await context.SaveChangesAsync();
        return ServiceResult.Success();
    }

    // --- Leaderboard & Aggregation ---
    public async Task<ServiceResult<LeaderboardDto>> GetLeaderboardAsync(int competitionId)
    {
        var competition = await context.Competitions
            .AsNoTracking()
            .Include(c => c.CompetitionProjects)
                .ThenInclude(cp => cp.Project)
            .Include(c => c.EvaluationCriteria)
            .Include(c => c.JuryMembers)
            .Include(c => c.Awards)
            .FirstOrDefaultAsync(c => c.Id == competitionId);

        if (competition is null)
        {
            return ServiceResult<LeaderboardDto>.NotFound($"Wettbewerb mit Id {competitionId} nicht gefunden.");
        }

        var allEvaluations = await context.ProjectEvaluations
            .AsNoTracking()
            .Where(e => e.CompetitionId == competitionId)
            .ToListAsync();

        var criteria = competition.EvaluationCriteria.OrderBy(c => c.OrderIndex).ToList();
        var maxPossibleWeightedScore = criteria.Sum(c => c.MaxScore * c.Weight);

        var awardsByProject = competition.Awards
            .Where(a => a.WinningProjectId.HasValue)
            .ToDictionary(a => a.WinningProjectId!.Value, a => a.Name);

        var entries = new List<LeaderboardEntryDto>();

        foreach (var compProject in competition.CompetitionProjects)
        {
            var project = compProject.Project;
            var projectEvaluations = allEvaluations.Where(e => e.ProjectId == project.Id).ToList();

            var criterionAverages = new List<CriterionAverageDto>();
            double totalWeightedScore = 0;

            foreach (var crit in criteria)
            {
                var critEvals = projectEvaluations.Where(e => e.CriterionId == crit.Id).ToList();
                var avgScore = critEvals.Count > 0 ? critEvals.Average(e => e.Score) : 0;
                totalWeightedScore += avgScore * crit.Weight;

                criterionAverages.Add(new CriterionAverageDto(
                    crit.Id,
                    crit.Name,
                    Math.Round(avgScore, 2),
                    crit.MaxScore,
                    crit.Weight));
            }

            var evaluatedJurorCount = projectEvaluations
                .Select(e => e.JuryMemberId)
                .Distinct()
                .Count();

            awardsByProject.TryGetValue(project.Id, out var awardName);

            entries.Add(new LeaderboardEntryDto(
                0, // will be ranked after sorting
                project.Id,
                project.Title,
                project.Technology,
                project.ProjectType,
                Math.Round(totalWeightedScore, 2),
                Math.Round(maxPossibleWeightedScore, 2),
                evaluatedJurorCount,
                competition.JuryMembers.Count,
                criterionAverages,
                awardName));
        }

        // Sort by TotalWeightedScore descending
        var rankedEntries = entries
            .OrderByDescending(e => e.TotalWeightedScore)
            .Select((entry, index) => entry with { Rank = index + 1 })
            .ToList();

        return ServiceResult<LeaderboardDto>.Success(new LeaderboardDto(
            competition.Id,
            competition.Name,
            competition.Status,
            competition.CompetitionProjects.Count,
            competition.JuryMembers.Count,
            rankedEntries));
    }

    // --- Awards ---
    public async Task<IReadOnlyList<CompetitionAwardDto>> GetAwardsAsync(int competitionId)
    {
        return await context.CompetitionAwards
            .AsNoTracking()
            .Where(a => a.CompetitionId == competitionId)
            .Include(a => a.WinningProject)
            .OrderBy(a => a.Rank ?? int.MaxValue)
            .ThenBy(a => a.Name)
            .Select(a => new CompetitionAwardDto(
                a.Id,
                a.CompetitionId,
                a.Name,
                a.Rank,
                a.PrizeDetails,
                a.WinningProjectId,
                a.WinningProject != null ? a.WinningProject.Title : null,
                a.AwardedAtUtc))
            .ToListAsync();
    }

    public async Task<ServiceResult<CompetitionAwardDto>> CreateAwardAsync(int competitionId, CreateAwardDto dto)
    {
        var competitionExists = await context.Competitions.AnyAsync(c => c.Id == competitionId);
        if (!competitionExists)
        {
            return ServiceResult<CompetitionAwardDto>.NotFound($"Wettbewerb mit Id {competitionId} nicht gefunden.");
        }

        var award = new CompetitionAward
        {
            CompetitionId = competitionId,
            Name = dto.Name.Trim(),
            Rank = dto.Rank,
            PrizeDetails = dto.PrizeDetails?.Trim(),
            AwardedAtUtc = null
        };

        context.CompetitionAwards.Add(award);
        await context.SaveChangesAsync();

        return ServiceResult<CompetitionAwardDto>.Success(new CompetitionAwardDto(
            award.Id,
            award.CompetitionId,
            award.Name,
            award.Rank,
            award.PrizeDetails,
            null,
            null,
            null));
    }

    public async Task<ServiceResult> DeleteAwardAsync(int competitionId, int awardId)
    {
        var award = await context.CompetitionAwards
            .FirstOrDefaultAsync(a => a.Id == awardId && a.CompetitionId == competitionId);

        if (award is null)
        {
            return ServiceResult.NotFound($"Award mit Id {awardId} nicht gefunden.");
        }

        context.CompetitionAwards.Remove(award);
        await context.SaveChangesAsync();

        return ServiceResult.Success();
    }

    public async Task<ServiceResult<CompetitionAwardDto>> AssignAwardWinnerAsync(
        int competitionId,
        int awardId,
        AssignAwardWinnerDto dto)
    {
        var award = await context.CompetitionAwards
            .FirstOrDefaultAsync(a => a.Id == awardId && a.CompetitionId == competitionId);

        if (award is null)
        {
            return ServiceResult<CompetitionAwardDto>.NotFound($"Award mit Id {awardId} nicht gefunden.");
        }

        string? projectTitle = null;
        if (dto.WinningProjectId.HasValue)
        {
            var project = await context.Projects.FindAsync(dto.WinningProjectId.Value);
            if (project is null)
            {
                return ServiceResult<CompetitionAwardDto>.NotFound($"Projekt mit Id {dto.WinningProjectId.Value} nicht gefunden.");
            }
            projectTitle = project.Title;
            award.WinningProjectId = dto.WinningProjectId.Value;
            award.AwardedAtUtc = DateTime.UtcNow;
        }
        else
        {
            award.WinningProjectId = null;
            award.AwardedAtUtc = null;
        }

        await context.SaveChangesAsync();

        return ServiceResult<CompetitionAwardDto>.Success(new CompetitionAwardDto(
            award.Id,
            award.CompetitionId,
            award.Name,
            award.Rank,
            award.PrizeDetails,
            award.WinningProjectId,
            projectTitle,
            award.AwardedAtUtc));
    }

    // --- Status ---
    public async Task<ServiceResult> UpdateStatusAsync(int competitionId, UpdateCompetitionStatusDto dto)
    {
        var competition = await context.Competitions.FindAsync(competitionId);
        if (competition is null)
        {
            return ServiceResult.NotFound($"Wettbewerb mit Id {competitionId} nicht gefunden.");
        }

        competition.Status = dto.Status;
        await context.SaveChangesAsync();

        return ServiceResult.Success();
    }
}
