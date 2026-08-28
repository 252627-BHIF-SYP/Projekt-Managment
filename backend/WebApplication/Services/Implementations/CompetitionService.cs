using Microsoft.EntityFrameworkCore;
using Persistence;
using Persistence.Entities;
using Services.Interfaces;
using Services.Results;

namespace Services.Implementations;

public class CompetitionService(ApplicationDbContext context) : ICompetitionService
{
    public async Task<IReadOnlyList<CompetitionSummaryDto>> GetCompetitionsAsync(
        CompetitionType? type = null,
        DateOnly? fromDate = null)
    {
        var query = context.Competitions
            .AsNoTracking()
            .AsQueryable();

        if (type.HasValue)
        {
            query = query.Where(c => c.CompetitionType == type.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(c => c.StartDate >= fromDate.Value);
        }

        return await query
            .OrderBy(c => c.StartDate)
            .ThenBy(c => c.Name)
            .Select(c => new CompetitionSummaryDto(
                c.Id,
                c.Name,
                c.CompetitionType,
                c.StartDate,
                c.EndDate,
                c.PresentationDurationMinutes,
                c.BreakDurationMinutes,
                c.AllowedClassTypes,
                c.Status,
                c.CreatedAtUtc,
                c.CompetitionProjects.Count,
                c.ScheduleSlots.Count))
            .ToListAsync();
    }

    public async Task<CompetitionDto?> GetCompetitionByIdAsync(int id)
    {
        var competition = await context.Competitions
            .AsNoTracking()
            .Include(c => c.CompetitionProjects)
                .ThenInclude(cp => cp.Project)
            .Include(c => c.ScheduleSlots)
                .ThenInclude(s => s.Project)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (competition is null)
        {
            return null;
        }

        var projectDtos = competition.CompetitionProjects
            .OrderBy(cp => cp.Project.Title)
            .Select(cp => new CompetitionProjectDto(
                cp.ProjectId,
                cp.Project.Title,
                cp.Project.Description,
                cp.Project.GithubUrl,
                cp.Project.LogoUrl,
                cp.Project.Status,
                cp.Project.ProjectType,
                cp.Project.Technology,
                cp.JoinedAtUtc,
                cp.Note))
            .ToList();

        var slotDtos = competition.ScheduleSlots
            .OrderBy(s => s.Date)
            .ThenBy(s => s.StartTime)
            .Select(s => new ScheduleSlotDto(
                s.Id,
                s.CompetitionId,
                s.ProjectId,
                s.Project == null ? null : s.Project.Title,
                s.SlotType,
                s.Date,
                s.StartTime,
                s.DurationMinutes,
                s.Title,
                s.Note))
            .ToList();

        return new CompetitionDto(
            competition.Id,
            competition.Name,
            competition.CompetitionType,
            competition.StartDate,
            competition.EndDate,
            competition.PresentationDurationMinutes,
            competition.BreakDurationMinutes,
            competition.AllowedClassTypes,
            competition.Status,
            competition.CreatedAtUtc,
            projectDtos,
            slotDtos);
    }

    public async Task<ServiceResult<CompetitionDto>> CreateCompetitionAsync(CreateCompetitionDto dto)
    {
        var competition = new Competition
        {
            Name = dto.Name.Trim(),
            CompetitionType = dto.CompetitionType,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            PresentationDurationMinutes = dto.PresentationDurationMinutes,
            BreakDurationMinutes = dto.BreakDurationMinutes,
            AllowedClassTypes = string.IsNullOrWhiteSpace(dto.AllowedClassTypes) ? "Alle" : dto.AllowedClassTypes.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        context.Competitions.Add(competition);
        await context.SaveChangesAsync();

        var result = await GetCompetitionByIdAsync(competition.Id);
        return ServiceResult<CompetitionDto>.Success(result!);
    }

    public async Task<ServiceResult<CompetitionDto>> UpdateCompetitionAsync(int id, UpdateCompetitionDto dto)
    {
        var competition = await context.Competitions.FirstOrDefaultAsync(c => c.Id == id);
        if (competition is null)
        {
            return ServiceResult<CompetitionDto>.NotFound($"Wettbewerb mit Id {id} nicht gefunden.");
        }

        competition.Name = dto.Name.Trim();
        competition.CompetitionType = dto.CompetitionType;
        competition.StartDate = dto.StartDate;
        competition.EndDate = dto.EndDate;
        competition.PresentationDurationMinutes = dto.PresentationDurationMinutes;
        competition.BreakDurationMinutes = dto.BreakDurationMinutes;
        competition.AllowedClassTypes = string.IsNullOrWhiteSpace(dto.AllowedClassTypes) ? "Alle" : dto.AllowedClassTypes.Trim();

        await context.SaveChangesAsync();

        var result = await GetCompetitionByIdAsync(id);
        return ServiceResult<CompetitionDto>.Success(result!);
    }

    public async Task<ServiceResult> DeleteCompetitionAsync(int id)
    {
        var competition = await context.Competitions.FirstOrDefaultAsync(c => c.Id == id);
        if (competition is null)
        {
            return ServiceResult.NotFound($"Wettbewerb mit Id {id} nicht gefunden.");
        }

        context.Competitions.Remove(competition);
        await context.SaveChangesAsync();

        return ServiceResult.Success();
    }

    public async Task<ServiceResult> SetCompetitionProjectsAsync(int competitionId, SetCompetitionProjectsDto dto)
    {
        var competitionExists = await context.Competitions.AnyAsync(c => c.Id == competitionId);
        if (!competitionExists)
        {
            return ServiceResult.NotFound($"Wettbewerb mit Id {competitionId} nicht gefunden.");
        }

        var projectIds = dto.ProjectIds.Distinct().ToArray();
        var validProjects = await context.Projects
            .Where(p => projectIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();

        var existingAssignments = await context.CompetitionProjects
            .Where(cp => cp.CompetitionId == competitionId)
            .ToListAsync();

        context.CompetitionProjects.RemoveRange(existingAssignments);

        var newAssignments = validProjects.Select(projectId => new CompetitionProject
        {
            CompetitionId = competitionId,
            ProjectId = projectId,
            JoinedAtUtc = DateTime.UtcNow
        });

        context.CompetitionProjects.AddRange(newAssignments);
        await context.SaveChangesAsync();

        return ServiceResult.Success();
    }

    public async Task<ServiceResult<ScheduleSlotDto>> CreateScheduleSlotAsync(int competitionId, CreateScheduleSlotDto dto)
    {
        var competition = await context.Competitions.FindAsync(competitionId);
        if (competition is null)
        {
            return ServiceResult<ScheduleSlotDto>.NotFound($"Wettbewerb mit Id {competitionId} nicht gefunden.");
        }

        string? projectTitle = null;
        if (dto.ProjectId.HasValue)
        {
            var isAssigned = await context.CompetitionProjects
                .AnyAsync(cp => cp.CompetitionId == competitionId && cp.ProjectId == dto.ProjectId.Value);

            if (!isAssigned)
            {
                return ServiceResult<ScheduleSlotDto>.ValidationError(
                    $"Projekt mit Id {dto.ProjectId.Value} ist diesem Wettbewerb nicht zugeordnet.");
            }

            projectTitle = await context.Projects
                .Where(p => p.Id == dto.ProjectId.Value)
                .Select(p => p.Title)
                .FirstOrDefaultAsync();
        }

        var slot = new ScheduleSlot
        {
            CompetitionId = competitionId,
            ProjectId = dto.ProjectId,
            SlotType = dto.SlotType,
            Date = dto.Date,
            StartTime = dto.StartTime,
            DurationMinutes = dto.DurationMinutes,
            Title = dto.Title.Trim(),
            Note = dto.Note?.Trim()
        };

        context.ScheduleSlots.Add(slot);
        await context.SaveChangesAsync();

        var slotDto = new ScheduleSlotDto(
            slot.Id,
            slot.CompetitionId,
            slot.ProjectId,
            projectTitle,
            slot.SlotType,
            slot.Date,
            slot.StartTime,
            slot.DurationMinutes,
            slot.Title,
            slot.Note);

        return ServiceResult<ScheduleSlotDto>.Success(slotDto);
    }

    public async Task<ServiceResult<ScheduleSlotDto>> UpdateScheduleSlotAsync(
        int competitionId,
        int slotId,
        UpdateScheduleSlotDto dto)
    {
        var slot = await context.ScheduleSlots
            .FirstOrDefaultAsync(s => s.Id == slotId && s.CompetitionId == competitionId);

        if (slot is null)
        {
            return ServiceResult<ScheduleSlotDto>.NotFound(
                $"Zeitplan-Slot mit Id {slotId} für Wettbewerb {competitionId} nicht gefunden.");
        }

        string? projectTitle = null;
        if (dto.ProjectId.HasValue)
        {
            var isAssigned = await context.CompetitionProjects
                .AnyAsync(cp => cp.CompetitionId == competitionId && cp.ProjectId == dto.ProjectId.Value);

            if (!isAssigned)
            {
                return ServiceResult<ScheduleSlotDto>.ValidationError(
                    $"Projekt mit Id {dto.ProjectId.Value} ist diesem Wettbewerb nicht zugeordnet.");
            }

            projectTitle = await context.Projects
                .Where(p => p.Id == dto.ProjectId.Value)
                .Select(p => p.Title)
                .FirstOrDefaultAsync();
        }

        slot.ProjectId = dto.ProjectId;
        slot.SlotType = dto.SlotType;
        slot.Date = dto.Date;
        slot.StartTime = dto.StartTime;
        slot.DurationMinutes = dto.DurationMinutes;
        slot.Title = dto.Title.Trim();
        slot.Note = dto.Note?.Trim();

        await context.SaveChangesAsync();

        var slotDto = new ScheduleSlotDto(
            slot.Id,
            slot.CompetitionId,
            slot.ProjectId,
            projectTitle,
            slot.SlotType,
            slot.Date,
            slot.StartTime,
            slot.DurationMinutes,
            slot.Title,
            slot.Note);

        return ServiceResult<ScheduleSlotDto>.Success(slotDto);
    }

    public async Task<ServiceResult> DeleteScheduleSlotAsync(int competitionId, int slotId)
    {
        var slot = await context.ScheduleSlots
            .FirstOrDefaultAsync(s => s.Id == slotId && s.CompetitionId == competitionId);

        if (slot is null)
        {
            return ServiceResult.NotFound(
                $"Zeitplan-Slot mit Id {slotId} für Wettbewerb {competitionId} nicht gefunden.");
        }

        context.ScheduleSlots.Remove(slot);
        await context.SaveChangesAsync();

        return ServiceResult.Success();
    }

    public async Task<ServiceResult<SchedulePdfResultDto>> GenerateSchedulePdfAsync(int competitionId)
    {
        var competition = await context.Competitions
            .AsNoTracking()
            .Include(c => c.CompetitionProjects)
                .ThenInclude(cp => cp.Project)
                    .ThenInclude(p => p.ProjectSupervisors)
                        .ThenInclude(ps => ps.Professor)
            .Include(c => c.ScheduleSlots)
                .ThenInclude(s => s.Project)
                    .ThenInclude(p => p!.ProjectSupervisors)
                        .ThenInclude(ps => ps.Professor)
            .FirstOrDefaultAsync(c => c.Id == competitionId);

        if (competition is null)
        {
            return ServiceResult<SchedulePdfResultDto>.NotFound($"Wettbewerb mit Id {competitionId} nicht gefunden.");
        }

        var bytes = SchedulePdfBuilder.Build(competition);
        var fileName = SchedulePdfBuilder.BuildFileName(competition);

        return ServiceResult<SchedulePdfResultDto>.Success(
            new SchedulePdfResultDto(bytes, "application/pdf", fileName));
    }
}
