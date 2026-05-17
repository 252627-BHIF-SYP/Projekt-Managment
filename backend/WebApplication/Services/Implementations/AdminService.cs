using Microsoft.EntityFrameworkCore;
using Persistence;
using Persistence.Entities;
using Services.Interfaces;

namespace Services.Implementations;

public class AdminService(ApplicationDbContext context) : IAdminService
{
    private readonly ApplicationDbContext _context = context;

    public async Task<AdminStatsDto> GetStatsAsync()
    {
        var schoolYearsCount = await _context.SchoolYears.CountAsync();
        var studentClassesCount = await _context.StudentClasses.CountAsync();
        var projectsCount = await _context.Projects.CountAsync();
        var projectsInProgress = await _context.Projects.CountAsync(p => p.Status == ProjectStatus.OnGoing);
        var projectsCompleted = await _context.Projects.CountAsync(p => p.Status == ProjectStatus.Completed);
        var studentsCount = await _context.Students.CountAsync();
        var professorsCount = await _context.Professors.CountAsync();

        return new AdminStatsDto(
            schoolYearsCount,
            studentClassesCount,
            projectsCount,
            projectsInProgress,
            projectsCompleted,
            studentsCount,
            professorsCount);
    }
}
