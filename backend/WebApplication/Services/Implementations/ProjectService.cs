using Microsoft.EntityFrameworkCore;
using Npgsql;
using Persistence;
using Persistence.Entities;
using Services.Interfaces;
using Services.Results;

namespace Services.Implementations;

public class ProjectService(ApplicationDbContext context) : IProjectService
{
    private readonly ApplicationDbContext _context = context;

    public async Task<IReadOnlyList<ProjectDto>> GetProjectsAsync(ProjectFilterDto filter)
    {
        var query = ProjectGraph().AsNoTracking();
        query = ApplyProjectFilter(query, filter);

        var projects = await query
            .OrderBy(p => p.Title)
            .ToListAsync();

        return projects.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<ProjectDto>> GetAssignedProjectsAsync(ProjectFilterDto filter, ProjectActorDto actor)
    {
        if (!actor.IsAuthenticated || string.IsNullOrWhiteSpace(actor.Username))
        {
            return [];
        }

        if (!actor.IsProfessor && !actor.IsStudent)
        {
            return [];
        }

        var username = actor.Username.Trim().ToLower();
        var query = ProjectGraph().AsNoTracking();

        if (actor.IsProfessor && actor.IsStudent)
        {
            query = query.Where(p =>
                p.ProjectSupervisors.Any(s => s.ProfessorId.ToLower() == username) ||
                p.ProjectStudents.Any(s =>
                    s.StudentClassHistory != null &&
                    s.StudentClassHistory.StudentId.ToLower() == username));
        }
        else if (actor.IsProfessor)
        {
            query = query.Where(p => p.ProjectSupervisors.Any(s => s.ProfessorId.ToLower() == username));
        }
        else
        {
            query = query.Where(p => p.ProjectStudents.Any(s =>
                s.StudentClassHistory != null &&
                s.StudentClassHistory.StudentId.ToLower() == username));
        }

        query = ApplyProjectFilter(query, filter);

        var projects = await query
            .OrderBy(p => p.Title)
            .ToListAsync();

        return projects.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<ProjectDto>> GetStudentProjectsAsync(string studentId, ProjectFilterDto filter)
    {
        var normalizedStudentId = studentId.Trim().ToLower();

        var query = ProjectGraph()
            .AsNoTracking()
            .Where(p => p.ProjectStudents.Any(s =>
                s.StudentClassHistory != null &&
                s.StudentClassHistory.StudentId.ToLower() == normalizedStudentId));

        query = ApplyProjectFilter(query, filter);

        var projects = await query
            .OrderBy(p => p.Title)
            .ToListAsync();

        return projects.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<ProjectDto>> GetProfessorProjectsAsync(string professorId, ProjectFilterDto filter)
    {
        var normalizedProfessorId = professorId.Trim().ToLower();

        var query = ProjectGraph()
            .AsNoTracking()
            .Where(p => p.ProjectSupervisors.Any(s => s.ProfessorId.ToLower() == normalizedProfessorId));

        query = ApplyProjectFilter(query, filter);

        var projects = await query
            .OrderBy(p => p.Title)
            .ToListAsync();

        return projects.Select(ToDto).ToList();
    }

    public async Task<ProjectDto?> GetProjectByIdAsync(int id)
    {
        var project = await ProjectGraph()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        return project == null ? null : ToDto(project);
    }

    public async Task<ServiceResult<ProjectDto>> CreateProjectAsync(CreateProjectDto dto)
    {
        var validation = await ValidateProjectDataAsync(
            dto.Title,
            dto.Description,
            dto.SchoolYearIds,
            dto.Students,
            dto.Supervisors);

        if (!validation.IsSuccess)
        {
            return ServiceResult<ProjectDto>.ValidationError(validation.Message ?? "Invalid project data.");
        }

        var project = new Project
        {
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            GithubUrl = NullIfWhiteSpace(dto.GithubUrl),
            LogoUrl = NullIfWhiteSpace(dto.LogoUrl),
            Status = dto.Status,
            Technology = NullIfWhiteSpace(dto.Technology),
            ProjectType = dto.ProjectType
        };

        foreach (var schoolYearId in dto.SchoolYearIds.Distinct())
        {
            project.SchoolYearProjects.Add(new SchoolYearProject { SchoolYearId = schoolYearId });
        }

        foreach (var student in dto.Students.DistinctBy(s => s.HistoryId))
        {
            project.ProjectStudents.Add(new ProjectStudent
            {
                HistoryId = student.HistoryId,
                Role = string.IsNullOrWhiteSpace(student.Role) ? "Student" : student.Role.Trim()
            });
        }

        foreach (var supervisor in dto.Supervisors.DistinctBy(s => s.ProfessorId))
        {
            project.ProjectSupervisors.Add(new ProjectSupervisor
            {
                ProfessorId = supervisor.ProfessorId,
                Role = string.IsNullOrWhiteSpace(supervisor.Role) ? "Supervisor" : supervisor.Role.Trim()
            });
        }

        _context.Projects.Add(project);

        try
        {
            await _context.SaveChangesAsync();
            var created = await GetProjectByIdAsync(project.Id);
            return ServiceResult<ProjectDto>.Success(created!);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return ServiceResult<ProjectDto>.Conflict("A project relation was added more than once.");
        }
        catch (DbUpdateException ex)
        {
            return ServiceResult<ProjectDto>.DatabaseError(ex.InnerException?.Message ?? ex.Message);
        }
    }

    public async Task<ServiceResult<ProjectDto>> UpdateProjectAsync(int id, UpdateProjectDto dto, ProjectActorDto actor)
    {
        var project = await ProjectGraph()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            return ServiceResult<ProjectDto>.NotFound("Project was not found.");
        }

        if (!CanEditProject(project, actor))
        {
            return ServiceResult<ProjectDto>.Forbidden("You are not allowed to edit this project.");
        }

        var validation = await ValidateProjectDataAsync(
            dto.Title,
            dto.Description,
            dto.SchoolYearIds,
            dto.Students,
            dto.Supervisors);

        if (!validation.IsSuccess)
        {
            return ServiceResult<ProjectDto>.ValidationError(validation.Message ?? "Invalid project data.");
        }

        project.Title = dto.Title.Trim();
        project.Description = dto.Description.Trim();
        project.GithubUrl = NullIfWhiteSpace(dto.GithubUrl);
        project.LogoUrl = NullIfWhiteSpace(dto.LogoUrl);
        project.Status = dto.Status;
        project.Technology = NullIfWhiteSpace(dto.Technology);
        project.ProjectType = dto.ProjectType;

        ReplaceSchoolYears(project, dto.SchoolYearIds);
        ReplaceStudents(project, dto.Students);
        ReplaceSupervisors(project, dto.Supervisors);

        try
        {
            await _context.SaveChangesAsync();
            var updated = await GetProjectByIdAsync(project.Id);
            return ServiceResult<ProjectDto>.Success(updated!);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return ServiceResult<ProjectDto>.Conflict("A project relation was added more than once.");
        }
        catch (DbUpdateException ex)
        {
            return ServiceResult<ProjectDto>.DatabaseError(ex.InnerException?.Message ?? ex.Message);
        }
    }

    public async Task<ServiceResult> DeleteProjectAsync(int id, ProjectActorDto actor)
    {
        var project = await ProjectGraph()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            return ServiceResult.NotFound("Project was not found.");
        }

        if (!CanDeleteProject(project, actor))
        {
            return ServiceResult.Forbidden("You are not allowed to delete this project.");
        }

        _context.Projects.Remove(project);

        try
        {
            await _context.SaveChangesAsync();
            return ServiceResult.Success();
        }
        catch (DbUpdateException ex)
        {
            return ServiceResult.DatabaseError(ex.InnerException?.Message ?? ex.Message);
        }
    }

    public async Task<ServiceResult<ProjectPermissionDto>> GetProjectPermissionsAsync(int id, ProjectActorDto actor)
    {
        var project = await ProjectGraph()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            return ServiceResult<ProjectPermissionDto>.NotFound("Project was not found.");
        }

        var permissions = new ProjectPermissionDto(
            CanEditProject(project, actor),
            CanDeleteProject(project, actor));

        return ServiceResult<ProjectPermissionDto>.Success(permissions);
    }

    public Task<int> CountProjectsAsync() => _context.Projects.CountAsync();

    public async Task<IReadOnlyList<ProjectCountPerYearDto>> GetProjectCountPerYearAsync()
    {
        return await _context.SchoolYearProjects
            .AsNoTracking()
            .GroupBy(s => new { s.SchoolYearId, s.SchoolYear!.Year })
            .OrderBy(g => g.Key.Year)
            .Select(g => new ProjectCountPerYearDto(g.Key.SchoolYearId, g.Key.Year, g.Count()))
            .ToListAsync();
    }

    private IQueryable<Project> ProjectGraph() =>
        _context.Projects
            .Include(p => p.SchoolYearProjects)
            .ThenInclude(s => s.SchoolYear)
            .Include(p => p.ProjectStudents)
            .ThenInclude(s => s.StudentClassHistory)
            .ThenInclude(h => h!.Student)
            .Include(p => p.ProjectStudents)
            .ThenInclude(s => s.StudentClassHistory)
            .ThenInclude(h => h!.StudentClass)
            .Include(p => p.ProjectStudents)
            .ThenInclude(s => s.StudentClassHistory)
            .ThenInclude(h => h!.SchoolYear)
            .Include(p => p.ProjectSupervisors)
            .ThenInclude(s => s.Professor)
            .Include(p => p.ApprovedByProfessor);

    private static IQueryable<Project> ApplyProjectFilter(IQueryable<Project> query, ProjectFilterDto filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(p =>
                p.Title.ToLower().Contains(search) ||
                p.Description.ToLower().Contains(search) ||
                (p.Technology != null && p.Technology.ToLower().Contains(search)) ||
                p.ProjectStudents.Any(s =>
                    s.StudentClassHistory != null &&
                    s.StudentClassHistory.Student != null &&
                    (s.StudentClassHistory.Student.FirstName.ToLower().Contains(search) ||
                     s.StudentClassHistory.Student.LastName.ToLower().Contains(search))) ||
                p.ProjectSupervisors.Any(s =>
                    s.Professor != null &&
                    (s.Professor.FirstName.ToLower().Contains(search) ||
                     s.Professor.LastName.ToLower().Contains(search))));
        }

        if (filter.SchoolYearId.HasValue)
        {
            query = query.Where(p => p.SchoolYearProjects.Any(y => y.SchoolYearId == filter.SchoolYearId.Value));
        }

        if (filter.ClassId.HasValue)
        {
            query = query.Where(p => p.ProjectStudents.Any(s =>
                s.StudentClassHistory != null &&
                s.StudentClassHistory.ClassId == filter.ClassId.Value));
        }

        if (!string.IsNullOrWhiteSpace(filter.SupervisorId))
        {
            query = query.Where(p => p.ProjectSupervisors.Any(s => s.ProfessorId == filter.SupervisorId));
        }

        if (filter.ProjectType.HasValue)
        {
            query = query.Where(p => p.ProjectType == filter.ProjectType.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(p => p.Status == filter.Status.Value);
        }

        return query;
    }

    private async Task<ServiceResult> ValidateProjectDataAsync(
        string title,
        string description,
        IReadOnlyList<int> schoolYearIds,
        IReadOnlyList<ProjectStudentWriteDto> students,
        IReadOnlyList<ProjectSupervisorWriteDto> supervisors)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return ServiceResult.ValidationError("Project title is required.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            return ServiceResult.ValidationError("Project description is required.");
        }

        var selectedSchoolYearIds = schoolYearIds.Distinct().ToList();
        if (selectedSchoolYearIds.Count == 0)
        {
            return ServiceResult.ValidationError("At least one school year is required.");
        }

        var existingSchoolYearCount = await _context.SchoolYears
            .CountAsync(s => selectedSchoolYearIds.Contains(s.Id));
        if (existingSchoolYearCount != selectedSchoolYearIds.Count)
        {
            return ServiceResult.ValidationError("At least one selected school year does not exist.");
        }

        var historyIds = students.Select(s => s.HistoryId).Distinct().ToList();
        if (historyIds.Count > 0)
        {
            var existingHistoryCount = await _context.StudentClassHistories
                .CountAsync(h => historyIds.Contains(h.Id));
            if (existingHistoryCount != historyIds.Count)
            {
                return ServiceResult.ValidationError("At least one selected student history does not exist.");
            }
        }

        var professorIds = supervisors
            .Select(s => s.ProfessorId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();

        if (professorIds.Count > 0)
        {
            var existingProfessorCount = await _context.Professors
                .CountAsync(p => professorIds.Contains(p.Id));
            if (existingProfessorCount != professorIds.Count)
            {
                return ServiceResult.ValidationError("At least one selected professor does not exist.");
            }
        }

        return ServiceResult.Success();
    }

    private void ReplaceSchoolYears(Project project, IReadOnlyList<int> schoolYearIds)
    {
        var selectedIds = schoolYearIds.Distinct().ToList();
        var removedSchoolYears = project.SchoolYearProjects
            .Where(s => !selectedIds.Contains(s.SchoolYearId))
            .ToList();

        _context.SchoolYearProjects.RemoveRange(removedSchoolYears);

        foreach (var schoolYearId in selectedIds)
        {
            if (project.SchoolYearProjects.Any(s => s.SchoolYearId == schoolYearId))
            {
                continue;
            }

            project.SchoolYearProjects.Add(new SchoolYearProject
            {
                ProjectId = project.Id,
                SchoolYearId = schoolYearId
            });
        }
    }

    private void ReplaceStudents(Project project, IReadOnlyList<ProjectStudentWriteDto> students)
    {
        var selectedStudents = students
            .DistinctBy(s => s.HistoryId)
            .ToList();

        var selectedHistoryIds = selectedStudents
            .Select(s => s.HistoryId)
            .ToList();

        var removedStudents = project.ProjectStudents
            .Where(s => !selectedHistoryIds.Contains(s.HistoryId))
            .ToList();

        _context.ProjectStudents.RemoveRange(removedStudents);

        foreach (var student in selectedStudents)
        {
            var existingStudent = project.ProjectStudents
                .FirstOrDefault(s => s.HistoryId == student.HistoryId);

            if (existingStudent != null)
            {
                existingStudent.Role = string.IsNullOrWhiteSpace(student.Role) ? "Student" : student.Role.Trim();
                continue;
            }

            project.ProjectStudents.Add(new ProjectStudent
            {
                ProjectId = project.Id,
                HistoryId = student.HistoryId,
                Role = string.IsNullOrWhiteSpace(student.Role) ? "Student" : student.Role.Trim()
            });
        }
    }

    private void ReplaceSupervisors(Project project, IReadOnlyList<ProjectSupervisorWriteDto> supervisors)
    {
        var selectedSupervisors = supervisors
            .DistinctBy(s => s.ProfessorId)
            .ToList();

        var selectedProfessorIds = selectedSupervisors
            .Select(s => s.ProfessorId)
            .ToList();

        var removedSupervisors = project.ProjectSupervisors
            .Where(s => !selectedProfessorIds.Contains(s.ProfessorId))
            .ToList();

        _context.ProjectSupervisors.RemoveRange(removedSupervisors);

        foreach (var supervisor in selectedSupervisors)
        {
            var existingSupervisor = project.ProjectSupervisors
                .FirstOrDefault(s => s.ProfessorId == supervisor.ProfessorId);

            if (existingSupervisor != null)
            {
                existingSupervisor.Role = string.IsNullOrWhiteSpace(supervisor.Role) ? "Supervisor" : supervisor.Role.Trim();
                continue;
            }

            project.ProjectSupervisors.Add(new ProjectSupervisor
            {
                ProjectId = project.Id,
                ProfessorId = supervisor.ProfessorId,
                Role = string.IsNullOrWhiteSpace(supervisor.Role) ? "Supervisor" : supervisor.Role.Trim()
            });
        }
    }

    private static bool CanEditProject(Project project, ProjectActorDto actor)
    {
        if (!actor.IsAuthenticated || actor.IsAdmin)
        {
            return true;
        }

        return (actor.IsProfessor && IsAssignedProfessor(project, actor.Username)) ||
               (actor.IsStudent && IsAssignedStudent(project, actor.Username));
    }

    private static bool CanDeleteProject(Project project, ProjectActorDto actor)
    {
        if (!actor.IsAuthenticated || actor.IsAdmin)
        {
            return true;
        }

        return actor.IsProfessor && IsAssignedProfessor(project, actor.Username);
    }

    private static bool IsAssignedProfessor(Project project, string? username) =>
        !string.IsNullOrWhiteSpace(username) &&
        project.ProjectSupervisors.Any(s => string.Equals(s.ProfessorId, username, StringComparison.OrdinalIgnoreCase));

    private static bool IsAssignedStudent(Project project, string? username) =>
        !string.IsNullOrWhiteSpace(username) &&
        project.ProjectStudents.Any(s =>
            s.StudentClassHistory != null &&
            string.Equals(s.StudentClassHistory.StudentId, username, StringComparison.OrdinalIgnoreCase));

    // --- Workflow Methods ---
    public async Task<ServiceResult<ProjectDto>> SubmitForApprovalAsync(int id, ProjectActorDto actor)
    {
        var project = await ProjectGraph().FirstOrDefaultAsync(p => p.Id == id);
        if (project is null)
        {
            return ServiceResult<ProjectDto>.NotFound($"Project with ID {id} not found.");
        }

        if (!CanEditProject(project, actor))
        {
            return ServiceResult<ProjectDto>.Forbidden("You do not have permission to submit this project.");
        }

        project.Status = ProjectStatus.Pending;
        project.SubmittedAtUtc = DateTime.UtcNow;
        project.ApprovalNote = null;

        await _context.SaveChangesAsync();
        return ServiceResult<ProjectDto>.Success(ToDto(project));
    }

    public async Task<ServiceResult<ProjectDto>> ApproveProjectAsync(int id, ProjectApprovalDto dto, ProjectActorDto actor)
    {
        var project = await ProjectGraph().FirstOrDefaultAsync(p => p.Id == id);
        if (project is null)
        {
            return ServiceResult<ProjectDto>.NotFound($"Project with ID {id} not found.");
        }

        if (actor.IsAuthenticated && !actor.IsAdmin && (!actor.IsProfessor || !IsAssignedProfessor(project, actor.Username)))
        {
            return ServiceResult<ProjectDto>.Forbidden("Only assigned supervisors or administrators can approve projects.");
        }

        string? profId = actor.Username ?? project.ProjectSupervisors.FirstOrDefault()?.ProfessorId;
        if (!string.IsNullOrWhiteSpace(profId))
        {
            var exists = await _context.Professors.AnyAsync(p => p.Id == profId);
            if (!exists)
            {
                profId = project.ProjectSupervisors.FirstOrDefault()?.ProfessorId;
                if (!string.IsNullOrWhiteSpace(profId))
                {
                    exists = await _context.Professors.AnyAsync(p => p.Id == profId);
                    if (!exists) profId = null;
                }
                else
                {
                    profId = null;
                }
            }
        }

        project.Status = ProjectStatus.OnGoing;
        project.ApprovedAtUtc = DateTime.UtcNow;
        project.ApprovedByProfessorId = profId;
        project.ApprovalNote = dto.Note?.Trim();

        await _context.SaveChangesAsync();
        return ServiceResult<ProjectDto>.Success(ToDto(project));
    }

    public async Task<ServiceResult<ProjectDto>> RejectProjectAsync(int id, ProjectApprovalDto dto, ProjectActorDto actor)
    {
        var project = await ProjectGraph().FirstOrDefaultAsync(p => p.Id == id);
        if (project is null)
        {
            return ServiceResult<ProjectDto>.NotFound($"Project with ID {id} not found.");
        }

        if (actor.IsAuthenticated && !actor.IsAdmin && (!actor.IsProfessor || !IsAssignedProfessor(project, actor.Username)))
        {
            return ServiceResult<ProjectDto>.Forbidden("Only assigned supervisors or administrators can reject projects.");
        }

        project.Status = ProjectStatus.Rejected;
        project.ApprovalNote = dto.Note?.Trim();

        await _context.SaveChangesAsync();
        return ServiceResult<ProjectDto>.Success(ToDto(project));
    }

    public async Task<ServiceResult<ProjectDto>> PublishProjectAsync(int id, ProjectApprovalDto dto, ProjectActorDto actor)
    {
        var project = await ProjectGraph().FirstOrDefaultAsync(p => p.Id == id);
        if (project is null)
        {
            return ServiceResult<ProjectDto>.NotFound($"Project with ID {id} not found.");
        }

        if (actor.IsAuthenticated && !actor.IsAdmin && (!actor.IsProfessor || !IsAssignedProfessor(project, actor.Username)))
        {
            return ServiceResult<ProjectDto>.Forbidden("Only assigned supervisors or administrators can publish projects.");
        }

        project.Status = ProjectStatus.Published;
        if (!string.IsNullOrWhiteSpace(dto.Note))
        {
            project.ApprovalNote = dto.Note.Trim();
        }

        await _context.SaveChangesAsync();
        return ServiceResult<ProjectDto>.Success(ToDto(project));
    }

    public async Task<IReadOnlyList<ProjectDto>> GetPendingApprovalsAsync(ProjectFilterDto filter, ProjectActorDto actor)
    {
        var query = ProjectGraph().AsNoTracking().Where(p => p.Status == ProjectStatus.Pending);

        if (actor.IsAuthenticated && actor.IsProfessor && !actor.IsAdmin && !string.IsNullOrWhiteSpace(actor.Username))
        {
            var username = actor.Username.Trim().ToLower();
            query = query.Where(p => p.ProjectSupervisors.Any(s => s.ProfessorId.ToLower() == username));
        }

        query = ApplyProjectFilter(query, filter);
        var projects = await query.OrderByDescending(p => p.SubmittedAtUtc).ThenBy(p => p.Title).ToListAsync();
        return projects.Select(ToDto).ToList();
    }

    private static ProjectDto ToDto(Project project)
    {
        var schoolYears = project.SchoolYearProjects
            .Where(s => s.SchoolYear != null)
            .OrderBy(s => s.SchoolYear!.Year)
            .Select(s => new SchoolYearDto(s.SchoolYearId, s.SchoolYear!.Year))
            .ToList();

        var students = project.ProjectStudents
            .Where(s => s.StudentClassHistory?.Student != null && s.StudentClassHistory.StudentClass != null && s.StudentClassHistory.SchoolYear != null)
            .OrderBy(s => s.StudentClassHistory!.Student!.LastName)
            .ThenBy(s => s.StudentClassHistory!.Student!.FirstName)
            .Select(s => new ProjectStudentDto(
                s.Id,
                s.HistoryId,
                s.StudentClassHistory!.StudentId,
                s.StudentClassHistory.Student!.FirstName,
                s.StudentClassHistory.Student.LastName,
                s.StudentClassHistory.StudentClass!.Name,
                s.StudentClassHistory.StudentClass.Branch,
                s.StudentClassHistory.SchoolYearId,
                s.StudentClassHistory.SchoolYear!.Year,
                s.Role))
            .ToList();

        var supervisors = project.ProjectSupervisors
            .Where(s => s.Professor != null)
            .OrderBy(s => s.Professor!.LastName)
            .ThenBy(s => s.Professor!.FirstName)
            .Select(s => new ProjectSupervisorDto(
                s.Id,
                s.ProfessorId,
                s.Professor!.FirstName,
                s.Professor.LastName,
                s.Role))
            .ToList();

        string? approvedByName = null;
        if (project.ApprovedByProfessor != null)
        {
            approvedByName = $"{project.ApprovedByProfessor.FirstName} {project.ApprovedByProfessor.LastName}";
        }

        return new ProjectDto(
            project.Id,
            project.Title,
            project.Description,
            project.GithubUrl,
            project.LogoUrl,
            project.Status,
            project.Technology,
            project.ProjectType,
            project.ApprovalNote,
            project.SubmittedAtUtc,
            project.ApprovedAtUtc,
            project.ApprovedByProfessorId,
            approvedByName,
            project.IsExternal,
            project.ExternalSchoolName,
            project.HasConsent,
            project.ConsentConfirmedAtUtc,
            project.ConsentConfirmedBy,
            schoolYears,
            students,
            supervisors);
    }

    private static string? NullIfWhiteSpace(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool IsUniqueConstraintViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
