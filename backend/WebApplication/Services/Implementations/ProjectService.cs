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
        var validation = await ValidateCreateProjectAsync(dto);
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
            .ThenInclude(s => s.Professor);

    private async Task<ServiceResult> ValidateCreateProjectAsync(CreateProjectDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return ServiceResult.ValidationError("Project title is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Description))
        {
            return ServiceResult.ValidationError("Project description is required.");
        }

        var schoolYearIds = dto.SchoolYearIds.Distinct().ToList();
        if (schoolYearIds.Count == 0)
        {
            return ServiceResult.ValidationError("At least one school year is required.");
        }

        var existingSchoolYearCount = await _context.SchoolYears
            .CountAsync(s => schoolYearIds.Contains(s.Id));
        if (existingSchoolYearCount != schoolYearIds.Count)
        {
            return ServiceResult.ValidationError("At least one selected school year does not exist.");
        }

        var historyIds = dto.Students.Select(s => s.HistoryId).Distinct().ToList();
        if (historyIds.Count > 0)
        {
            var existingHistoryCount = await _context.StudentClassHistories
                .CountAsync(h => historyIds.Contains(h.Id));
            if (existingHistoryCount != historyIds.Count)
            {
                return ServiceResult.ValidationError("At least one selected student history does not exist.");
            }
        }

        var professorIds = dto.Supervisors.Select(s => s.ProfessorId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToList();
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

        return new ProjectDto(
            project.Id,
            project.Title,
            project.Description,
            project.GithubUrl,
            project.LogoUrl,
            project.Status,
            project.Technology,
            project.ProjectType,
            schoolYears,
            students,
            supervisors);
    }

    private static string? NullIfWhiteSpace(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool IsUniqueConstraintViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };
}
